import { Flashcard, FlashcardMastery, SwipeOutcome } from '../models/flashcard.model';

/**
 * SM-2 (SuperMemo 2) con qualita binaria: lo swipe dice solo "la so" / "non la so".
 * - `known`  → q=4 (richiamo corretto con qualche esitazione): ease invariato.
 * - `unknown`→ q=2 (fallito): ripetizioni azzerate, ease penalizzato.
 *
 * `interval_days` e frazionario: una card sbagliata torna dopo minuti, non giorni.
 */
const QUALITY: Record<SwipeOutcome, number> = { known: 4, unknown: 2 };

const MIN_EASE = 1.3;
const LAPSE_INTERVAL_DAYS = 10 / 1440; // 10 minuti
const FIRST_INTERVAL_DAYS = 1;
const SECOND_INTERVAL_DAYS = 6;

/** Oltre queste soglie (in giorni) la card e considerata quasi/del tutto acquisita. */
const ALMOST_THRESHOLD_DAYS = 6;
const MASTERED_THRESHOLD_DAYS = 21;

export type Sm2State = Pick<
  Flashcard,
  'ease_factor' | 'interval_days' | 'repetitions' | 'known_count' | 'unknown_count'
>;

export type Sm2Result = Sm2State & {
  mastery_level: FlashcardMastery;
  next_review_at: string;
  last_seen_at: string;
};

export function applySm2(card: Sm2State, outcome: SwipeOutcome, now = new Date()): Sm2Result {
  const quality = QUALITY[outcome];
  const easeFactor = nextEaseFactor(card.ease_factor, quality);

  const repetitions = outcome === 'known' ? card.repetitions + 1 : 0;
  const intervalDays =
    outcome === 'known'
      ? nextInterval(card.repetitions, card.interval_days, easeFactor)
      : LAPSE_INTERVAL_DAYS;

  const knownCount = card.known_count + (outcome === 'known' ? 1 : 0);
  const unknownCount = card.unknown_count + (outcome === 'unknown' ? 1 : 0);

  return {
    ease_factor: round(easeFactor, 2),
    interval_days: round(intervalDays, 4),
    repetitions,
    known_count: knownCount,
    unknown_count: unknownCount,
    mastery_level: resolveMastery(intervalDays, repetitions, unknownCount, knownCount),
    last_seen_at: now.toISOString(),
    next_review_at: new Date(now.getTime() + intervalDays * 86_400_000).toISOString()
  };
}

/** EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02)), mai sotto 1.3. */
function nextEaseFactor(easeFactor: number, quality: number): number {
  const base = Number.isFinite(easeFactor) && easeFactor > 0 ? easeFactor : 2.5;
  const gap = 5 - quality;
  return Math.max(MIN_EASE, base + (0.1 - gap * (0.08 + gap * 0.02)));
}

function nextInterval(repetitions: number, intervalDays: number, easeFactor: number): number {
  if (repetitions === 0) {
    return FIRST_INTERVAL_DAYS;
  }
  if (repetitions === 1) {
    return SECOND_INTERVAL_DAYS;
  }
  // Dopo un lapse interval_days e frazionario: riparte dal primo scalino.
  const base = Math.max(intervalDays, FIRST_INTERVAL_DAYS);
  return base * easeFactor;
}

function resolveMastery(
  intervalDays: number,
  repetitions: number,
  unknownCount: number,
  knownCount: number
): FlashcardMastery {
  if (repetitions === 0) {
    if (unknownCount > 0) {
      return 'weak';
    }
    return knownCount === 0 ? 'new' : 'review';
  }
  if (intervalDays >= MASTERED_THRESHOLD_DAYS) {
    return 'mastered';
  }
  if (intervalDays >= ALMOST_THRESHOLD_DAYS) {
    return 'almost';
  }
  return 'review';
}

/** Etichetta leggibile dell'intervallo corrente ("fra 3 giorni", "fra 10 min"). */
export function formatInterval(intervalDays: number): string {
  if (intervalDays <= 0) {
    return 'subito';
  }
  if (intervalDays < 1) {
    const minutes = Math.max(1, Math.round(intervalDays * 1440));
    return `fra ${minutes} min`;
  }
  const days = Math.round(intervalDays);
  return days === 1 ? 'fra 1 giorno' : `fra ${days} giorni`;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
