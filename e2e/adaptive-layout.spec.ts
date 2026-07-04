import { expect, type Locator, type Page, test } from '@playwright/test'

test.describe('adaptive table layouts', () => {
  test('uses the desktop grid above the adaptive breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openAdaptiveDemo(page)

    await expect(page.locator('.yable-table')).toBeVisible()
    await expect(page.locator('.yable-adaptive-card')).toHaveCount(0)
    await expect(header(page, 'account')).toBeVisible()
    await expect(header(page, 'activity')).toBeVisible()
  })

  test('turns the same table into a two-column tablet card board', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await openAdaptiveDemo(page)

    const cards = page.locator('.yable-adaptive-card')
    await expect(page.locator('.yable-table')).toHaveCount(0)
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toContainText('Northstar Labs')

    const firstBox = await box(cards.nth(0))
    const secondBox = await box(cards.nth(1))
    expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThan(6)
    expect(secondBox.x).toBeGreaterThan(firstBox.x + firstBox.width * 0.5)

    await page.getByRole('button', { name: 'ARR high to low' }).click()
    await expect(cards.first()).toContainText('Redwood Bank')

    await cards.first().click()
    await expect(cards.first()).toHaveAttribute('data-selected', 'true')
    await expect(page.getByTestId('adaptive-selected-count')).toHaveText('Selected: 1')
  })

  test('collapses adaptive cards into a single-column mobile feed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 820 })
    await openAdaptiveDemo(page)

    const cards = page.locator('.yable-adaptive-card')
    await expect(page.locator('.yable-table')).toHaveCount(0)
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toContainText('Northstar Labs')
    await expect(cards.first()).toContainText('Exec review booked')

    const firstBox = await box(cards.nth(0))
    const secondBox = await box(cards.nth(1))
    expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height * 0.75)
    expect(Math.abs(firstBox.x - secondBox.x)).toBeLessThan(4)

    await page.getByRole('button', { name: 'ARR high to low' }).click()
    await expect(cards.first()).toContainText('Redwood Bank')
  })
})

async function openAdaptiveDemo(page: Page) {
  await page.goto('/gallery/adaptive')
  const grid = page.getByRole('grid', { name: 'Adaptive account health table' })
  await expect(grid).toBeVisible()
  await expect(page.getByTestId('adaptive-table')).toBeVisible()
}

function header(page: Page, columnId: string) {
  return page.locator(`th[data-column-id="${columnId}"]`).first()
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox()
  if (!rect) {
    throw new Error(`Expected locator to have a bounding box: ${locator}`)
  }
  return rect
}
