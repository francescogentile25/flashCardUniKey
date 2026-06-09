import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  Flashcard,
  FlashcardMastery,
  SwipeOutcome,
  UpdateFlashcardReviewRequest
} from '../models/flashcard.model';
import { FlashcardsService } from '../services/flashcards.service';

type StudyMode = 'today' | 'review' | 'simulation';

type ModeConfig = {
  id: StudyMode;
  label: string;
  caption: string;
};

const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'today',
    label: 'Oggi',
    caption: 'Priorita automatica per lo sprint'
  },
  {
    id: 'review',
    label: 'Ripasso',
    caption: 'Solo le domande deboli'
  },
  {
    id: 'simulation',
    label: 'Simulazione',
    caption: 'Misto colloquio FE/BE'
  }
];

@Component({
  selector: 'app-flashcards-home',
  imports: [RouterLink],
  templateUrl: './flashcards-home.html',
  styleUrl: './flashcards-home.scss'
})
export class FlashcardsHome {
  private readonly flashcardsService = inject(FlashcardsService);

  protected readonly modes = MODE_CONFIGS;
  protected readonly activeMode = signal<StudyMode>('today');
  protected readonly cards = signal<Flashcard[]>([]);
  protected readonly queue = signal<Flashcard[]>([]);
  protected readonly knownCount = signal(0);
  protected readonly unknownCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly savingReview = signal(false);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly isAnswerVisible = signal(false);
  protected readonly dragOffset = signal(0);
  protected readonly isDragging = signal(false);
  private readonly dragStartX = signal(0);

  protected readonly currentCard = computed(() => this.queue()[0] ?? null);
  protected readonly remainingCount = computed(() => this.queue().length);
  protected readonly totalCount = computed(() => this.cards().length);
  protected readonly weakCount = computed(() =>
    this.cards().filter((card) => this.isWeak(card)).length
  );
  protected readonly todayCount = computed(() =>
    this.cards().filter((card) => this.isDueToday(card) || card.mastery_level === 'new').length
  );
  protected readonly masteredCount = computed(() =>
    this.cards().filter((card) => card.mastery_level === 'mastered').length
  );
  protected readonly empty = computed(() => !this.loading() && this.cards().length === 0);
  protected readonly activeModeConfig = computed(
    () => this.modes.find((mode) => mode.id === this.activeMode()) ?? this.modes[0]
  );
  protected readonly progress = computed(() => {
    const total = this.knownCount() + this.unknownCount() + this.remainingCount();
    if (total === 0) {
      return 0;
    }

    return Math.round(((this.knownCount() + this.unknownCount()) / total) * 100);
  });

  constructor() {
    void this.loadCards();
  }

  protected async loadCards(): Promise<void> {
    this.loading.set(true);
    this.error.set(undefined);

    try {
      const cards = await firstValueFrom(this.flashcardsService.getAll());
      this.cards.set(this.normalizeCards(cards));
      this.resetSession();
      this.rebuildQueue();
    } catch {
      this.error.set('Non riesco a leggere le flashcard da Supabase. Verifica tabella e policy RLS.');
    } finally {
      this.loading.set(false);
    }
  }

  protected setMode(mode: StudyMode): void {
    if (this.activeMode() === mode) {
      return;
    }

    this.activeMode.set(mode);
    this.resetSession();
    this.rebuildQueue();
  }

  protected flipCard(event?: Event): void {
    event?.stopPropagation();
    if (!this.currentCard()) {
      return;
    }

    this.isAnswerVisible.update((value) => !value);
  }

  protected markKnown(): void {
    void this.handleSwipe('known');
  }

  protected markUnknown(): void {
    void this.handleSwipe('unknown');
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.currentCard() || this.savingReview()) {
      return;
    }

