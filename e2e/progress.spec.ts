import { test, expect } from '@playwright/test'

test('dashboard to quiz challenge, complete, progress updated', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Interview prep' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Quiz' }).click()
  await expect(page).toHaveURL(/type=quiz/)

  await page.getByTestId('challenge-card-quiz-http-methods').click()
  await expect(
    page.getByRole('heading', { name: /Idempotent HTTP/i }),
  ).toBeVisible()

  await page.locator('input[type="radio"]').nth(1).check()
  await page.getByTestId('quiz-check').click()
  await page.getByTestId('quiz-mark-complete').click()
  await page.getByRole('link', { name: '← Back' }).click()

  await expect(
    page.getByTestId('challenge-card-quiz-http-methods'),
  ).toContainText('Completed')
})

test('mobile viewport loads dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Interview prep' }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Main' }),
  ).toBeVisible()
})

test('coding workspace: collapse problem and run code', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/challenges/js-closure-counter')
  await expect(
    page.getByRole('heading', {
      name: /Implement a closure counter/i,
    }),
  ).toBeVisible()
  await page.getByTestId('toggle-problem-panel').click()
  await expect(
    page.getByRole('heading', {
      name: /Implement a closure counter/i,
    }),
  ).toHaveCount(0)
  await expect(page.getByTestId('ai-tutor-panel')).toBeVisible()
  await page.getByTestId('toggle-problem-panel').click()
  await expect(
    page.getByRole('heading', {
      name: /Implement a closure counter/i,
    }),
  ).toBeVisible()
  await page.getByTestId('run-tests').click()
  await expect(page.getByTestId('test-results')).toBeVisible()
})
