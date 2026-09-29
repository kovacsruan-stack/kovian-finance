import { useEffect, useState } from 'react'
import { ensureFinanceSession, getOwnerId } from './api'

/** Resolves the browser-scoped Finance identity after automatic session setup. */
export function useFinanceOwnerId(): string | null {
  const [ownerId, setOwnerId] = useState<string | null>(() => getOwnerId())
  useEffect(() => {
    let active = true
    void ensureFinanceSession()
      .then(() => { if (active) setOwnerId(getOwnerId()) })
      .catch(() => { if (active) setOwnerId(null) })
    return () => { active = false }
  }, [])
  return ownerId
}
