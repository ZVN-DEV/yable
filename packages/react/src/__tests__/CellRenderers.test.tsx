// @zvndev/yable-react — smoke tests for the remaining display cell types
// (CellDate, CellNumeric, CellProgress, CellRating, CellStatus). These exercise
// the declarative `cellType` render path that previously had no coverage.

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { CellContext } from '@zvndev/yable-core'
import { CellDate } from '../cells/CellDate'
import { CellNumeric } from '../cells/CellNumeric'
import { CellProgress } from '../cells/CellProgress'
import { CellRating } from '../cells/CellRating'
import { CellStatus } from '../cells/CellStatus'

function ctx<T>(value: T): CellContext<any, T> {
  return {
    getValue: () => value,
    renderValue: () => value,
  } as unknown as CellContext<any, T>
}

describe('CellDate', () => {
  it('formats a date and carries the date class', () => {
    const { container } = render(
      <CellDate context={ctx(new Date('2026-01-15T12:00:00Z'))} format="medium" locale="en-US" />,
    )
    const el = container.querySelector('.yable-cell-date')!
    expect(el).toBeInTheDocument()
    expect(el.textContent && el.textContent.length).toBeGreaterThan(0)
    expect(el.textContent).toMatch(/2026/)
  })

  it('renders nothing for a nullish value without crashing', () => {
    const { container } = render(<CellDate context={ctx(null)} />)
    expect(container.querySelector('.yable-cell-date')).toBeNull()
    expect(container.textContent).toBe('')
  })
})

describe('CellNumeric', () => {
  it('formats a number with locale grouping and unit', () => {
    const { container } = render(
      <CellNumeric context={ctx(1234.5)} locale="en-US" decimals={1} unit="ms" />,
    )
    const el = container.querySelector('.yable-cell-numeric')!
    expect(el).toBeInTheDocument()
    expect(el.textContent).toMatch(/1,234/)
    expect(el.textContent).toMatch(/ms/)
  })
})

describe('CellProgress', () => {
  it('renders a progress bar with a percentage label', () => {
    const { container } = render(
      <CellProgress context={ctx(50)} max={100} showLabel variant="accent" />,
    )
    expect(container.querySelector('.yable-cell-progress')).toBeInTheDocument()
    expect(container.textContent).toMatch(/50/)
  })
})

describe('CellRating', () => {
  it('renders filled rating characters for the value', () => {
    const { container } = render(<CellRating context={ctx(3)} max={5} />)
    const el = container.querySelector('.yable-cell-rating')!
    expect(el).toBeInTheDocument()
    expect((el.textContent ?? '').includes('★')).toBe(true)
  })
})

describe('CellStatus', () => {
  it('renders the status label with a variant class from the color map', () => {
    const { container } = render(
      <CellStatus context={ctx('Active')} colorMap={{ Active: 'success' }} />,
    )
    const el = container.querySelector('.yable-cell-status')!
    expect(el).toBeInTheDocument()
    expect(el.textContent).toMatch(/Active/)
    expect(el.className).toMatch(/yable-cell-status--success/)
  })
})
