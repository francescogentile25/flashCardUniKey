import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Flashcard, FlashcardMastery, SwipeOutcome } from '../models/flashcard.model';
import { FlashcardsService } from '../services/flashcards.service';
import { ReviewSyncService } from '../services/review-sync.service';
import { isSpeechSupported, speak, stopSpeaking } from '../utils/speech.util';
import { formatInterval } from '../utils/spaced-repetition.util';

type StudyMode = 'today' | 'review' | 'simulation';

type ModeConfig = {
  id: StudyMode;
  label: string;
  caption: string;
};

// Soglia oltre la quale il rilascio conferma lo swipe; sotto, la card rientra elastica.
const SWIPE_THRESHOLD = 64;
const SWIPE_CLAMP = 140;
const EXIT_ANIMATION_MS = 300;

export const ALL_SUBJECTS = '__all__';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
    caption: 'Tutte le domande in ordine casuale'
  }
];

@Component({
  selector: 'app-flashcards-home',
  imports: [RouterLink],
  templateUrl: './flashcards-home.html',
  styleUrl: './flashcards-home.scss'
})
export class FlashcardsHome implements OnDestroy {
  private readonly flashcardsService = inject(FlashcardsService);
  private readonly reviewSync = inject(ReviewSyncService);

  protected readonly modes = MODE_CONFIGS;
  protected readonly allSubjects = ALL_SUBJECTS;
  protected readonly activeMode = signal<StudyMode>('today');
  protected readonly activeSubject = signal<string>(ALL_SUBJECTS);
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
  protected readonly exiting = signal<SwipeOutcome | null>(null);
  protected readonly dealing = signal(false);
  protected readonly speaking = signal(false);
  protected readonly speechAvailable = isSpeechSupported();
  protected readonly pendingReviews = this.reviewSync.pendingCount;
  private readonly dragStartX = signal(0);

  /** Materie presenti nel deck, in ordine alfabetico. */
  protected readonly subjects = computed(() =>
    [...new Set(this.cards().map((card) => card.subject))].sort((a, b) => a.localeCompare(b))
  );

  /** Card della materia selezionata (o tutte). */
  protected readonly scopedCards = computed(() => {
    const subject = this.activeSubject();
    const cards = this.cards();
    return subject === ALL_SUBJECTS ? cards : cards.filter((card) => card.subject === subject);
  });

  protected readonly currentCard = computed(() => this.queue()[0] ?? null);
  protected readonly remainingCount = computed(() => this.queue().length);
  protected readonly weakCount = computed(
    () => this.scopedCards().filter((card) => this.isWeak(card)).length
  );
  protected readonly todayCount = computed(
    () =>
      this.scopedCards().filter((card) => this.isDueToday(card) || card.mastery_level === 'new')
        .length
  );
  protected readonly masteredCount = computed(
    () => this.scopedCards().filter((card) => card.mastery_level === 'mastered').length
  );
  protected readonly empty = computed(() => !this.loading() && this.scopedCards().length === 0);
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

  /** Il porcellino resta dentro la barra anche a 0% e 100%. */
  protected readonly pigPosition = computed(
    () => `clamp(0.7rem, ${this.progress()}%, calc(100% - 0.7rem))`
  );

  /** Quanto manca alla conferma dello swipe: 0 = fermo, 1 = soglia raggiunta. */
  protected readonly dragProgress = computed(() =>
    Math.min(1, Math.abs(this.dragOffset()) / SWIPE_THRESHOLD)
  );

  /** Esito verso cui punta il gesto in corso (o l'uscita in corso). */
  protected readonly dragOutcome = computed<SwipeOutcome | null>(() => {
    const exiting = this.exiting();
    if (exiting) {
      return exiting;
    }
    const offset = this.dragOffset();
    if (offset <= -10) {
      return 'known';
    }
    if (offset >= 10) {
      return 'unknown';
    }
    return null;
  });

  /** Timbro armato: rilasciando ora lo swipe viene confermato. */
  protected readonly armed = computed(() => this.isDragging() && this.dragProgress() >= 1);

  protected readonly cardTransform = computed(() => {
    const exiting = this.exiting();
    if (exiting) {
      const direction = exiting === 'known' ? -1 : 1;
      return `translateX(${direction * 130}%) rotate(${direction * 16}deg)`;
    }
    const offset = this.dragOffset();
    return `translateX(${offset}px) rotate(${offset / 22}deg)`;
  });

