import { Flashcard } from '../models/flashcard.model';

export type QuizOption = {
  text: string;
  correct: boolean;
};

export type QuizQuestion = {
  card: Flashcard;
  options: QuizOption[];
};

export const OPTIONS_PER_QUESTION = 4;

/**
 * Costruisce domande a risposta multipla senza chiamare l'LLM: i distrattori sono
 * risposte di altre card, preferibilmente della stessa materia (piu plausibili).
 * Una card senza abbastanza distrattori distinti viene saltata.
 */
export function buildQuiz(cards: Flashcard[], count: number): QuizQuestion[] {
  const pool = cards.filter((card) => card.answer.trim().length > 0);
  if (pool.length < OPTIONS_PER_QUESTION) {
    return [];
  }

  return shuffle(pool)
    .slice(0, count)
    .map((card) => buildQuestion(card, pool))
    .filter((question): question is QuizQuestion => question !== null);
}

function buildQuestion(card: Flashcard, pool: Flashcard[]): QuizQuestion | null {
  const distractors = pickDistractors(card, pool);
  if (distractors.length < OPTIONS_PER_QUESTION - 1) {
    return null;
  }

  const options: QuizOption[] = [
    { text: card.answer, correct: true },
    ...distractors.map((text) => ({ text, correct: false }))
  ];

  return { card, options: shuffle(options) };
}

function pickDistractors(card: Flashcard, pool: Flashcard[]): string[] {
  const sameSubject = pool.filter(
    (other) => other.id !== card.id && other.subject === card.subject
  );
  const others = pool.filter((other) => other.id !== card.id && other.subject !== card.subject);

  const seen = new Set([normalize(card.answer)]);
  const distractors: string[] = [];

  for (const candidate of [...shuffle(sameSubject), ...shuffle(others)]) {
    const key = normalize(candidate.answer);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    distractors.push(candidate.answer);
    if (distractors.length === OPTIONS_PER_QUESTION - 1) {
      break;
    }
  }

  return distractors;
}

function normalize(answer: string): string {
  return answer.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function shuffle<T>(items: T[]): T[] {
  return [...items]
    .map((item) => ({ item, rank: Math.random() }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ item }) => item);
}
