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

// #58 — a column with a custom (styled) `cell` renderer AND editConfig must
// still enter edit mode: the configured editor renders while editing.
test.describe('configured editors on styled cells (#58)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/interactions')
    await expect(grid(page, 'grid-editing').locator('tbody tr').first()).toBeVisible()
  })

  test('clicking a styled text cell swaps in the built-in text editor', async ({ page }) => {
    const root = grid(page, 'grid-editing')

    // Display mode shows the custom-rendered value.
    const display = root.getByText('«Mango»')
    await expect(display).toBeVisible()

    await display.click()

    // The configured text editor now renders with the current value — before
    // the fix the custom `cell` fn won and no input ever appeared.
    const input = root.locator('input.yable-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('Mango')

    // It is a live editor — typing updates its value.
    await input.fill('Mango Edited')
    await expect(input).toHaveValue('Mango Edited')
  })

  test('clicking a styled select cell swaps in the built-in select editor', async ({ page }) => {
    const root = grid(page, 'grid-editing')

    await root.getByTestId('team-disp-1').click()

    const select = root.locator('select')
    await expect(select).toBeVisible()
    await expect(select).toHaveValue('A')
  })
})

// ---------------------------------------------------------------------------
// Pinned columns under row virtualization (backlog item 2).
//
// Pre-fix: the header lived in the outer table (sticky against `.yable-main`)
// while body cells lived in an inner container that only scrolled vertically,
// so pinned body `td` rode away during horizontal scroll and the h-scrollbar
// was unreachable without scrolling to the last row. The fix wraps the whole
// virtualized table in a single scroll container so header `th` and body `td`
// share one sticky/scroll context.
// ---------------------------------------------------------------------------

