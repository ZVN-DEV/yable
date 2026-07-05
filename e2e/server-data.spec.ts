import { expect, type Page, test } from '@playwright/test'

test.describe('server-backed table gallery', () => {
  test('loads cursor pages and re-sorts through server state', async ({ page }) => {
    await openServerDataDemo(page)

    await expect(page.getByTestId('server-loaded-count')).toHaveText('Loaded 6 of 18')
    await expect(row(page, 'atlas')).toBeVisible()
    await expect(row(page, 'granite')).toHaveCount(0)

    await page.getByRole('button', { name: 'Load next page' }).click()

    await expect(page.getByTestId('server-loaded-count')).toHaveText('Loaded 12 of 18')
    await expect(row(page, 'granite')).toBeVisible()
    await expect(page.getByTestId('server-log')).toContainText('cursor 6')

    await page.getByRole('button', { name: 'ARR high to low' }).click()

    await expect(page.getByTestId('server-loaded-count')).toHaveText('Loaded 6 of 18')
    await expect(row(page, 'zenith')).toBeVisible()
    await expect(row(page, 'zenith')).toContainText('Zenith Cloud')
    await expect(page.getByTestId('server-log')).toContainText('sort=arr desc')
  })

  test('keeps the latest server filter when a stale response resolves late', async ({ page }) => {
    await openServerDataDemo(page)

    await page.getByRole('button', { name: 'Run stale search race' }).click()

    await expect(page.getByRole('textbox', { name: 'Search server accounts' })).toHaveValue(
      'northwind',
    )
    await expect(page.getByTestId('server-loaded-count')).toHaveText('Loaded 1 of 1')
    await expect(row(page, 'northwind')).toBeVisible()
    await expect(row(page, 'northwind')).toContainText('Northwind Health')
    await expect(row(page, 'slowpoke')).toHaveCount(0)
    await expect(page.getByTestId('server-log')).toContainText('Ignored stale response for "slow"')
  })

  test('shows optimistic success and rollback in the rendered table', async ({ page }) => {
    await openServerDataDemo(page)

    await expect(cell(page, 'atlas', 'health')).toContainText('Review')
    await page.getByRole('button', { name: 'Approve Atlas' }).click()
    await expect(cell(page, 'atlas', 'health')).toContainText('Active')
    await expect(cell(page, 'atlas', 'activity')).toContainText('Approval sent to server')
    await expect(page.getByTestId('server-log')).toContainText('Server saved atlas')
    await expect(cell(page, 'atlas', 'activity')).toContainText('Server confirmed approval')

    await expect(cell(page, 'delta', 'health')).toContainText('At Risk')
    await page.getByRole('button', { name: 'Force rejected Delta update' }).click()
    await expect(cell(page, 'delta', 'health')).toContainText('Blocked')
    await expect(page.getByTestId('server-error')).toContainText('Server rejected delta')
    await expect(cell(page, 'delta', 'health')).toContainText('At Risk')
    await expect(cell(page, 'delta', 'activity')).toContainText('Procurement blocked on security')
  })
})

async function openServerDataDemo(page: Page) {
  await page.goto('/gallery/server-data')
  await expect(page.getByTestId('server-data-demo')).toBeVisible()
  await expect(page.getByRole('grid', { name: 'Server-backed accounts table' })).toBeVisible()
  await expect(page.getByTestId('server-status')).toHaveText('Idle')
}

function row(page: Page, rowId: string) {
  return page.locator(`tr[data-row-id="${rowId}"]`)
}

function cell(page: Page, rowId: string, columnId: string) {
  return row(page, rowId).locator(`td[data-column-id="${columnId}"]`)
}
