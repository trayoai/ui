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
  for (const [name, slot] of [
    ['person-card-bare-footer-button', 'person-card'],
    ['company-card-bare-footer-button', 'company-card'],
  ]) {
    test(`${name}: a w-full button stays compact, at the right`, async ({ page }) => {
      await open(page)
      const box = page.locator(`[data-layout-case="${name}"]`)
      const card = (await box.locator(`[data-slot=${slot}]`).boundingBox())!
      const button = (await box.locator('[data-slot=button]').boundingBox())!
      expect(button.width).toBeLessThan(card.width / 2)
      expect(button.height).toBe(32)
      expect(card.x + card.width - (button.x + button.width)).toBeLessThan(24)
    })
  }

  test('a footer button is secondary unless it names a variant', async ({ page }) => {
    await open(page)
    const fill = (name: string, label: string) =>
      page
        .locator(`[data-layout-case="${name}"]`)
        .getByRole('button', { name: label })
        .evaluate((el) => getComputedStyle(el).backgroundImage + getComputedStyle(el).backgroundColor)
    const secondary = await fill('person-card-explicit-footer-button', 'Skip')
    expect(await fill('person-card-bare-footer-button', 'Draft intro')).toBe(secondary)
    expect(await fill('person-card-explicit-footer-button', 'Draft intro')).not.toBe(secondary)
  })

  test('a footer button inside a tooltip gets the same defaults', async ({ page }) => {
    await open(page)
    const look = (name: string, label: string) =>
      page
        .locator(`[data-layout-case="${name}"]`)
        .getByRole('button', { name: label })
        .evaluate((el) => {
          const s = getComputedStyle(el)
          return s.backgroundImage + s.backgroundColor + el.getBoundingClientRect().height
        })
    expect(await look('person-card-wrapped-footer-button', 'Draft intro')).toBe(
      await look('person-card-bare-footer-button', 'Draft intro')
    )
  })

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

test.describe('faces and logos lead, text stays short', () => {
  test('a person row has a 48px face and a 20px company mark', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="person-row"]')
    expect((await box.locator('[data-slot=person-avatar]').boundingBox())!.width).toBe(48)
    expect((await box.locator('[data-slot=company-logo]').boundingBox())!.width).toBe(20)
  })

  for (const [name, image] of [
    ['person-card-long-text', 'person-avatar'],
    ['company-card-long-text', 'company-logo'],
  ]) {
    test(`${name}: a 64px image, a three-line summary, three tags and a count`, async ({ page }) => {
      await open(page)
      const box = page.locator(`[data-layout-case="${name}"]`)
      expect((await box.locator(`[data-slot=${image}]`).first().boundingBox())!.width).toBe(64)
      const summary = box.locator('p')
      const lines = await summary.evaluate(
        (el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)
      )
      expect(Math.round(lines)).toBe(3)
      const tags = await box.locator('[data-slot=badge]').allTextContents()
      expect(tags).toHaveLength(4)
      expect(tags[3]).toBe('+2')
    })
  }
})

test.describe('person banner', () => {
  for (const name of ['person-banner-dialog-width', 'person-banner-narrow']) {
    test(`${name}: the title and the company are both readable in full`, async ({ page }) => {
      await open(page)
      const box = page.locator(`[data-layout-case="${name}"]`)
      for (const slot of ['person-banner-title', 'person-banner-company']) {
        const cut = await box
          .locator(`[data-slot=${slot}]`)
          .evaluate((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        expect(cut, slot).toBe(false)
      }
    })
  }

  test('narrow: the action moves under the text instead of squeezing it', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="person-banner-narrow"]')
    const title = (await box.locator('[data-slot=person-banner-title]').boundingBox())!
    const button = (await box.locator('[data-slot=button]').boundingBox())!
    expect(button.y).toBeGreaterThanOrEqual(title.y + title.height - 1)
  })
})

