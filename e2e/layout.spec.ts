import { expect, test, type Page } from '@playwright/test'

async function open(page: Page, query = '') {
  await page.goto(`/layout-check${query}`)
  await page.locator('[data-layout-ready]').waitFor()
}

/** Wait for enter animations: a dialog scales in, which skews its boxes. */
async function settle(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined))
    )
  )
}

/**
 * Every descendant of each `rootSelector` box that sticks out of it sideways,
 * as readable strings. Vertical growth is fine (cards grow); sideways is how
 * a slot breaks. Shadows and rings are not part of a bounding box.
 */
async function escapees(page: Page, rootSelector: string) {
  return page.evaluate((sel) => {
    const out: string[] = []
    for (const box of document.querySelectorAll<HTMLElement>(sel)) {
      const b = box.getBoundingClientRect()
      for (const el of box.querySelectorAll<HTMLElement>('*')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const by = Math.max(b.left - r.left, r.right - b.right)
        if (by > 1) {
          const label = box.dataset.layoutCase ?? box.dataset.slot ?? sel
          const text = (el.textContent ?? '').trim().slice(0, 30)
          out.push(`${label}: <${el.tagName.toLowerCase()}> "${text}" sticks out by ${Math.round(by)}px`)
        }
      }
    }
    return out
  }, rootSelector)
}

type Box = { x: number; y: number; width: number; height: number }

function overlaps(a: Box, b: Box) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

async function openDialog(page: Page, mode: string) {
  await open(page, `?dialog=${mode}`)
  const content = page.locator('[data-slot=dialog-content]')
  await content.waitFor()
  await settle(page)
  return content
}

async function expectCloseClearsBanner(page: Page, mode: string) {
  const content = await openDialog(page, mode)
  const close = (await content.getByRole('button', { name: 'Close' }).boundingBox())!
  const banner = (await content.locator('[data-slot=person-banner]').boundingBox())!
  expect(overlaps(close, banner)).toBe(false)
  expect(await escapees(page, '[data-slot=dialog-content]')).toEqual([])
}

test('nothing sticks out of any case', async ({ page }) => {
  await open(page)
  expect(await escapees(page, '[data-layout-case]')).toEqual([])
})

test.describe('card footers', () => {
  test('the footer button is right-aligned when the person has no contact links', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="person-card-no-contact"]')
    const card = (await box.locator('[data-slot=person-card]').boundingBox())!
    const button = (await box.locator('[data-slot=button]').boundingBox())!
    expect(card.x + card.width - (button.x + button.width)).toBeLessThan(24)
  })

  test('a long footer label drops under the contact links', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="person-card-long-footer-label"]')
    const link = (await box.locator('a[href^="mailto:"]').boundingBox())!
    const button = (await box.locator('[data-slot=button]').boundingBox())!
    expect(button.y).toBeGreaterThanOrEqual(link.y + link.height - 1)
  })
})

test.describe('narrow panels', () => {
  test('a callout puts its action under the text, not beside it', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="callout-action-narrow"]')
    const text = (await box.locator('.text-body').boundingBox())!
    const action = (await box.locator('[data-slot=button]').boundingBox())!
    expect(action.y).toBeGreaterThanOrEqual(text.y + text.height - 1)
  })

  test('a panel header keeps its title readable beside wide actions', async ({ page }) => {
    await open(page)
    const title = page.locator('[data-layout-case="surface-header-wide-actions"] .text-card-title')
    expect((await title.boundingBox())!.width).toBeGreaterThan(120)
  })
})

test.describe('dialogs', () => {
  test('hand-composed: the close button clears the banner', async ({ page }) => {
    await expectCloseClearsBanner(page, 'banner')
  })

  test('PersonDialog: the close button clears the banner', async ({ page }) => {
    await expectCloseClearsBanner(page, 'person')
    await expect(page.getByRole('dialog', { name: 'Dana Whitfield' })).toBeVisible()
  })

  test('a long row does not widen the other children', async ({ page }) => {
    await openDialog(page, 'long-row')
    expect(await escapees(page, '[data-slot=dialog-content]')).toEqual([])
  })

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('the person dialog with a move inside has no sideways overflow', async ({ page }) => {
      await expectCloseClearsBanner(page, 'person')
      await expect(page.locator('[data-slot=dialog-content] [data-slot=job-move-side]')).toHaveCount(2)
    })
  })
})

test('rows in an EntityList keep clear of each other', async ({ page }) => {
  await open(page)
  const avatars = page.locator('[data-layout-case="entity-list"] [data-slot=person-avatar]')
  await expect(avatars).toHaveCount(3)
  const boxes = await avatars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i].top - boxes[i - 1].bottom).toBeGreaterThanOrEqual(16)
  }
})

test.describe('JobMove', () => {
  test('wide: two equal tiles, with the label above the logo', async ({ page }) => {
    await open(page)
    const sides = page.locator('[data-layout-case="job-move-wide"] [data-slot=job-move-side]')
    await expect(sides).toHaveCount(2)
    const left = (await sides.nth(0).boundingBox())!
    const right = (await sides.nth(1).boundingBox())!
    expect(Math.abs(left.width - right.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(left.height - right.height)).toBeLessThanOrEqual(1)
    expect(right.x).toBeGreaterThan(left.x + left.width)
    const label = (await sides.nth(0).locator('[data-slot=job-move-label]').boundingBox())!
    const logo = (await sides.nth(0).locator('[data-slot=company-logo]').boundingBox())!
    expect(logo.y).toBeGreaterThanOrEqual(label.y + label.height - 1)
  })

  test('narrow: two slim rows, one under the other', async ({ page }) => {
    await open(page)
    const sides = page.locator('[data-layout-case="job-move-narrow"] [data-slot=job-move-side]')
    const first = (await sides.nth(0).boundingBox())!
    const second = (await sides.nth(1).boundingBox())!
    expect(second.y).toBeGreaterThan(first.y + first.height)
    expect(first.height).toBeLessThan(56)
  })
})
