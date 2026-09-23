import { describe, expect, it } from 'vitest'
import { pageConfig, pageTranslationKeys } from './FinancePage'

describe('finance page routing contract', () => {
  it('keeps every legacy planner route mapped to a page configuration', () => {
    const routes = ['/contas', '/transacoes', '/metas', '/relatorios', '/cartoes', '/orcamentos', '/recorrentes', '/categorias', '/configuracoes']
    expect(Object.keys(pageConfig)).toEqual(routes)
    for (const route of routes) expect(pageTranslationKeys[route]).toHaveLength(2)
  })
})
