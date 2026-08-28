export interface FlashcardProgress {
  knownIds: string[];
  reviewedIds: string[];
}

export function toggleKnown(progress: FlashcardProgress, id: string, known: boolean): FlashcardProgress {
  const ids = new Set(progress.knownIds);
  if (known) {
    ids.add(id);
  } else {
    ids.delete(id);
  }
  return { ...progress, knownIds: [...ids] };
}

export function markReviewed(progress: FlashcardProgress, id: string): FlashcardProgress {
  return progress.reviewedIds.includes(id) ? progress : { ...progress, reviewedIds: [...progress.reviewedIds, id] };
}
