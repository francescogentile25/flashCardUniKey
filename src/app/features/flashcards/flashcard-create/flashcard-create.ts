import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormState } from '../../../core/utils/simple-form-model.util';
import {
  CreateFlashcardRequest,
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

  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal<string | undefined>(undefined);

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

  protected setArea(area: FlashcardArea): void {
    this.state.update((value) => ({ ...value, area }));
  }

  protected setLevel(level: FlashcardLevel): void {
    this.state.update((value) => ({ ...value, level }));
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.cardForm, async () => {
      this.saving.set(true);
      this.saved.set(false);
      this.error.set(undefined);

      try {
        await firstValueFrom(this.flashcardsService.create(this.state()));
        const { area, level } = this.state();
        this.state.set({ question: '', answer: '', area, level });
        this.saved.set(true);
      } catch {
        this.error.set('Salvataggio non riuscito. Controlla tabella e policy INSERT su Supabase.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
