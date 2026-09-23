import { describe, expect, it, beforeEach, vi } from 'vitest'
import { FinanceApiError, createAccount, getAccounts, getOwnerId } from './api'

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
  it('fails closed on malformed mutation responses', async () => {
    localStorage.setItem('access_token', 'header.e30.signature')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'account-1', name: 'Conta', accountType: 'CHECKING', currency: 'BRL', currentBalance: 'invalid', status: 'ACTIVE' }), { status: 200 })))
    await expect(createAccount({ ownerId: 'owner-123', name: 'Conta', accountType: 'CHECKING', currency: 'BRL', openingBalance: 0 })).rejects.toThrow()
  })
})
