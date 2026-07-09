import { ReviewLogEntry } from '../models/flashcard.model';

export type DayBucket = {
  /** Chiave locale YYYY-MM-DD. */
  day: string;
  label: string;
  known: number;
  unknown: number;
  total: number;
};

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Un secchiello per giorno, anche vuoto, dal piu vecchio al piu recente. */
export function bucketByDay(entries: ReviewLogEntry[], days: number, now = new Date()): DayBucket[] {
  const buckets = new Map<string, DayBucket>();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    buckets.set(dayKey(date), {
      day: dayKey(date),
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      known: 0,
      unknown: 0,
      total: 0
    });
  }

  for (const entry of entries) {
    const bucket = buckets.get(dayKey(new Date(entry.reviewed_at)));
    if (!bucket) {
      continue;
    }
    if (entry.outcome === 'known') {
      bucket.known++;
    } else {
      bucket.unknown++;
    }
    bucket.total++;
  }

  return [...buckets.values()];
}

/**
 * Giorni consecutivi con almeno un ripasso. Conta a ritroso da oggi; se oggi non
 * hai ancora studiato la serie di ieri resta viva (non e ancora persa).
 */
export function currentStreak(entries: ReviewLogEntry[], now = new Date()): number {
  const days = new Set(entries.map((entry) => dayKey(new Date(entry.reviewed_at))));
  if (days.size === 0) {
    return 0;
  }

  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type WeakEntry = {
  flashcardId: string;
  unknown: number;
  total: number;
};

/** Le domande che sbagli piu spesso, ordinate per numero di errori. */
export function weakestCards(entries: ReviewLogEntry[], limit: number): WeakEntry[] {
  const tally = new Map<string, WeakEntry>();

  for (const entry of entries) {
    const current = tally.get(entry.flashcard_id) ?? {
      flashcardId: entry.flashcard_id,
      unknown: 0,
      total: 0
    };
    current.total++;
    if (entry.outcome === 'unknown') {
      current.unknown++;
    }
    tally.set(entry.flashcard_id, current);
  }

  return [...tally.values()]
    .filter((item) => item.unknown > 0)
    .sort((a, b) => b.unknown - a.unknown || b.total - a.total)
    .slice(0, limit);
}

export type SubjectTally = {
  subject: string;
  known: number;
  unknown: number;
  total: number;
};

export function bySubject(entries: ReviewLogEntry[]): SubjectTally[] {
  const tally = new Map<string, SubjectTally>();

  for (const entry of entries) {
    const current = tally.get(entry.subject) ?? {
      subject: entry.subject,
      known: 0,
      unknown: 0,
      total: 0
    };
    if (entry.outcome === 'known') {
      current.known++;
    } else {
      current.unknown++;
    }
    current.total++;
    tally.set(entry.subject, current);
  }

  return [...tally.values()].sort((a, b) => b.total - a.total);
}
