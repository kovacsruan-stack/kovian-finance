import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GestaoPage from './GestaoPage'

describe('GestaoPage', () => {
  it('shows a loading state until the embedded module loads', () => {
    render(<GestaoPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Conectando ao módulo Gestão')
    fireEvent.load(screen.getByTitle('KOVIAN Gestão'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('offers a separate-tab fallback and a retry when loading is slow', () => {
    vi.useFakeTimers()
    render(<GestaoPage />)
    vi.advanceTimersByTime(12000)
    expect(screen.getByText('O módulo está demorando para responder')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Abrir Gestão|Abrir em nova aba/ })).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/ }))
    expect(screen.getByRole('status')).toHaveTextContent('Conectando ao módulo Gestão')
    vi.useRealTimers()
  })
})
