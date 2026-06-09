export type FlashcardArea = 'frontend' | 'backend';

export type FlashcardLevel = 'junior' | 'middle';

export type SwipeOutcome = 'known' | 'unknown';

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  area: FlashcardArea;
  level: FlashcardLevel;
  created_at: string;
};

export type CreateFlashcardRequest = {
  question: string;
  answer: string;
  area: FlashcardArea;
  level: FlashcardLevel;
};
