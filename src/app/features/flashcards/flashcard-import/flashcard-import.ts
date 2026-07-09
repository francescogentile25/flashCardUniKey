import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CreateFlashcardRequest, DEFAULT_SUBJECT } from '../models/flashcard.model';
import { FlashcardsService, GeneratedCard } from '../services/flashcards.service';
import { allocateCounts, chunkText } from '../utils/chunk-text.util';
import { extractPdfText } from '../utils/pdf-text.util';

const RATE_LIMIT_BACKOFF_MS = 25_000;
const MAX_ATTEMPTS_PER_CHUNK = 3;
/** Contesto salvato con ogni card per poter tornare al testo di partenza. */
const EXCERPT_CHARS = 600;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type DraftCard = CreateFlashcardRequest & { include: boolean };

@Component({
  selector: 'app-flashcard-import',
  imports: [RouterLink],
  templateUrl: './flashcard-import.html',
  styleUrl: './flashcard-import.scss'
})
export class FlashcardImport {
  private readonly flashcardsService = inject(FlashcardsService);

  protected readonly fileName = signal<string | undefined>(undefined);
  protected readonly subject = signal(DEFAULT_SUBJECT);
  protected readonly sourceText = signal('');
  protected readonly count = signal(12);
  protected readonly drafts = signal<DraftCard[]>([]);

  protected readonly extracting = signal(false);
  protected readonly generating = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly savedMessage = signal<string | undefined>(undefined);
  protected readonly progress = signal<{ done: number; total: number } | undefined>(undefined);

  protected readonly progressLabel = computed(() => {
    const p = this.progress();
    if (!p || p.total <= 1) {
      return undefined;
    }
    return `Blocco ${Math.min(p.done + 1, p.total)} di ${p.total} — testo lungo, può servire qualche minuto.`;
  });

  protected readonly charCount = computed(() => this.sourceText().length);
  protected readonly selectedCount = computed(
    () => this.drafts().filter((card) => card.include).length
  );
  protected readonly canGenerate = computed(
    () => this.charCount() >= 40 && !this.extracting() && !this.generating()
  );

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.reset();
    this.fileName.set(file.name);
    this.subject.set(subjectFromFileName(file.name));
    this.extracting.set(true);

