const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requiredText(value, field, maxLength = 128) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new TypeError(field + ' must be a non-empty string of at most ' + maxLength + ' characters');
  }
  return value.trim();
}

function toIsoDateTime(value, field) {
  // Require an explicit timezone so machine settings cannot change the instant.
  const match = typeof value === 'string'
    ? value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/)
    : null;
  if (!match) {
    throw new TypeError(field + ' must be an ISO date-time with an explicit timezone');
  }
  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match;
  const calendarDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const validDate = calendarDate.getUTCFullYear() === Number(year)
    && calendarDate.getUTCMonth() === Number(month) - 1
    && calendarDate.getUTCDate() === Number(day);
  const validTime = Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59;
  const validOffset = offsetHour === undefined
    || (Number(offsetHour) <= 23 && Number(offsetMinute) <= 59);
  const date = new Date(value);
  if (!validDate || !validTime || !validOffset || Number.isNaN(date.getTime())) {
    throw new TypeError(field + ' must be a valid date-time');
  }
  return date.toISOString();
}

/**
 * Builds the versioned payment event only from stable identifiers.
 * The caller must supply an authenticated owner UUID and the actual student
 * record ID; display names are deliberately not accepted as references.
 */
export function buildManagementPaymentPaidEvent({
  eventId,
  ownerId,
  occurredAt,
  correlationId = null,
  paymentRef,
  studentRef,
  amount,
  paidAt,
  description = '',
}) {
  if (!UUID_PATTERN.test(ownerId || '')) throw new TypeError('ownerId must be a UUID');
  if (!UUID_PATTERN.test(eventId || '')) throw new TypeError('eventId must be a UUID');
  if (correlationId !== null && (typeof correlationId !== 'string' || correlationId.length > 100)) {
    throw new TypeError('correlationId must be null or a string of at most 100 characters');
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new TypeError('amount must be a positive finite number');
  }
  const amountMinor = Math.round(amount * 100);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || Math.abs(amountMinor / 100 - amount) > 1e-8) {
    throw new TypeError('amount must be representable in whole BRL cents');
  }
  if (typeof description !== 'string' || description.length > 160) {
    throw new TypeError('description must be a string of at most 160 characters');
  }

  return {
    id: eventId,
    type: 'MANAGEMENT_PAYMENT_PAID.v1',
    version: 1,
    ownerId,
    occurredAt: toIsoDateTime(occurredAt, 'occurredAt'),
    correlationId,
    payload: {
      paymentRef: requiredText(paymentRef, 'paymentRef'),
      studentRef: requiredText(studentRef, 'studentRef'),
      amountMinor,
      currency: 'BRL',
      paidAt: toIsoDateTime(paidAt, 'paidAt'),
      ...(description ? { description } : {}),
    },
  };
}
