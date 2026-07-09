import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Flashcard } from '../models/flashcard.model';
import { FlashcardsService } from '../services/flashcards.service';
import { ReviewSyncService } from '../services/review-sync.service';
import { buildQuiz, OPTIONS_PER_QUESTION, QuizQuestion } from '../utils/quiz.util';

const ALL_SUBJECTS = '__all__';
const DEFAULT_LENGTH = 10;

@Component({
  selector: 'app-flashcard-quiz',
  imports: [RouterLink],
  templateUrl: './flashcard-quiz.html',
  styleUrl: './flashcard-quiz.scss'
})
export class FlashcardQuiz {
  private readonly flashcardsService = inject(FlashcardsService);
  private readonly reviewSync = inject(ReviewSyncService);

  protected readonly allSubjects = ALL_SUBJECTS;
  protected readonly minCards = OPTIONS_PER_QUESTION;

  protected readonly cards = signal<Flashcard[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | undefined>(undefined);

  protected readonly subject = signal<string>(ALL_SUBJECTS);
  protected readonly length = signal(DEFAULT_LENGTH);

  protected readonly questions = signal<QuizQuestion[]>([]);
  protected readonly index = signal(0);
  /** Indice dell'opzione scelta per la domanda corrente; null = non ancora risposto. */
  protected readonly picked = signal<number | null>(null);
  protected readonly correctCount = signal(0);
  protected readonly finished = signal(false);

  protected readonly subjects = computed(() =>
    [...new Set(this.cards().map((card) => card.subject))].sort((a, b) => a.localeCompare(b))
  );

  protected readonly scopedCards = computed(() => {
    const subject = this.subject();
    const cards = this.cards();
    return subject === ALL_SUBJECTS ? cards : cards.filter((card) => card.subject === subject);
  });

  protected readonly canStart = computed(() => this.scopedCards().length >= OPTIONS_PER_QUESTION);
  protected readonly started = computed(() => this.questions().length > 0);
  protected readonly current = computed(() => this.questions()[this.index()] ?? null);
  protected readonly total = computed(() => this.questions().length);
  protected readonly answered = computed(() => this.picked() !== null);
  protected readonly scorePercent = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.correctCount() / this.total()) * 100)
  );

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

  protected setSubject(subject: string): void {
    this.subject.set(subject);
    this.reset();
  }

  protected onLengthInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.length.set(Math.max(3, Math.min(30, Number.isFinite(value) ? value : DEFAULT_LENGTH)));
  }

  protected start(): void {
    const questions = buildQuiz(this.scopedCards(), this.length());
    if (questions.length === 0) {
      this.error.set(
        `Servono almeno ${OPTIONS_PER_QUESTION} card con risposte diverse per costruire un quiz.`
      );
      return;
    }

    this.error.set(undefined);
    this.questions.set(questions);
    this.index.set(0);
    this.picked.set(null);
    this.correctCount.set(0);
    this.finished.set(false);
  }

  /** Risposta scelta: feedback immediato e ripasso registrato come gli swipe. */
  protected pick(optionIndex: number): void {
    if (this.answered()) {
      return;
    }

    const question = this.current();
    if (!question) {
      return;
    }

    this.picked.set(optionIndex);
    const correct = question.options[optionIndex].correct;
    if (correct) {
      this.correctCount.update((value) => value + 1);
    }
    navigator.vibrate?.(correct ? 25 : [30, 40, 30]);

    void this.reviewSync.submit(question.card, correct ? 'known' : 'unknown', 'quiz');
  }

  protected next(): void {
    if (!this.answered()) {
      return;
    }

    if (this.index() + 1 >= this.total()) {
      this.finished.set(true);
      return;
    }

    this.index.update((value) => value + 1);
    this.picked.set(null);
  }

  protected optionClass(optionIndex: number): string {
    const picked = this.picked();
    if (picked === null) {
      return '';
    }

    const question = this.current();
    if (!question) {
      return '';
    }

    if (question.options[optionIndex].correct) {
      return 'correct';
    }
    return optionIndex === picked ? 'wrong' : 'dimmed';
  }

  protected reset(): void {
    this.questions.set([]);
    this.index.set(0);
    this.picked.set(null);
    this.correctCount.set(0);
    this.finished.set(false);
  }
}