test.describe('pinned columns under row virtualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/pinned-virtual')
    await expect(
      grid(page, 'grid-pinned-virtual').locator('.yable-virtual-spacer tbody tr').first(),
    ).toBeVisible()
  })

  async function boxX(locator: Locator): Promise<{ left: number; right: number }> {
    const box = await locator.boundingBox()
    if (!box) throw new Error('expected bounding box')
    return { left: box.x, right: box.x + box.width }
  }

  async function wheelOverBody(page: Page, container: Locator, times: number) {
    const box = await container.boundingBox()
    if (!box) throw new Error('expected container bounding box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    for (let i = 0; i < times; i++) {
      await page.mouse.wheel(300, 0)
    }
  }

  test('pinned th AND td stay x-stable during horizontal scroll', async ({ page }) => {
    const root = grid(page, 'grid-pinned-virtual')
    const container = root.locator('.yable-virtual-scroll-container')

    const leftHeader = root.locator('th[data-column-id="id"]')
    const leftCell = root.locator('td[data-column-id="id"]').first()
    const centerHeader = root.locator('th[data-column-id="d"]')
    const rightHeader = root.locator('th[data-column-id="actions"]')
    const rightCell = root.locator('td[data-column-id="actions"]').first()

    const leftHeaderBefore = await boxX(leftHeader)
    const leftCellBefore = await boxX(leftCell)
    const centerBefore = await boxX(centerHeader)
    const rightHeaderBefore = await boxX(rightHeader)
    const rightCellBefore = await boxX(rightCell)

    // Pinned header and body cell must already agree (sanity, pre-scroll).
    expect(Math.abs(leftHeaderBefore.left - leftCellBefore.left)).toBeLessThanOrEqual(1)
    expect(Math.abs(rightHeaderBefore.right - rightCellBefore.right)).toBeLessThanOrEqual(1)

    // Drive REAL horizontal scroll (setting scrollLeft directly no-ops pre-fix
    // because the container did not scroll horizontally).
    await wheelOverBody(page, container, 10)
    await expect
      .poll(async () => (await container.evaluate((n) => n.scrollLeft)) as number)
      .toBeGreaterThan(0)

    const leftHeaderAfter = await boxX(leftHeader)
    const leftCellAfter = await boxX(leftCell)
    const centerAfter = await boxX(centerHeader)
    const rightHeaderAfter = await boxX(rightHeader)
    const rightCellAfter = await boxX(rightCell)

    // A center (unpinned) column actually moved left → horizontal scroll happened.
    expect(centerAfter.left).toBeLessThan(centerBefore.left - 50)

    // Left-pinned header stayed put AND the body cell tracked it.
    expect(Math.abs(leftHeaderAfter.left - leftHeaderBefore.left)).toBeLessThanOrEqual(1)
    expect(Math.abs(leftCellAfter.left - leftHeaderAfter.left)).toBeLessThanOrEqual(1)

    // Right-pinned header stayed put AND the body cell tracked it.
    expect(Math.abs(rightHeaderAfter.right - rightHeaderBefore.right)).toBeLessThanOrEqual(1)
    expect(Math.abs(rightCellAfter.right - rightHeaderAfter.right)).toBeLessThanOrEqual(1)
  })

  test('horizontal scroll lives on the bounded viewport', async ({ page }) => {
    const root = grid(page, 'grid-pinned-virtual')
    const container = root.locator('.yable-virtual-scroll-container')

    const metrics = await container.evaluate((n) => ({
      scrollWidth: n.scrollWidth,
      clientWidth: n.clientWidth,
      clientHeight: n.clientHeight,
      scrollLeft: n.scrollLeft,
    }))

    // The single scroll container is horizontally scrollable (pre-fix it had
    // overflow-x: hidden so scrollWidth === clientWidth).
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)
    // The viewport is bounded to virtualViewportHeight, so the h-scrollbar is
    // reachable without vertically scrolling to the last row.
    expect(Math.abs(metrics.clientHeight - 300)).toBeLessThanOrEqual(4)
    expect(metrics.scrollLeft).toBe(0)

    const box = await container.boundingBox()
    if (!box) throw new Error('expected container bounding box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(300, 0)

    await expect
      .poll(async () => (await container.evaluate((n) => n.scrollLeft)) as number)
      .toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Container-level theme pinning (#51). A grid wrapped in a
// `data-yable-theme="light"` container must render with light tokens even when
// the OS prefers dark — previously the auto dark tokens only keyed off :root so
// the container inherited dark. `--yable-bg` is #ffffff (light) / #09090b (dark).
// ---------------------------------------------------------------------------

test.describe('container-level theme pinning', () => {
  const LIGHT_BG = 'rgb(255, 255, 255)'
  const DARK_BG = 'rgb(9, 9, 11)'

  async function gridBg(page: Page, sectionTestId: string): Promise<string> {
    return grid(page, sectionTestId)
      .locator('.yable')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
  }

  // The demo app pins `<html data-yable-theme="dark">`, so an unpinned
  // ("auto") grid inherits dark. The #51 fix is that a `data-yable-theme="light"`
  // CONTAINER re-declares the light tokens and overrides that inherited dark —
  // the same cascade that failed on a dark OS with an unpinned root. We assert
  // the container pinning holds under BOTH OS colour-scheme preferences.
  for (const scheme of ['dark', 'light'] as const) {
    test(`container pins win over inherited dark (OS ${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/e2e/theme-pinning')
      await expect(grid(page, 'theme-light').locator('tbody tr').first()).toBeVisible()

      // Light-pinned container overrides the inherited dark tokens → light.
      expect(await gridBg(page, 'theme-light')).toBe(LIGHT_BG)
      // Dark-pinned container stays dark.
      expect(await gridBg(page, 'theme-dark')).toBe(DARK_BG)
      // Unpinned grid follows the app's pinned-dark <html>.
      expect(await gridBg(page, 'theme-auto')).toBe(DARK_BG)
    })
  }
})

// ---------------------------------------------------------------------------
// Row virtualization without a pagination override (#54). Virtualization must
// render the full dataset, not just the default 10-row page.
// ---------------------------------------------------------------------------

test.describe('virtualization without pagination override', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/virtual-no-pagination')
    await expect(
      grid(page, 'grid-virt-nopage').locator('.yable-virtual-spacer tbody tr').first(),
    ).toBeVisible()
  })

  test('exposes the whole dataset, not just the first page', async ({ page }) => {
    const root = grid(page, 'grid-virt-nopage')

    // aria-rowcount reflects the full row model (100), not the default page (10).
    await expect(root.locator('[role="grid"]').first()).toHaveAttribute('aria-rowcount', '100')

    // Deep-scrolling the virtual viewport reveals rows far past index 10.
    const container = root.locator('.yable-virtual-scroll-container')
    await container.evaluate((n) => {
      n.scrollTop = 3200 // ~row 80 at 40px each
    })
    await expect(root.locator('td[data-column-id="id"]').filter({ hasText: /^90$/ })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Density presets (Feature B). Each `density` preset maps to a token set; the
// rendered row height must grow condensed < regular < spacious.
// ---------------------------------------------------------------------------

test.describe('density presets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/density')
    await expect(page.getByTestId('density-regular').locator('tbody tr').first()).toBeVisible()
  })

  async function firstBodyCellHeight(page: Page, testId: string): Promise<number> {
    const cell = page.getByTestId(testId).locator('tbody tr').first().locator('td').first()
    const box = await cell.boundingBox()
    return box?.height ?? 0
  }

  test('applies the density class per preset', async ({ page }) => {
    await expect(
      page.getByTestId('density-condensed').locator('.yable--density-condensed'),
    ).toBeVisible()
    await expect(
      page.getByTestId('density-regular').locator('.yable--density-regular'),
    ).toBeVisible()
    await expect(
      page.getByTestId('density-spacious').locator('.yable--density-spacious'),
    ).toBeVisible()
  })

  test('row height grows condensed < regular < spacious', async ({ page }) => {
    const condensed = await firstBodyCellHeight(page, 'density-condensed')
    const regular = await firstBodyCellHeight(page, 'density-regular')
    const spacious = await firstBodyCellHeight(page, 'density-spacious')

    expect(condensed).toBeGreaterThan(0)
    expect(regular).toBeGreaterThan(condensed)
    expect(spacious).toBeGreaterThan(regular)
  })
})

// ---------------------------------------------------------------------------
// Smart column width (Feature A). `fit` squishes + wraps to avoid horizontal
// scroll; `scroll` keeps natural widths and scrolls. Opt-out columns keep width.
// ---------------------------------------------------------------------------

test.describe('smart column width', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/auto-column-width')
    await expect(page.getByTestId('auto-fit').locator('tbody tr').first()).toBeVisible()
    await expect(page.getByTestId('auto-scroll').locator('tbody tr').first()).toBeVisible()
  })

  test('fit mode produces no horizontal scroll', async ({ page }) => {
    const main = page.getByTestId('auto-fit').locator('.yable-main')
    const overflow = await main.evaluate((n) => n.scrollWidth - n.clientWidth)
    // Allow 2px for sub-pixel rounding; anything larger means it scrolls.
    expect(overflow).toBeLessThanOrEqual(2)
  })

  test('fit mode wraps the long-content column (cell taller than one line)', async ({ page }) => {
    const cell = page
      .getByTestId('auto-fit')
      .locator('tbody tr')
      .first()
      .locator('td[data-column-id="description"]')
    const box = await cell.boundingBox()
    // A single unwrapped line sits around the ~40px row min-height; a wrapped
    // long sentence in a squished column is clearly taller.
    expect(box?.height ?? 0).toBeGreaterThan(60)
  })

  test('scroll mode keeps natural widths and scrolls horizontally', async ({ page }) => {
    const main = page.getByTestId('auto-scroll').locator('.yable-main')
    const overflow = await main.evaluate((n) => n.scrollWidth - n.clientWidth)
    expect(overflow).toBeGreaterThan(20)
  })

  test('opt-out column keeps its explicit width under fit squish', async ({ page }) => {
    const statusHeader = page.getByTestId('auto-fit').locator('th[data-column-id="status"]').first()
    const box = await statusHeader.boundingBox()
    // Explicit size:120 + enableAutoSize:false — never measured or squished.
    expect(Math.abs((box?.width ?? 0) - 120)).toBeLessThanOrEqual(2)
  })

  test('autoSizeText sizes to rendered content, not the raw accessor value', async ({ page }) => {
    const grid = page.getByTestId('auto-formatted')
    await expect(grid.locator('tbody tr').first()).toBeVisible()

    const rawWidth =
      (await grid.locator('th[data-column-id="raw"]').first().boundingBox())?.width ?? 0
    const formattedWidth =
      (await grid.locator('th[data-column-id="formatted"]').first().boundingBox())?.width ?? 0

    // Both columns render the same wide string. The `raw` column is measured by
    // its accessor value ("1234") and undershoots; the `formatted` column sets
    // `autoSizeText` and is measured by what it renders — so it is clearly wider
    // and wide enough to hold the rendered content ("$1234.00 (Infrastructure
    // Platform)" ≈ 220px+).
    expect(formattedWidth).toBeGreaterThan(rawWidth + 60)
    expect(formattedWidth).toBeGreaterThanOrEqual(200)

    // And the rendered cell is not clipped inside the sized column.
    const cell = grid.locator('tbody tr').first().locator('td[data-column-id="formatted"]')
    const clip = await cell.evaluate((n) => n.scrollWidth - n.clientWidth)
    expect(clip).toBeLessThanOrEqual(2)
  })
})