  constructor() {
    void this.loadCards();
  }

  ngOnDestroy(): void {
    stopSpeaking();
  }

  protected stampOpacity(outcome: SwipeOutcome): number {
    if (this.exiting() === outcome) {
      return 1;
    }
    return this.dragOutcome() === outcome ? this.dragProgress() : 0;
  }

  protected async loadCards(): Promise<void> {
    this.loading.set(true);
    this.error.set(undefined);

    try {
      const cards = await firstValueFrom(this.flashcardsService.getAll());
      this.cards.set(cards);
      if (!this.subjects().includes(this.activeSubject())) {
        this.activeSubject.set(ALL_SUBJECTS);
      }
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

  protected setSubject(subject: string): void {
    if (this.activeSubject() === subject) {
      return;
    }

    this.activeSubject.set(subject);
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

  /** Legge la faccia attualmente visibile: ripasso a mani libere. */
  protected toggleSpeech(event: Event): void {
    event.stopPropagation();
    const card = this.currentCard();
    if (!card) {
      return;
    }

    if (this.speaking()) {
      stopSpeaking();
      this.speaking.set(false);
      return;
    }

    const text = this.isAnswerVisible() ? card.answer : card.question;
    this.speaking.set(true);
    speak(text, () => this.speaking.set(false));
  }

  protected intervalLabel(card: Flashcard): string {
    return formatInterval(card.interval_days);
  }

  protected markKnown(): void {
    void this.commitSwipe('known');
  }

  protected markUnknown(): void {
    void this.commitSwipe('unknown');
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.currentCard() || this.savingReview() || this.exiting()) {
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
    this.dragOffset.set(Math.max(-SWIPE_CLAMP, Math.min(SWIPE_CLAMP, offset)));
  }

  protected onPointerUp(): void {
    if (!this.isDragging()) {
      return;
    }

    const offset = this.dragOffset();
    this.isDragging.set(false);

    if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      void this.commitSwipe(offset < 0 ? 'known' : 'unknown');
      return;
    }

    // Sotto soglia: rientro elastico, swipe annullato.
    this.dragOffset.set(0);
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

  /** Conferma l'esito: card che vola via + vibrazione, poi avanza la coda. */
  private async commitSwipe(outcome: SwipeOutcome): Promise<void> {
    if (this.exiting() || this.savingReview() || !this.currentCard()) {
      return;
    }

    stopSpeaking();
    this.speaking.set(false);
    this.exiting.set(outcome);
    this.isAnswerVisible.set(false);
    navigator.vibrate?.(35);
    await delay(EXIT_ANIMATION_MS);
    await this.handleSwipe(outcome);
    this.exiting.set(null);
    this.dragOffset.set(0);

    this.dealing.set(true);
    setTimeout(() => this.dealing.set(false), 260);
  }

  private async handleSwipe(outcome: SwipeOutcome): Promise<void> {
    const [current, ...rest] = this.queue();
    if (!current || this.savingReview()) {
      return;
    }

    this.savingReview.set(true);
    this.error.set(undefined);
    this.isAnswerVisible.set(false);

    try {
      const next = await this.reviewSync.submit(current, outcome, 'deck');
      const reviewed: Flashcard = { ...current, ...next };
      this.updateCardLocally(reviewed);

      if (outcome === 'known') {
        this.knownCount.update((value) => value + 1);
        this.queue.set(rest);
      } else {
        this.unknownCount.update((value) => value + 1);
        this.queue.set(this.insertForAggressiveReview(rest, reviewed));
      }
    } finally {
      this.savingReview.set(false);
    }
  }

  private rebuildQueue(): void {
    const cards = this.scopedCards();
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
    stopSpeaking();
    this.speaking.set(false);
    this.knownCount.set(0);
    this.unknownCount.set(0);
    this.isAnswerVisible.set(false);
    this.dragOffset.set(0);
  }

  private insertForAggressiveReview(rest: Flashcard[], reviewed: Flashcard): Flashcard[] {
    const delaySlots = reviewed.unknown_count >= 3 ? 1 : reviewed.unknown_count === 2 ? 2 : 3;
    const index = Math.min(delaySlots, rest.length);

    return [...rest.slice(0, index), reviewed, ...rest.slice(index)];
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