    try {
      const text = await extractPdfText(file);
      this.sourceText.set(text);
      if (text.length < 40) {
        this.error.set('Il PDF non contiene testo estraibile (forse e scansionato come immagine).');
      }
    } catch (e) {
      console.error('Estrazione PDF fallita', e);
      this.error.set('Non riesco a leggere il PDF. Prova con un altro file.');
    } finally {
      this.extracting.set(false);
      input.value = '';
    }
  }

  protected onTextInput(event: Event): void {
    this.sourceText.set((event.target as HTMLTextAreaElement).value);
  }

  protected onSubjectInput(event: Event): void {
    this.subject.set((event.target as HTMLInputElement).value);
  }

  protected onCountInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.count.set(Math.max(1, Math.min(30, Number.isFinite(value) ? value : 12)));
  }

  protected async generate(): Promise<void> {
    if (!this.canGenerate()) {
      return;
    }

    this.generating.set(true);
    this.error.set(undefined);
    this.savedMessage.set(undefined);
    this.drafts.set([]);

    // Testi lunghi: spezzati in blocchi, le card richieste vengono distribuite sui blocchi.
    const chunks = chunkText(this.sourceText());
    const counts = allocateCounts(
      chunks.map((chunk) => chunk.length),
      this.count()
    );
    const jobs = chunks
      .map((chunk, i) => ({ chunk, count: counts[i] }))
      .filter((job) => job.count > 0);

    this.progress.set({ done: 0, total: jobs.length });

    const collected: DraftCard[] = [];
    let failedChunks = 0;

    try {
      for (const job of jobs) {
        const cards = await this.generateChunk(job.chunk, job.count);
        if (cards) {
          collected.push(...cards.map((card) => this.toDraft(card, job.chunk)));
        } else {
          failedChunks++;
          if (collected.length === 0 && failedChunks >= 2) {
            break; // niente funziona: inutile continuare a martellare la funzione
          }
        }
        this.progress.update((p) => p && { ...p, done: p.done + 1 });
      }

      const unique = this.dedupeCards(collected);
      if (unique.length === 0) {
        this.error.set(
          'Generazione non riuscita. Verifica che la Edge Function sia deployata e GROQ_API_KEY configurata.'
        );
        return;
      }

      this.drafts.set(unique);
      if (failedChunks > 0) {
        this.error.set(
          `${failedChunks} blocchi su ${jobs.length} non generati (probabile rate limit). Prodotte ${unique.length} card.`
        );
      }
    } finally {
      this.generating.set(false);
      this.progress.set(undefined);
    }
  }

  /** Una chiamata per blocco, con retry e backoff quando Groq risponde 429. */
  private async generateChunk(chunk: string, count: number): Promise<GeneratedCard[] | undefined> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_CHUNK; attempt++) {
      try {
        const { cards } = await firstValueFrom(this.flashcardsService.generateFromText(chunk, count));
        return cards ?? [];
      } catch (e) {
        console.error(`Generazione blocco fallita (tentativo ${attempt})`, e);
        const detail = String((e as { error?: { error?: string } })?.error?.error ?? '');
        const rateLimited = /429|rate.?limit/i.test(detail);
        if (!rateLimited || attempt === MAX_ATTEMPTS_PER_CHUNK) {
          return undefined;
        }
        await delay(RATE_LIMIT_BACKOFF_MS);
      }
    }
    return undefined;
  }

  /** Ogni card ricorda da quale PDF e da quale porzione di testo e nata. */
  private toDraft(card: GeneratedCard, chunk: string): DraftCard {
    return {
      question: card.question,
      answer: card.answer,
      subject: this.subject().trim() || DEFAULT_SUBJECT,
      source_file: this.fileName() ?? null,
      source_excerpt: chunk.slice(0, EXCERPT_CHARS).trim(),
      include: true
    };
  }

  private dedupeCards(cards: DraftCard[]): DraftCard[] {
    const seen = new Set<string>();
    return cards.filter((card) => {
      const key = card.question.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  protected toggleInclude(index: number): void {
    this.drafts.update((cards) =>
      cards.map((card, i) => (i === index ? { ...card, include: !card.include } : card))
    );
  }

  protected updateDraft(index: number, field: 'question' | 'answer', event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.drafts.update((cards) =>
      cards.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  }

  protected removeDraft(index: number): void {
    this.drafts.update((cards) => cards.filter((_, i) => i !== index));
  }

  protected async save(): Promise<void> {
    const subject = this.subject().trim() || DEFAULT_SUBJECT;
    const selected = this.drafts()
      .filter((card) => card.include && card.question.trim() && card.answer.trim())
      .map<CreateFlashcardRequest>((card) => ({
        question: card.question.trim(),
        answer: card.answer.trim(),
        subject,
        source_file: card.source_file,
        source_excerpt: card.source_excerpt
      }));

    if (selected.length === 0) {
      this.error.set('Nessuna card selezionata da salvare.');
      return;
    }

    this.saving.set(true);
    this.error.set(undefined);
    this.savedMessage.set(undefined);

    try {
      const created = await firstValueFrom(this.flashcardsService.createMany(selected));
      this.savedMessage.set(`Salvate ${created.length} card in ${subject}.`);
      this.drafts.set([]);
    } catch {
      this.error.set('Salvataggio non riuscito. Controlla la policy INSERT su Supabase.');
    } finally {
      this.saving.set(false);
    }
  }

  private reset(): void {
    this.error.set(undefined);
    this.savedMessage.set(undefined);
    this.drafts.set([]);
    this.sourceText.set('');
  }
}

/**
 * Propone la materia dal nome del file: toglie estensione, sigle iniziali
 * ("a1.5") e tutto cio che segue un trattino di attribuzione.
 */
export function subjectFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.pdf$/i, '');
  const beforeAttribution = withoutExtension.split(/\s+-\s+/)[0];
  const withoutCode = beforeAttribution.replace(/^[a-z]?\d+(\.\d+)*\s+/i, '');
  const cleaned = withoutCode.replace(/\s+/g, ' ').trim();

  if (cleaned.length < 2) {
    return DEFAULT_SUBJECT;
  }
  return cleaned.length > 60 ? `${cleaned.slice(0, 57).trim()}...` : cleaned;
}
