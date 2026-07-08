export type SwipeOutcome = 'known' | 'unknown';

export type FlashcardMastery = 'new' | 'weak' | 'review' | 'almost' | 'mastered';

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  known_count: number;
  unknown_count: number;
  last_seen_at: string | null;
  next_review_at: string | null;
  mastery_level: FlashcardMastery;
  created_at: string;
};

export type CreateFlashcardRequest = {
  question: string;
  answer: string;
};

export type UpdateFlashcardReviewRequest = {
  known_count: number;
  unknown_count: number;
  last_seen_at: string;
  next_review_at: string;
  mastery_level: FlashcardMastery;
};
