// @zvndev/yable-react — behavioral test for pointer-driven column reorder.
// jsdom has no layout, so we stub getBoundingClientRect to give each header a
// deterministic position, then drive the pointer drag and assert the committed
// column order. (The visual slide itself is exercised in the browser.)

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

interface R {
  id: string
  name: string
  age: number
  city: string
}

const col = createColumnHelper<R>()
const columns = [
  col.accessor('name', { header: 'Name' }),
  col.accessor('age', { header: 'Age' }),
  col.accessor('city', { header: 'City' }),
]
const data: R[] = [
  { id: '1', name: 'Alice', age: 30, city: 'NYC' },
  { id: '2', name: 'Bob', age: 25, city: 'LA' },
]

function Harness() {
  const table = useTable<R>({ data, columns, getRowId: (r) => r.id })
  return <Table table={table} />
}

function order(): (string | null)[] {
  return Array.from(document.querySelectorAll('th[data-column-id]')).map((t) =>
    t.getAttribute('data-column-id'),
  )
}

// Dispatch a real MouseEvent under the given type — works regardless of whether
// jsdom exposes PointerEvent, and carries clientX/button the handlers read.
function pointer(type: string, target: EventTarget, clientX: number) {
  act(() => {
    target.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 }),
    )
  })
}

const W = 120 // mocked header width

let restore: () => void
beforeEach(() => {
  const orig = HTMLElement.prototype.getBoundingClientRect
  HTMLElement.prototype.getBoundingClientRect = function () {
    const id = this.getAttribute?.('data-column-id')
    if (id) {
      const ths = Array.from(document.querySelectorAll('th[data-column-id]'))
      const i = ths.indexOf(this as Element)
      if (i >= 0) {
        return {
          x: i * W,
          left: i * W,
          right: i * W + W,
          width: W,
          y: 0,
          top: 0,
          bottom: 40,
          height: 40,
          toJSON() {},
        } as DOMRect
      }
    }
    return {
      x: 0,
      left: 0,
      right: 0,
      width: 0,
      y: 0,
      top: 0,
      bottom: 40,
      height: 40,
      toJSON() {},
    } as DOMRect
  }
  restore = () => {
    HTMLElement.prototype.getBoundingClientRect = orig
  }
})
afterEach(() => restore())

describe('Column reorder (pointer drag)', () => {
  it('drags a header past another column and commits the new order', () => {
    render(<Harness />)
    expect(order()).toEqual(['name', 'age', 'city'])

    const ageContent = document.querySelector('th[data-column-id="age"] .yable-th-content')!
    // age occupies [120,240], center 180. Drag it to the far left (before name).
    pointer('pointerdown', ageContent, 180)
    pointer('pointermove', window, 168) // 12px > threshold → drag begins
    pointer('pointermove', window, 10) // past name's midpoint (60) → insert at front
    pointer('pointerup', window, 10)

    expect(order()).toEqual(['age', 'name', 'city'])
  })

  it('does not reorder when the pointer barely moves (a click, not a drag)', () => {
    render(<Harness />)
    const ageContent = document.querySelector('th[data-column-id="age"] .yable-th-content')!
    pointer('pointerdown', ageContent, 180)
    pointer('pointermove', window, 182) // 2px < 4px threshold → not a drag
    pointer('pointerup', window, 182)
    expect(order()).toEqual(['name', 'age', 'city'])
  })
})
