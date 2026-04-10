import type { Job } from './types';

export interface CompanyCamPhotoTimestampLike {
  captured_at?: number;
  created_at?: number;
}

export interface CompanyCamTimeAutofillResult {
  updates: Partial<Job>;
  note: string;
}

function getPhotoTimestamp(photo: CompanyCamPhotoTimestampLike): number | null {
  const ts = photo.captured_at ?? photo.created_at;
  return typeof ts === 'number' && Number.isFinite(ts) ? ts : null;
}

function toTimeInputValue(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatPhotoTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildCompanyCamTimeAutofill(
  job: Pick<Job, 'startTime' | 'stopTime'>,
  photos: CompanyCamPhotoTimestampLike[]
): CompanyCamTimeAutofillResult {
  const dated = photos
    .map((photo) => getPhotoTimestamp(photo))
    .filter((timestamp): timestamp is number => timestamp !== null)
    .sort((a, b) => a - b);

  if (dated.length < 2) {
    return {
      updates: {},
      note: 'Not enough photo timestamps to auto-fill start/stop.',
    };
  }

  const first = dated[0];
  const last = dated[dated.length - 1];
  const updates: Partial<Job> = {};

  if (!job.startTime) updates.startTime = toTimeInputValue(first);
  if (!job.stopTime) updates.stopTime = toTimeInputValue(last);

  if (Object.keys(updates).length === 0) {
    return {
      updates: {},
      note: `CompanyCam found ${dated.length} timestamps. Existing start/stop times were left as-is.`,
    };
  }

  return {
    updates,
    note: `Auto-filled from ${dated.length} photo timestamps, ${formatPhotoTime(first)} to ${formatPhotoTime(last)}.`,
  };
}
