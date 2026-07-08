import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CreateFlashcardRequest } from '../models/flashcard.model';
import { FlashcardsService } from '../services/flashcards.service';
import { extractPdfText } from '../utils/pdf-text.util';

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
  protected readonly sourceText = signal('');
  protected readonly count = signal(12);
  protected readonly drafts = signal<DraftCard[]>([]);

  protected readonly extracting = signal(false);
  protected readonly generating = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly savedMessage = signal<string | undefined>(undefined);

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
    this.extracting.set(true);

    try {
      const text = await extractPdfText(file);
      this.sourceText.set(text);
      if (text.length < 40) {
        this.error.set('Il PDF non contiene testo estraibile (forse e scansionato come immagine).');
      }
    } catch {
      this.error.set('Non riesco a leggere il PDF. Prova con un altro file.');
    } finally {
      this.extracting.set(false);
      input.value = '';
    }
  }

  protected onTextInput(event: Event): void {
    this.sourceText.set((event.target as HTMLTextAreaElement).value);
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

    try {
      const { cards } = await firstValueFrom(
        this.flashcardsService.generateFromText(this.sourceText(), this.count())
      );

      if (!cards?.length) {
        this.error.set('Gemini non ha prodotto domande. Riprova o accorcia il testo.');
        return;
      }

      this.drafts.set(cards.map((card) => ({ ...card, include: true })));
    } catch {
      this.error.set(
        'Generazione non riuscita. Verifica che la Edge Function sia deployata e GEMINI_API_KEY configurata.'
      );
    } finally {
      this.generating.set(false);
    }
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
    const selected = this.drafts()
      .filter((card) => card.include && card.question.trim() && card.answer.trim())
      .map<CreateFlashcardRequest>((card) => ({
        question: card.question.trim(),
        answer: card.answer.trim()
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
      this.savedMessage.set(`Salvate ${created.length} card nel deck.`);
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
