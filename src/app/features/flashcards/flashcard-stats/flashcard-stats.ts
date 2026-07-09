import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Flashcard, ReviewLogEntry } from '../models/flashcard.model';
import { FlashcardsService } from '../services/flashcards.service';
import { ReviewLogService } from '../services/review-log.service';
import { bucketByDay, bySubject, currentStreak, weakestCards } from '../utils/stats.util';

const WINDOW_DAYS = 30;
const WEAKEST_LIMIT = 5;

@Component({
  selector: 'app-flashcard-stats',
  imports: [RouterLink],
  templateUrl: './flashcard-stats.html',
  styleUrl: './flashcard-stats.scss'
})
export class FlashcardStats {
  private readonly flashcardsService = inject(FlashcardsService);
  private readonly reviewLogService = inject(ReviewLogService);

  protected readonly windowDays = WINDOW_DAYS;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly entries = signal<ReviewLogEntry[]>([]);
  protected readonly cards = signal<Flashcard[]>([]);

  protected readonly streak = computed(() => currentStreak(this.entries()));
  protected readonly days = computed(() => bucketByDay(this.entries(), WINDOW_DAYS));
  protected readonly subjectTally = computed(() => bySubject(this.entries()));

  protected readonly totalReviews = computed(() => this.entries().length);
  protected readonly totalKnown = computed(
    () => this.entries().filter((entry) => entry.outcome === 'known').length
  );
  protected readonly accuracy = computed(() =>
    this.totalReviews() === 0 ? 0 : Math.round((this.totalKnown() / this.totalReviews()) * 100)
  );
  protected readonly reviewedToday = computed(() => {
    const today = this.days().at(-1);
    return today?.total ?? 0;
  });

  /** Altezza massima del grafico, per normalizzare le barre. */
  protected readonly peak = computed(() =>
    Math.max(1, ...this.days().map((day) => day.total))
  );

  protected readonly masteredCount = computed(
    () => this.cards().filter((card) => card.mastery_level === 'mastered').length
  );

  protected readonly weakest = computed(() => {
    const byId = new Map(this.cards().map((card) => [card.id, card]));
    return weakestCards(this.entries(), WEAKEST_LIMIT)
      .map((item) => ({ ...item, card: byId.get(item.flashcardId) }))
      .filter((item) => item.card);
  });

  protected readonly hasData = computed(() => this.entries().length > 0);

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(undefined);

    const since = new Date();
    since.setDate(since.getDate() - (WINDOW_DAYS - 1));
    since.setHours(0, 0, 0, 0);

    try {
      const [entries, cards] = await Promise.all([
        firstValueFrom(this.reviewLogService.getSince(since)),
        firstValueFrom(this.flashcardsService.getAll())
      ]);
      this.entries.set(entries);
      this.cards.set(cards);
    } catch (e) {
      console.error('Statistiche non caricate', e);
      this.error.set(
        'Non riesco a leggere lo storico. Hai eseguito la migrazione che crea la tabella review_log?'
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected barHeight(total: number): number {
    return total === 0 ? 3 : Math.max(6, Math.round((total / this.peak()) * 100));
  }

  protected accuracyOf(known: number, total: number): number {
    return total === 0 ? 0 : Math.round((known / total) * 100);
  }
}
