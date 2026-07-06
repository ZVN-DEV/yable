import { expect, type Locator, type Page, test } from '@playwright/test'

const DRAG_LAB_COLUMNS = ['name', 'team', 'role', 'location', 'commits']

test.describe('Yable browser interactions', () => {
  test('slides columns during header drag and commits the reordered column order', async ({
    page,
  }) => {
    await openDragLab(page)

    expect(await headerOrder(page)).toEqual(DRAG_LAB_COLUMNS)

    const nameHeader = header(page, 'name')
    const teamHeader = header(page, 'team')
    const roleHeader = header(page, 'role')
    const nameContent = nameHeader.locator('.yable-th-content')
    const firstTeamCell = cell(page, '1', 'team')
    const start = await box(nameContent)
    const role = await box(roleHeader)
    const startX = start.x + start.width / 2
    const startY = start.y + start.height / 2
    const targetX = role.x + role.width + 24

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 12, startY, { steps: 3 })
    await page.mouse.move(targetX, startY, { steps: 12 })

    await expect(page.locator('.yable-col-drag-ghost')).toBeVisible()
    await expect(teamHeader).toHaveAttribute('data-reordering', 'true')
    await expect.poll(() => computedStyle(teamHeader, 'transform')).not.toBe('none')
    await expect.poll(() => computedStyle(firstTeamCell, 'transform')).not.toBe('none')

    await page.mouse.up()

    await expect(page.locator('.yable-col-drag-ghost')).toHaveCount(0)
    await expect
      .poll(() => headerOrder(page))
      .toEqual(['team', 'role', 'name', 'location', 'commits'])
  })

  test('keeps long-data virtualization bounded while scrolling deep into the dataset', async ({
    page,
  }) => {
    await openBenchmark(page)

    const rows = virtualRows(page)
    const scroller = page.locator('.yable-virtual-scroll-container')
    const initialRowCount = await rows.count()

    expect(initialRowCount).toBeGreaterThan(0)
    expect(initialRowCount).toBeLessThan(70)
    expect(await firstVirtualRowIndex(page)).toBe(0)

    await scroller.evaluate((node) => {
      node.scrollTop = 24_000
      node.dispatchEvent(new Event('scroll', { bubbles: true }))
    })

    await expect.poll(() => firstVirtualRowIndex(page)).toBeGreaterThan(100)
    expect(await rows.count()).toBeLessThan(70)
    await expect.poll(() => firstVirtualRowTranslateY(page)).toBeGreaterThan(1_000)
  })

  test('keeps header and virtualized body widths aligned after resize and scroll', async ({
    page,
  }) => {
    await openBenchmark(page)

    const nameHeader = header(page, 'name')
    const visibleNameCell = firstVisibleCell(page, 'name')
    await expectColumnWidthsAligned(nameHeader, visibleNameCell)

    const handle = nameHeader.locator('.yable-resize-handle')
    const handleBox = await box(handle)
    const beforeWidth = await width(nameHeader)

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      handleBox.x + handleBox.width / 2 + 64,
      handleBox.y + handleBox.height / 2,
      {
        steps: 10,
      },
    )
    await page.mouse.up()

    await expect.poll(() => width(nameHeader)).toBeGreaterThan(beforeWidth + 40)
    await expectColumnWidthsAligned(nameHeader, firstVisibleCell(page, 'name'))

    const scroller = page.locator('.yable-virtual-scroll-container')
    await scroller.evaluate((node) => {
      node.scrollTop = 18_000
      node.dispatchEvent(new Event('scroll', { bubbles: true }))
    })

    await expect.poll(() => firstVirtualRowIndex(page)).toBeGreaterThan(80)
    await expectColumnWidthsAligned(nameHeader, firstVisibleCell(page, 'name'))
  })

  test('moves focused cells with keyboard navigation in the real browser', async ({ page }) => {
    await openDragLab(page)

    const firstNameCell = cell(page, '1', 'name')
    await firstNameCell.click()
    await expect(firstNameCell).toHaveAttribute('data-focused', 'true')

    await page.keyboard.press('ArrowRight')
    await expect(cell(page, '1', 'team')).toHaveAttribute('data-focused', 'true')

    await page.keyboard.press('ArrowDown')
    await expect(cell(page, '2', 'team')).toHaveAttribute('data-focused', 'true')
  })
})

async function openDragLab(page: Page) {
  await page.goto('/drag-lab')
  const grid = page.getByRole('grid', { name: 'Drag lab table' })
  await expect(grid).toBeVisible()
  await expect(header(page, 'name')).toBeVisible()
}

async function openBenchmark(page: Page) {
  await page.goto('/benchmark')
  const grid = page.getByRole('grid', { name: 'Benchmark data table' })
  await expect(grid).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('.yable-virtual-scroll-container')).toBeVisible()
  await expect(virtualRows(page).first()).toBeVisible()
}

function header(page: Page, columnId: string) {
  return page.locator(`th[data-column-id="${columnId}"]`).first()
}

function cell(page: Page, rowId: string, columnId: string) {
  return page.locator(`tr[data-row-id="${rowId}"] td[data-column-id="${columnId}"]`).first()
}

function firstVisibleCell(page: Page, columnId: string) {
  return page.locator(`tr[data-row-index] td[data-column-id="${columnId}"]`).first()
}

function virtualRows(page: Page) {
  return page.locator('tr[data-row-index]')
}

async function headerOrder(page: Page) {
  return page
    .locator('thead tr.yable-header-row')
    .first()
    .locator('th[data-column-id]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-column-id')))
}

async function computedStyle(locator: Locator, property: keyof CSSStyleDeclaration) {
  return locator.evaluate(
    (node, prop) => getComputedStyle(node).getPropertyValue(String(prop)),
    property,
  )
}

async function firstVirtualRowIndex(page: Page) {
  const value = await virtualRows(page).first().getAttribute('data-row-index')
  return Number(value ?? -1)
}

async function firstVirtualRowTranslateY(page: Page) {
  // The mounted window is offset as one block on the inner table; measure the
  // first row's real offset within the virtual spacer instead of a per-row
  // transform so the assertion is layout-strategy agnostic.
  return virtualRows(page)
    .first()
    .evaluate((node) => {
      const spacer = node.closest('.yable-virtual-spacer')
      if (!spacer) return 0
      return node.getBoundingClientRect().top - spacer.getBoundingClientRect().top
    })
}

async function expectColumnWidthsAligned(headerCell: Locator, bodyCell: Locator) {
  await expect
    .poll(async () => Math.abs((await width(headerCell)) - (await width(bodyCell))))
    .toBeLessThanOrEqual(1)
}

async function width(locator: Locator) {
  const rect = await box(locator)
  return rect.width
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox()
  if (!rect) {
    throw new Error(`Expected locator to have a bounding box: ${locator}`)
  }
  return rect
}
