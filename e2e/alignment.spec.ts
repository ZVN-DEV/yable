// Header/body column alignment regression guard.
//
// Regression context (2026-07): virtualized rows were absolutely positioned,
// blockifying <tr> so body cells kept raw pixel widths while the header table
// stretched to fill its container — columns visibly desynced on the demo
// homepage whenever the container was wider than the summed column widths.
// The /e2e/alignment fixture reproduces exactly that geometry (620px of
// columns in a 1200px container) for a fixed- and a variable-row-height grid.
//
// Every assertion here compares EVERY column's header cell x/width against a
// fully mounted body row's cells, so any width-model divergence between the
// header table and the virtualized body table fails loudly.

import { test, expect, type Locator, type Page } from '@playwright/test'

const TOLERANCE_PX = 1

interface CellBox {
  x: number
  width: number
}

const GRIDS = [
  { id: 'align-fixed', label: 'fixed row height' },
  { id: 'align-variable', label: 'variable row height' },
] as const

function grid(page: Page, testId: string): Locator {
  return page.getByTestId(testId)
}

async function headerBoxes(root: Locator): Promise<CellBox[]> {
  return root.locator('thead th').evaluateAll((cells) =>
    cells.map((cell) => {
      const rect = cell.getBoundingClientRect()
      return { x: rect.x, width: rect.width }
    }),
  )
}

/**
 * Boxes for a mounted body row inside the virtual window. Uses the middle
 * mounted row so the sample is always fully inside the window regardless of
 * scroll position or overscan.
 */
async function bodyRowBoxes(root: Locator): Promise<CellBox[]> {
  return root.locator('.yable-virtual-spacer tbody tr').evaluateAll((rows) => {
    const row = rows[Math.floor(rows.length / 2)]
    if (!row) return []
    return Array.from(row.children).map((cell) => {
      const rect = cell.getBoundingClientRect()
      return { x: rect.x, width: rect.width }
    })
  })
}

async function expectAligned(root: Locator, context: string) {
  await expect
    .poll(
      async () => {
        const headers = await headerBoxes(root)
        const body = await bodyRowBoxes(root)
        if (headers.length === 0 || body.length !== headers.length) {
          return `structure mismatch: ${headers.length} header cells vs ${body.length} body cells`
        }
        let worst = 0
        for (let i = 0; i < headers.length; i++) {
          worst = Math.max(
            worst,
            Math.abs(headers[i]!.x - body[i]!.x),
            Math.abs(headers[i]!.width - body[i]!.width),
          )
        }
        return worst
      },
      { message: `header/body columns misaligned (${context})` },
    )
    .toBeLessThanOrEqual(TOLERANCE_PX)
}

async function scrollVirtualTo(root: Locator, top: number | 'bottom') {
  await root.locator('.yable-virtual-scroll-container').evaluate((node, target) => {
    node.scrollTop = target === 'bottom' ? node.scrollHeight : (target as number)
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
  }, top)
}

test.describe('header/body column alignment (virtualized)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/alignment')
    for (const { id } of GRIDS) {
      await expect(grid(page, id).locator('.yable-virtual-spacer tbody tr').first()).toBeVisible()
    }
  })

  for (const { id, label } of GRIDS) {
    test(`stays pixel-aligned in a wide container (${label})`, async ({ page }) => {
      const root = grid(page, id)

      await expectAligned(root, 'initial render')

      await scrollVirtualTo(root, 20_000)
      await expectAligned(root, 'mid scroll')

      await scrollVirtualTo(root, 'bottom')
      await expectAligned(root, 'scrolled to bottom')

      await scrollVirtualTo(root, 0)
      await expectAligned(root, 'back to top')
    })

    test(`stays pixel-aligned after a column resize (${label})`, async ({ page }) => {
      const root = grid(page, id)
      const firstHeader = root.locator('thead th').first()
      const handle = root.locator('.yable-resize-overlay-handle').first()
      const handleBox = await handle.boundingBox()
      if (!handleBox) throw new Error('resize handle not visible')

      const beforeWidth = (await headerBoxes(root))[0]!.width
      // Grab the handle centre — the overlay layer sits above every header cell
      // so the hit zone straddles the divider and is grabbable from either side.
      const grabX = handleBox.x + handleBox.width / 2
      const grabY = handleBox.y + handleBox.height / 2
      await page.mouse.move(grabX, grabY)
      await page.mouse.down()
      await page.mouse.move(grabX + 80, grabY, { steps: 8 })
      await page.mouse.up()

      await expect
        .poll(async () => (await headerBoxes(root))[0]!.width)
        .toBeGreaterThan(beforeWidth + 40)
      await expectAligned(root, 'after resize')

      await scrollVirtualTo(root, 12_000)
      await expectAligned(root, 'after resize + scroll')
    })

    test(`stays pixel-aligned in a narrow viewport (${label})`, async ({ page }) => {
      // Below the summed column width the horizontal geometry flips — the
      // container is narrower than the columns instead of wider.
      await page.setViewportSize({ width: 560, height: 900 })
      const root = grid(page, id)
      await expectAligned(root, 'narrow viewport')

      await scrollVirtualTo(root, 8_000)
      await expectAligned(root, 'narrow viewport + scroll')
    })
  }

  test('scroll viewport matches virtualViewportHeight exactly', async ({ page }) => {
    for (const { id } of GRIDS) {
      const scroller = grid(page, id).locator('.yable-virtual-scroll-container')
      await expect(scroller).toHaveCSS('height', '300px')
    }
  })
})
