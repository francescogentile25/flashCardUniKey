import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  Flashcard,
  SwipeOutcome
} from '../models/flashcard.model';
import { FlashcardsService } from '../services/flashcards.service';

@Component({
  selector: 'app-flashcards-home',
  imports: [RouterLink],
  templateUrl: './flashcards-home.html',
  styleUrl: './flashcards-home.scss'
})
export class FlashcardsHome {
  private readonly flashcardsService = inject(FlashcardsService);

  protected readonly cards = signal<Flashcard[]>([]);
  protected readonly queue = signal<Flashcard[]>([]);
  protected readonly knownCount = signal(0);
  protected readonly unknownCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly isAnswerVisible = signal(false);
  protected readonly dragOffset = signal(0);
  protected readonly isDragging = signal(false);
  private readonly dragStartX = signal(0);

  protected readonly currentCard = computed(() => this.queue()[0] ?? null);
  protected readonly remainingCount = computed(() => this.queue().length);
  protected readonly totalCount = computed(() => this.cards().length);
  protected readonly empty = computed(() => !this.loading() && this.cards().length === 0);
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
      this.cards.set(cards);
      this.queue.set(cards);
      this.knownCount.set(0);
      this.unknownCount.set(0);
      this.isAnswerVisible.set(false);
    } catch {
      this.error.set('Non riesco a leggere le flashcard da Supabase. Verifica tabella e policy RLS.');
    } finally {
      this.loading.set(false);
    }
  }

  protected flipCard(event?: Event): void {
    event?.stopPropagation();
    if (!this.currentCard()) {
      return;
    }

    this.isAnswerVisible.update((value) => !value);
  }

  protected markKnown(): void {
    this.handleSwipe('known');
  }

  protected markUnknown(): void {
    this.handleSwipe('unknown');
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.currentCard()) {
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

    if (offset <= -48) {
      this.markKnown();
      return;
    }

    if (offset >= 48) {
      this.markUnknown();
    }
  }

  private handleSwipe(outcome: SwipeOutcome): void {
    const [current, ...rest] = this.queue();
    if (!current) {
      return;
    }

    this.isAnswerVisible.set(false);

    if (outcome === 'known') {
      this.knownCount.update((value) => value + 1);
      this.queue.set(rest);
      return;
    }

    this.unknownCount.update((value) => value + 1);
    this.queue.set([...rest, current]);
  }
}