    if ((event.target as HTMLElement).closest('button')) {
      return;
    }

    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.isDragging.set(true);
    this.dragStartX.set(event.clientX);
    this.dragOffset.set(0);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.isDragging()) {
      return;
    }

    const offset = event.clientX - this.dragStartX();
    this.dragOffset.set(Math.max(-132, Math.min(132, offset)));
  }

  protected onPointerUp(): void {
    const offset = this.dragOffset();
    this.isDragging.set(false);
    this.dragOffset.set(0);

    if (offset <= -52) {
      this.markKnown();
      return;
    }

    if (offset >= 52) {
      this.markUnknown();
    }
  }

  protected masteryLabel(card: Flashcard): string {
    const labels: Record<FlashcardMastery, string> = {
      new: 'Nuova',
      weak: 'Sbagliata',
      review: 'Da rivedere',
      almost: 'Quasi pronta',
      mastered: 'Dominata'
    };

    return labels[card.mastery_level];
  }

  protected cardPriority(card: Flashcard): number {
    const daysSinceSeen = this.daysSince(card.last_seen_at);
    const dueBoost = this.isDueToday(card) ? 4 : 0;

    return card.unknown_count * 3 - card.known_count + daysSinceSeen + dueBoost;
  }

  private async handleSwipe(outcome: SwipeOutcome): Promise<void> {
    const [current, ...rest] = this.queue();
    if (!current || this.savingReview()) {
      return;
    }

    this.savingReview.set(true);
    this.error.set(undefined);
    this.isAnswerVisible.set(false);

    const reviewed = this.buildReviewedCard(current, outcome);
    this.updateCardLocally(reviewed);

    if (outcome === 'known') {
      this.knownCount.update((value) => value + 1);
      this.queue.set(rest);
    } else {
      this.unknownCount.update((value) => value + 1);
      this.queue.set(this.insertForAggressiveReview(rest, reviewed));
    }

    try {
      await firstValueFrom(this.flashcardsService.updateReview(reviewed.id, this.toReviewRequest(reviewed)));
    } catch {
      this.error.set('Ho aggiornato la sessione in locale, ma Supabase non ha salvato il ripasso.');
    } finally {
      this.savingReview.set(false);
    }
  }

  private rebuildQueue(): void {
    const cards = this.cards();
    const todayCards = cards.filter((card) => this.isDueToday(card) || card.mastery_level === 'new');
    const queueByMode: Record<StudyMode, Flashcard[]> = {
      today: this.sortByPriority(todayCards.length > 0 ? todayCards : cards),
      review: this.sortByPriority(cards.filter((card) => this.isWeak(card))),
      simulation: this.shuffle(cards)
    };

    this.queue.set(queueByMode[this.activeMode()]);
    this.isAnswerVisible.set(false);
  }

  private resetSession(): void {
    this.knownCount.set(0);
    this.unknownCount.set(0);
    this.isAnswerVisible.set(false);
    this.dragOffset.set(0);
  }

  private normalizeCards(cards: Flashcard[]): Flashcard[] {
    return cards.map((card) => ({
      ...card,
      known_count: card.known_count ?? 0,
      unknown_count: card.unknown_count ?? 0,
      last_seen_at: card.last_seen_at ?? null,
      next_review_at: card.next_review_at ?? new Date().toISOString(),
      mastery_level: card.mastery_level ?? 'new'
    }));
  }

  private buildReviewedCard(card: Flashcard, outcome: SwipeOutcome): Flashcard {
    const now = new Date();
    const knownCount = card.known_count + (outcome === 'known' ? 1 : 0);
    const unknownCount = card.unknown_count + (outcome === 'unknown' ? 1 : 0);
    const masteryLevel = this.resolveMastery(knownCount, unknownCount, outcome);
    const nextReviewAt = this.resolveNextReviewAt(now, knownCount, unknownCount, outcome);

    return {
      ...card,
      known_count: knownCount,
      unknown_count: unknownCount,
      last_seen_at: now.toISOString(),
      next_review_at: nextReviewAt.toISOString(),
      mastery_level: masteryLevel
    };
  }

  private resolveMastery(
    knownCount: number,
    unknownCount: number,
    outcome: SwipeOutcome
  ): FlashcardMastery {
    if (outcome === 'unknown') {
      return unknownCount >= 2 ? 'weak' : 'review';
    }

    if (unknownCount === 0 && knownCount >= 2) {
      return 'mastered';
    }

    if (knownCount >= unknownCount + 2) {
      return 'almost';
    }

    return 'review';
  }

  private resolveNextReviewAt(
    now: Date,
    knownCount: number,
    unknownCount: number,
    outcome: SwipeOutcome
  ): Date {
    const next = new Date(now);

    if (outcome === 'unknown') {
      next.setMinutes(next.getMinutes() + (unknownCount >= 3 ? 5 : 20));
      return next;
    }

    const days = unknownCount === 0 && knownCount >= 2 ? 3 : 1;
    next.setDate(next.getDate() + days);
    return next;
  }

  private insertForAggressiveReview(rest: Flashcard[], reviewed: Flashcard): Flashcard[] {
    const delay = reviewed.unknown_count >= 3 ? 1 : reviewed.unknown_count === 2 ? 2 : 3;
    const index = Math.min(delay, rest.length);

    return [...rest.slice(0, index), reviewed, ...rest.slice(index)];
  }

  private toReviewRequest(card: Flashcard): UpdateFlashcardReviewRequest {
    return {
      known_count: card.known_count,
      unknown_count: card.unknown_count,
      last_seen_at: card.last_seen_at ?? new Date().toISOString(),
      next_review_at: card.next_review_at ?? new Date().toISOString(),
      mastery_level: card.mastery_level
    };
  }

  private updateCardLocally(card: Flashcard): void {
    this.cards.update((cards) => cards.map((item) => (item.id === card.id ? card : item)));
  }

  private sortByPriority(cards: Flashcard[]): Flashcard[] {
    return [...cards].sort((a, b) => this.cardPriority(b) - this.cardPriority(a));
  }

  private shuffle(cards: Flashcard[]): Flashcard[] {
    return [...cards]
      .map((card) => ({ card, rank: Math.random() }))
      .sort((a, b) => a.rank - b.rank)
      .map(({ card }) => card);
  }

  private isWeak(card: Flashcard): boolean {
    return card.unknown_count > 0 && card.mastery_level !== 'mastered';
  }

  private isDueToday(card: Flashcard): boolean {
    if (!card.next_review_at) {
      return true;
    }

    return new Date(card.next_review_at).getTime() <= Date.now();
  }

  private daysSince(date: string | null): number {
    if (!date) {
      return 5;
    }

    const elapsed = Date.now() - new Date(date).getTime();
    return Math.max(0, Math.floor(elapsed / 86_400_000));
  }
}
