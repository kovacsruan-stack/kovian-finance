import { describe, expect, it, beforeEach, vi } from 'vitest'
import { FinanceApiError, getAccounts, getOwnerId } from './api'

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
    const error = await getAccounts('owner-123').catch(value => value as FinanceApiError)
    expect(error).toBeInstanceOf(FinanceApiError)
    expect(error.requestId).toBeTruthy()
  })
})
