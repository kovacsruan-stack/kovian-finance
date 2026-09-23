import { describe, expect, it, beforeEach, vi } from 'vitest'
import { FinanceApiError, createAccount, createTransfer, getAccounts, getOwnerId, importCsv } from './api'
import { getDashboardWindow } from './queries'

describe('finance api', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('extracts the owner id from the access token without exposing token data', () => {
    const payload = btoa(JSON.stringify({ sub: 'owner-123' }))
    localStorage.setItem('access_token', `header.${payload}.signature`)
    expect(getOwnerId()).toBe('owner-123')
  })

  it('preserves backend error code, status and request id', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'ACCOUNT_LOCKED' }), {
      status: 423,
      headers: { 'content-type': 'application/json' },
    })))

    await expect(getAccounts('owner-123')).rejects.toMatchObject<Partial<FinanceApiError>>({
      status: 423,
      code: 'ACCOUNT_LOCKED',
    })
    const error = await getAccounts('owner-123').catch(value => value as FinanceApiError) as FinanceApiError
    expect(error).toBeInstanceOf(FinanceApiError)
    expect(error.requestId).toBeTruthy()
  })

  it('adds no-store and request correlation headers', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await getAccounts('owner-123')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('Cache-Control')).toBe('no-store')
    expect(headers.get('X-Request-ID')).toBeTruthy()
  })

  it('normalizes network failures into a structured api error', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket closed')))

    await expect(getAccounts('owner-123')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'socket closed',
    })
  })

  it('uses the backend request id and message when available', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'VALIDATION_ERROR',
      message: 'Invalid amount.',
    }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'X-Request-ID': 'server-request-42' },
    })))

    const error = await getAccounts('owner-123').catch(value => value as FinanceApiError)
    expect(error).toBeInstanceOf(FinanceApiError)
    expect(error.requestId).toBe('server-request-42')
    expect(error.message).toBe('Invalid amount.')
  })
  it('fails closed when a successful account payload violates the API contract', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 'account-1', name: 'Conta', accountType: 'CHECKING', currency: 'BRL', currentBalance: 'not-a-number', status: 'ACTIVE' }]), { status: 200 })))
    await expect(getAccounts('owner-123')).rejects.toThrow()
  })
  it('preserves structured multipart import errors', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'IMPORT_TOO_LARGE', message: 'File exceeds limit.' }), {
      status: 413,
      headers: { 'content-type': 'application/json', 'X-Request-ID': 'import-request-7' },
    })))
    const file = new File(['csv'], 'data.csv', { type: 'text/csv' })
    const error = await importCsv('account-123', file).catch(value => value as FinanceApiError)
    expect(error).toBeInstanceOf(FinanceApiError)
    expect(error.code).toBe('IMPORT_TOO_LARGE')
    expect(error.requestId).toBe('import-request-7')
  })
  it('fails closed on malformed mutation responses', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'account-1', name: 'Conta', accountType: 'CHECKING', currency: 'BRL', currentBalance: 'invalid', status: 'ACTIVE' }), { status: 200 })))
    await expect(createAccount({ ownerId: 'owner-123', name: 'Conta', accountType: 'CHECKING', currency: 'BRL', openingBalance: 0 })).rejects.toThrow()
  })
  it('sends an idempotency key for transfers and validates the response', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: '11111111-1111-1111-1111-111111111111',
      fromAccountId: '22222222-2222-2222-2222-222222222222',
      toAccountId: '33333333-3333-3333-3333-333333333333',
      amount: 100,
      description: 'Reserva mensal',
      status: 'POSTED',
      createdAt: '2026-09-23T12:00:00Z',
      replayed: false,
    }), { status: 201, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await createTransfer({
      fromAccountId: '22222222-2222-2222-2222-222222222222',
      toAccountId: '33333333-3333-3333-3333-333333333333',
      amount: 100,
      description: 'Reserva mensal',
    }, 'transfer-key-1')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('Idempotency-Key')).toBe('transfer-key-1')
    expect(headers.get('X-Request-ID')).toBeTruthy()
  })

  it('builds the dashboard window from UTC boundaries', () => {
    expect(getDashboardWindow('2026-09-23')).toEqual({
      fromIso: '2026-06-25T23:59:59.999Z',
      toIso: '2026-09-23T23:59:59.999Z',
    })
  })
})
