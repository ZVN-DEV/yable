// Real-pointer interaction matrix — core grid basics a user touches in the
// first five minutes, driven with GENUINE pointer input (no synthetic
// dispatchEvent, no attribute-only assertions).
//
// Regression context (2026-07): `.yable-virtual-spacer { pointer-events:
// none }` made every interactive element in virtualized bodies unclickable in
// production while 19 e2e tests stayed green. Each assertion here goes
// through the browser's hit-testing, so a regression of that class fails
// loudly in both rendering modes.

import { test, expect, type Locator, type Page } from '@playwright/test'

const GRIDS = [
  { id: 'grid-virtual', label: 'virtualized' },
  { id: 'grid-plain', label: 'non-virtualized' },
] as const

function grid(page: Page, id: string): Locator {
  return page.getByTestId(id)
}

test.describe('real-pointer core interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/interactions')
    for (const { id } of GRIDS) {
      await expect(grid(page, id).locator('tbody tr').first()).toBeVisible()
    }
  })

  for (const { id, label } of GRIDS) {
    test(`checkbox, button, input, and link in cells respond to real clicks (${label})`, async ({
      page,
    }) => {
      const root = grid(page, id)

      const checkbox = root.getByTestId('cb-1')
      await checkbox.click()
      await expect(checkbox).toBeChecked()
      await checkbox.click()
      await expect(checkbox).not.toBeChecked()

      const button = root.getByTestId('btn-2')
      await button.click()
      await button.click()
      await expect(button).toHaveText('Clicked 2')

      const input = root.getByTestId('input-3')
      await input.click()
      await input.fill('hello')
      await expect(input).toHaveValue('hello')

      const link = root.getByTestId('link-1')
      await link.click()
      await expect(page).toHaveURL(/#row-1$/)
      await page.goto('/e2e/interactions') // reset hash for later tests
      await expect(root.locator('tbody tr').first()).toBeVisible()
    })

    test(`sort click shows a VISIBLE direction indicator (${label})`, async ({ page }) => {
      const root = grid(page, id)
      const nameTh = root.locator('th[data-column-id="name"]')

      await nameTh.click()
      await expect(nameTh).toHaveAttribute('aria-sort', 'ascending')

      const indicator = nameTh.locator('.yable-sort-indicator')
      await expect(indicator).toHaveAttribute('data-active', 'true')
      // Visibility, not just presence: rendered box and near-full opacity.
      const box = await indicator.boundingBox()
      expect(box, 'sort indicator has no rendered box').not.toBeNull()
      expect(box!.width).toBeGreaterThan(6)
      await expect
        .poll(() => indicator.evaluate((el) => Number(getComputedStyle(el).opacity)), {
          message: 'sort indicator must fade in to full visibility',
        })
        .toBeGreaterThan(0.8)

      await nameTh.click()
      await expect(nameTh).toHaveAttribute('aria-sort', 'descending')
      await expect(indicator).toHaveAttribute('data-direction', 'desc')
    })

    test(`column resize tracks the pointer LIVE during drag (${label})`, async ({ page }) => {
      const root = grid(page, id)
      const nameTh = root.locator('th[data-column-id="name"]')
      const handle = nameTh.locator('.yable-resize-handle')
      const hb = await handle.boundingBox()
      if (!hb) throw new Error('resize handle not visible')

      // The grab zone must reach the column divider and the visible bar must
      // sit ON the divider, not centered inside the hotspot (which reads as
      // "the indicator is left of the line I'm dragging").
      const thb = (await nameTh.boundingBox())!
      expect(Math.abs(hb.x + hb.width - (thb.x + thb.width))).toBeLessThanOrEqual(1.5)
      await expect(handle).toHaveCSS('justify-content', 'flex-end')

      const before = (await nameTh.boundingBox())!.width
      await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
      await page.mouse.down()
      // Mid-drag: move 60px and assert width followed BEFORE releasing.
      await page.mouse.move(hb.x + hb.width / 2 + 60, hb.y + hb.height / 2, { steps: 6 })
      await expect
        .poll(async () => (await nameTh.boundingBox())!.width, {
          message: 'header width must track pointer before mouseup (live resize)',
        })
        .toBeGreaterThan(before + 40)

      // Body cell width must track live too, not just the header.
      const bodyCell = root.locator('tbody tr td[data-column-id="name"]').first()
      const cellW = (await bodyCell.boundingBox())!.width
      expect(Math.abs(cellW - (await nameTh.boundingBox())!.width)).toBeLessThanOrEqual(1.5)

      await page.mouse.up()
      expect((await nameTh.boundingBox())!.width).toBeGreaterThan(before + 40)
    })

    test(`row hover applies a hover state (${label})`, async ({ page }) => {
      const root = grid(page, id)
      const row = root.locator('tbody tr').nth(1)
      const before = await row.evaluate((el) => getComputedStyle(el).backgroundColor)
      await row.hover()
      await expect
        .poll(() => row.evaluate((el) => getComputedStyle(el).backgroundColor), {
          message: 'row background should change on hover',
        })
        .not.toBe(before)
    })
  }

  test('stripes follow the absolute row index, not the mounted window (virtualized)', async ({
    page,
  }) => {
    const root = grid(page, 'grid-virtual')
    const readParity = () =>
      root.locator('tbody tr[data-row-index]').evaluateAll((rows) =>
        rows.slice(0, 6).map((r) => ({
          idx: Number(r.getAttribute('data-row-index')),
          striped:
            getComputedStyle(r).backgroundColor !==
            getComputedStyle(rows.find((o) => Number(o.getAttribute('data-row-index')) % 2 === 1)!)
              .backgroundColor,
        })),
      )
    // Baseline: even display indexes carry the alt background.
    const before = await readParity()
    expect(before.every((r) => r.striped === (r.idx % 2 === 0))).toBe(true)

    // Scroll to a window whose start index has flipped parity several times.
    const scroller = root.locator('.yable-virtual-scroll-container')
    await scroller.evaluate((node) => {
      node.scrollTop = 4123
      node.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    await expect
      .poll(async () => (await readParity()).every((r) => r.striped === (r.idx % 2 === 0)), {
        message: 'stripe parity must stay tied to the absolute row index after scrolling',
      })
      .toBe(true)
  })

  test('interactive elements still respond after deep scroll (virtualized)', async ({ page }) => {
    const root = grid(page, 'grid-virtual')
    const scroller = root.locator('.yable-virtual-scroll-container')
    await scroller.evaluate((node) => {
      node.scrollTop = 8000
      node.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    // Find any mounted button in the new window and click it for real.
    const button = root.locator('button[data-testid^="btn-"]').first()
    await expect(button).toBeVisible()
    const testId = await button.getAttribute('data-testid')
    await button.click()
    await expect(root.getByTestId(testId!)).toHaveText('Clicked 1')
  })

  test('horizontal wheel over the body reaches the last column (narrow viewport)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 560, height: 800 })
    const root = grid(page, 'grid-virtual')
    const lastTh = root.locator('th[data-column-id="qty"]')
    const body = root.locator('.yable-virtual-scroll-container')
    const bb = (await body.boundingBox())!

    await page.mouse.move(bb.x + bb.width / 2, bb.y + 50)
    // Wheel deltaX over the grid body must horizontally scroll the grid.
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(300, 0)
      await page.waitForTimeout(60)
    }
    await expect
      .poll(
        async () => {
          const box = await lastTh.boundingBox()
          return box ? box.x + box.width : Number.POSITIVE_INFINITY
        },
        { message: 'last column must become reachable via horizontal wheel over the body' },
      )
      .toBeLessThanOrEqual(562)
  })
})

// sort:change was in core's typed event map but the React binding never
// emitted it; postSortRows is a new AG-parity hook. Both are exercised through
// a real header click that changes the sort.
test.describe('sort:change event + postSortRows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/interactions')
    await expect(grid(page, 'grid-events').locator('tbody tr').first()).toBeVisible()
  })

  test('clicking a sortable header emits sort:change with the new sorting', async ({ page }) => {
    const root = grid(page, 'grid-events')
    const count = root.getByTestId('sort-change-count')
    const payload = root.getByTestId('sort-change-payload')

    await expect(count).toHaveText('0')

    await root.locator('th[data-column-id="name"]').click()
    await expect(count).toHaveText('1')
    await expect(payload).toHaveText('[{"id":"name","desc":false}]')

    await root.locator('th[data-column-id="name"]').click()
    await expect(count).toHaveText('2')
    await expect(payload).toHaveText('[{"id":"name","desc":true}]')
  })

  test('postSortRows keeps the pinned row first across sorts', async ({ page }) => {
    const root = grid(page, 'grid-events')
    const firstRow = root.getByTestId('post-sort-first-row')

    // Unsorted: postSortRows still floats PINNED to the top.
    await expect(firstRow).toHaveText('PINNED')

    // Ascending name sort would put Apple first — postSortRows overrides it.
    await root.locator('th[data-column-id="name"]').click()
    await expect(firstRow).toHaveText('PINNED')

    // Descending too.
    await root.locator('th[data-column-id="name"]').click()
    await expect(firstRow).toHaveText('PINNED')
  })
})
