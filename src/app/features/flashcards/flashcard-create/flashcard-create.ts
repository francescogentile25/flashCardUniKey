import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormState } from '../../../core/utils/simple-form-model.util';
import {
  CreateFlashcardRequest,
  Flashcard,
  FlashcardArea,
  FlashcardLevel
} from '../models/flashcard.model';
import { FlashcardsService } from '../services/flashcards.service';

type CardForm = CreateFlashcardRequest;

@Component({
  selector: 'app-flashcard-create',
  imports: [FormField, RouterLink],
  templateUrl: './flashcard-create.html',
  styleUrl: './flashcard-create.scss'
})
export class FlashcardCreate {
  private readonly flashcardsService = inject(FlashcardsService);

  protected readonly cards = signal<Flashcard[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly savedMessage = signal<string | undefined>(undefined);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly isEditing = computed(() => this.editingId() !== null);

  protected readonly state = signal<FormState<CardForm>>({
    question: '',
    answer: '',
    area: 'frontend',
    level: 'junior'
  });

  protected readonly cardForm = form(this.state, (p) => {
    required(p.question, { message: 'Inserisci la domanda' });
    required(p.answer, { message: 'Inserisci la risposta' });
    required(p.area, { message: 'Scegli FE o BE' });
    required(p.level, { message: 'Scegli il livello' });
  });

  constructor() {
    void this.loadCards();
  }

  protected async loadCards(): Promise<void> {
    this.loading.set(true);
    this.error.set(undefined);

    try {
      this.cards.set(await firstValueFrom(this.flashcardsService.getAll()));
    } catch {
      this.error.set('Non riesco a caricare le card. Controlla Supabase e le policy SELECT.');
    } finally {
      this.loading.set(false);
    }
  }

  protected setArea(area: FlashcardArea): void {
    this.state.update((value) => ({ ...value, area }));
  }

  protected setLevel(level: FlashcardLevel): void {
    this.state.update((value) => ({ ...value, level }));
  }

  protected editCard(card: Flashcard): void {
    this.editingId.set(card.id);
    this.savedMessage.set(undefined);
    this.error.set(undefined);
    this.state.set({
      question: card.question,
      answer: card.answer,
      area: card.area,
      level: card.level
    });
  }

  protected resetForm(): void {
    const { area, level } = this.state();
    this.editingId.set(null);
    this.state.set({ question: '', answer: '', area, level });
  }

  protected async deleteCard(card: Flashcard): Promise<void> {
    const confirmed = window.confirm(`Eliminare questa flash card?\n\n${card.question}`);
    if (!confirmed) {
      return;
    }

    this.deletingId.set(card.id);
    this.savedMessage.set(undefined);
    this.error.set(undefined);

    try {
      await firstValueFrom(this.flashcardsService.delete(card.id));
      this.cards.update((cards) => cards.filter((item) => item.id !== card.id));
      if (this.editingId() === card.id) {
        this.resetForm();
      }
      this.savedMessage.set('Card eliminata.');
    } catch {
      this.error.set('Eliminazione non riuscita. Controlla la policy DELETE su Supabase.');
    } finally {
      this.deletingId.set(null);
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.cardForm, async () => {
      this.saving.set(true);
      this.savedMessage.set(undefined);
      this.error.set(undefined);

      try {
        const editingId = this.editingId();
        if (editingId) {
          const [updated] = await firstValueFrom(
            this.flashcardsService.updateDetails(editingId, this.state())
          );
          if (updated) {
            this.cards.update((cards) =>
              cards.map((card) => (card.id === updated.id ? updated : card))
            );
          }
          this.savedMessage.set('Card aggiornata.');
          this.resetForm();
          return;
        }

        const [created] = await firstValueFrom(this.flashcardsService.create(this.state()));
        if (created) {
          this.cards.update((cards) => [...cards, created]);
        }

        const { area, level } = this.state();
        this.state.set({ question: '', answer: '', area, level });
        this.savedMessage.set('Card salvata.');
      } catch {
        this.error.set('Salvataggio non riuscito. Controlla le policy INSERT/UPDATE su Supabase.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