test('a fact list sets its labels apart: darker than the text under them, with room between facts', async ({
  page,
}) => {
  await open(page)
  const box = page.locator('[data-layout-case="fact-list"]')
  const style = (slot: string) =>
    box
      .locator(`[data-slot=${slot}]`)
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el)
        return { color: s.color, weight: Number(s.fontWeight) }
      })
  const label = await style('fact-label')
  const text = await style('fact-text')
  expect(label.weight).toBeGreaterThanOrEqual(600)
  expect(label.color).not.toBe(text.color)
  // The label is the page's primary ink, the same as a person's name.
  const ink = await page.locator('[data-layout-case="person-row"] .text-name').evaluate((el) => getComputedStyle(el).color)
  expect(label.color).toBe(ink)
  const facts = box.locator('[data-slot=fact]')
  const first = (await facts.nth(0).boundingBox())!
  const second = (await facts.nth(1).boundingBox())!
  const between = second.y - (first.y + first.height)
  const labelBox = (await facts.nth(1).locator('[data-slot=fact-label]').boundingBox())!
  const textBox = (await facts.nth(1).locator('[data-slot=fact-text]').boundingBox())!
  const within = textBox.y - (labelBox.y + labelBox.height)
  expect(between).toBeGreaterThanOrEqual(16)
  expect(within).toBeLessThanOrEqual(4)
})

test.describe('card text opens in place', () => {
  const lineCount = (el: HTMLElement) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)

  test('a cut summary has a More button that works from the keyboard', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="person-card-long-text"]')
    const more = box.getByRole('button', { name: 'More', exact: true })
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await more.focus()
    await page.keyboard.press('Enter')
    expect(Math.round(await box.locator('p').evaluate(lineCount))).toBeGreaterThan(3)
    const less = box.getByRole('button', { name: 'Less', exact: true })
    await expect(less).toHaveAttribute('aria-expanded', 'true')
    await less.click()
    expect(Math.round(await box.locator('p').evaluate(lineCount))).toBe(3)
    expect(await escapees(page, '[data-layout-case="person-card-long-text"]')).toEqual([])
  })

  test('a formatted summary opens the same way, with nothing left in a tooltip', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="person-card-formatted-text"]')
    await expect(box.locator('p')).not.toHaveAttribute('title')
    await box.getByRole('button', { name: 'More', exact: true }).click()
    await expect(box.locator('p strong')).toBeVisible()
    expect(Math.round(await box.locator('p').evaluate(lineCount))).toBeGreaterThan(3)
  })

  test('a summary that fits has no button', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="person-card-short-text"]')
    await expect(box.locator('p')).toBeVisible()
    await expect(box.getByRole('button')).toHaveCount(0)
  })

  test('the tag count is a button that shows the rest of the tags', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="company-card-long-text"]')
    const count = box.getByRole('button', { name: 'Show 2 more tags' })
    await expect(count).toHaveText('+2')
    await count.focus()
    await page.keyboard.press('Enter')
    await expect(box.locator('[data-slot=badge]')).toContainText(['Series D', 'Fintech', 'Hiring', 'New CFO', 'Expanding'])
    await box.getByRole('button', { name: 'Show fewer tags' }).click()
    await expect(box.locator('[data-slot=badge]')).toHaveCount(4)
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
    expect(boxes[i].top - boxes[i - 1].bottom).toBeGreaterThanOrEqual(24)
  }
})

test('sections in a PageContainer keep clear of each other', async ({ page }) => {
  await open(page)
  const sections = page.locator('[data-layout-case="page-sections"] [data-slot=page-container] > *')
  await expect(sections).toHaveCount(4)
  const boxes = await sections.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i].top - boxes[i - 1].bottom).toBe(24)
  }
})

test('rows side by side sit on the same line', async ({ page }) => {
  await open(page)
  const avatars = page.locator('[data-layout-case="rows-side-by-side"] [data-slot=person-avatar]')
  await expect(avatars).toHaveCount(2)
  const [a, b] = await avatars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
  expect(b).toBe(a)
})

test('table skeletons are the size of the cells they stand in for', async ({ page }) => {
  await open(page)
  const width = async (name: string, selector: string) =>
    (await page.locator(`[data-layout-case="${name}"] tbody ${selector}`).first().boundingBox())!.width
  expect(await width('table-loading', 'td:nth-child(1) [data-slot=skeleton]')).toBe(
    await width('table-loaded', '[data-slot=person-avatar]')
  )
  expect(await width('table-loading', 'td:nth-child(2) [data-slot=skeleton]')).toBe(
    await width('table-loaded', 'td:nth-child(2) [data-slot=company-logo]')
  )
})

test('a dialog with no size is 576px wide', async ({ page }) => {
  const content = await openDialog(page, 'banner')
  expect((await content.boundingBox())!.width).toBe(576)
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
