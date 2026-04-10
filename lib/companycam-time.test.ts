import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCompanyCamTimeAutofill } from './companycam-time.ts';

test('buildCompanyCamTimeAutofill fills empty start and stop times from earliest and latest photo timestamps', () => {
  const result = buildCompanyCamTimeAutofill(
    { startTime: '', stopTime: '' },
    [
      { captured_at: new Date('2026-04-09T21:14:00').getTime() },
      { captured_at: new Date('2026-04-09T20:03:00').getTime() },
      { created_at: new Date('2026-04-09T23:41:00').getTime() },
    ],
  );

  assert.deepEqual(result.updates, {
    startTime: '20:03',
    stopTime: '23:41',
  });
  assert.match(result.note, /3 photo timestamps/i);
});

test('buildCompanyCamTimeAutofill leaves existing times unchanged', () => {
  const result = buildCompanyCamTimeAutofill(
    { startTime: '20:00', stopTime: '23:45' },
    [
      { captured_at: new Date('2026-04-09T20:03:00').getTime() },
      { captured_at: new Date('2026-04-09T23:41:00').getTime() },
    ],
  );

  assert.deepEqual(result.updates, {});
  assert.match(result.note, /left as-is/i);
});

test('buildCompanyCamTimeAutofill requires at least two timestamped photos', () => {
  const result = buildCompanyCamTimeAutofill(
    { startTime: '', stopTime: '' },
    [{ captured_at: new Date('2026-04-09T20:03:00').getTime() }],
  );

  assert.deepEqual(result.updates, {});
  assert.match(result.note, /not enough photo timestamps/i);
});
