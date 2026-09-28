import test from 'node:test';
import assert from 'node:assert/strict';
import { buildManagementPaymentPaidEvent } from '../src/finance-event.js';

const valid = {
  eventId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  ownerId: '550e8400-e29b-41d4-a716-446655440000',
  occurredAt: '2026-09-28T12:00:00-03:00',
  paymentRef: 'payment-123',
  studentRef: 'student-456',
  amount: 125.5,
  paidAt: '2026-09-28T11:30:00-03:00',
};

test('builds a versioned event with integer cents and normalized timestamps', () => {
  const event = buildManagementPaymentPaidEvent(valid);
  assert.equal(event.type, 'MANAGEMENT_PAYMENT_PAID.v1');
  assert.equal(event.version, 1);
  assert.equal(event.payload.amountMinor, 12550);
  assert.equal(event.payload.currency, 'BRL');
  assert.equal(event.occurredAt, '2026-09-28T15:00:00.000Z');
  assert.equal(event.payload.paidAt, '2026-09-28T14:30:00.000Z');
  assert.equal('studentName' in event.payload, false);
});

test('rejects display names or missing stable student references', () => {
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, studentRef: '' }), /studentRef/);
});

test('rejects non-UUID owner and event identifiers', () => {
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, ownerId: 'admin' }), /ownerId/);
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, eventId: 'evt-1' }), /eventId/);
});

test('rejects invalid amounts and fractions smaller than one cent', () => {
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, amount: 0 }), /amount/);
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, amount: 1.001 }), /whole BRL cents/);
});

test('rejects invalid timestamps and overlong descriptions', () => {
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, paidAt: 'not-a-date' }), /paidAt/);
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, paidAt: '2026-09-28T12:00:00' }), /explicit timezone/);
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, paidAt: '2026-02-30T12:00:00Z' }), /valid date-time/);
  assert.throws(() => buildManagementPaymentPaidEvent({ ...valid, description: 'x'.repeat(161) }), /description/);
});
