export type SwipeOutcome = 'known' | 'unknown';

export type FlashcardMastery = 'new' | 'weak' | 'review' | 'almost' | 'mastered';

export type ReviewSource = 'deck' | 'quiz';

export const DEFAULT_SUBJECT = 'Generale';

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  subject: string;
  source_file: string | null;
  source_excerpt: string | null;
  known_count: number;
  unknown_count: number;
  last_seen_at: string | null;
  next_review_at: string | null;
  mastery_level: FlashcardMastery;
  /** Stato SM-2. */
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  created_at: string;
};

export type CreateFlashcardRequest = {
  question: string;
  answer: string;
  subject: string;
  source_file?: string | null;
  source_excerpt?: string | null;
};

export type UpdateFlashcardRequest = {
  question: string;
  answer: string;
  subject: string;
};

export type UpdateFlashcardReviewRequest = {
  known_count: number;
  unknown_count: number;
  last_seen_at: string;
  next_review_at: string;
  mastery_level: FlashcardMastery;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
};

export type ReviewLogEntry = {
  id: string;
  flashcard_id: string;
  outcome: SwipeOutcome;
  subject: string;
  source: ReviewSource;
  reviewed_at: string;
};

export type CreateReviewLogRequest = {
  flashcard_id: string;
  outcome: SwipeOutcome;
  subject: string;
  source: ReviewSource;
};
