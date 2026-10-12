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

  // A dialog taller than the screen used to run off both ends of it, leaving
  // the close button and the footer out of reach.
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test.describe(`taller than a ${viewport.width}x${viewport.height} screen`, () => {
      test.use({ viewport })

      test('without a DialogBody it fits the screen and scrolls as a whole', async ({ page }) => {
        const content = await openDialog(page, 'tall')
        const box = (await content.boundingBox())!
        expect(box.y).toBeGreaterThanOrEqual(0)
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
        expect(await content.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
        // The footer is reachable: scrolling the dialog brings it on screen.
        const footer = content.getByRole('button', { name: 'Draft outreach' })
        await footer.scrollIntoViewIfNeeded()
        await expect(footer).toBeInViewport()
        expect(await escapees(page, '[data-slot=dialog-content]')).toEqual([])
      })

      test('with a DialogBody only the body scrolls', async ({ page }) => {
        const content = await openDialog(page, 'tall-body')
        const box = (await content.boundingBox())!
        expect(box.y).toBeGreaterThanOrEqual(0)
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
        const body = content.locator('[data-slot=dialog-body]')
        expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
        // Scroll the body to its end: the title, the footer and the close
        // button are all still on screen.
        await body.locator('[data-tall-row]').last().scrollIntoViewIfNeeded()
        await expect(content.getByRole('heading', { name: 'Ramp' })).toBeInViewport()
        await expect(content.getByRole('button', { name: 'Draft outreach' })).toBeInViewport()
        await expect(content.getByRole('button', { name: 'Close' })).toBeInViewport()
        expect(await content.evaluate((el) => el.scrollTop)).toBe(0)
      })

      test('a body with more than fits has a rule above and below it, each from one edge of the dialog to the other', async ({ page }) => {
        const content = await openDialog(page, 'tall-body')
        const dialog = (await content.boundingBox())!
        const body = (await content.locator('[data-slot=dialog-body]').boundingBox())!
        const title = (await content.getByRole('heading', { name: 'Ramp' }).boundingBox())!
        const footer = (await content.getByRole('button', { name: 'Draft outreach' }).boundingBox())!
        await expect(content.locator('[data-slot=dialog-body-rule]')).toHaveCount(2)
        const top = (await content.locator('[data-slot=dialog-body-rule][data-edge=top]').boundingBox())!
        const bottom = (await content.locator('[data-slot=dialog-body-rule][data-edge=bottom]').boundingBox())!
        for (const rule of [top, bottom]) {
          // Inside the dialog's 1px border, on both sides.
          expect(Math.abs(rule.x - (dialog.x + 1))).toBeLessThanOrEqual(1)
          expect(Math.abs(rule.x + rule.width - (dialog.x + dialog.width - 1))).toBeLessThanOrEqual(1)
        }
        // At the body's own edges: under the header, above the footer.
        expect(Math.abs(top.y - body.y)).toBeLessThanOrEqual(1)
        expect(top.y).toBeGreaterThan(title.y + title.height)
        expect(Math.abs(bottom.y + bottom.height - (body.y + body.height))).toBeLessThanOrEqual(1)
        expect(bottom.y).toBeLessThan(footer.y)
        // And they add no sideways scroll to the dialog.
        expect(await content.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      })
    })
  }

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

test('contact links sit beside the actions, not in the middle of the row', async ({ page }) => {
  await open(page)
  const rows = page.locator('[data-layout-case="clickable-rows"] [data-slot=entity-row]:has([data-slot=badge])')
  await expect(rows).toHaveCount(2)
  for (const row of await rows.all()) {
    const link = (await row.getByRole('link', { name: 'View profile' }).boundingBox())!
    const badge = (await row.locator('[data-slot=badge]').boundingBox())!
    expect(badge.x - (link.x + link.width)).toBe(8)
  }
})

test('a row with onClick shows a pointer, a plain row does not', async ({ page }) => {
  await open(page)
  const cursors = (name: string) =>
    page
      .locator(`[data-layout-case="${name}"] [data-slot=entity-row]`)
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).cursor))
  expect(await cursors('clickable-rows')).toEqual(['pointer', 'pointer', 'pointer'])
  expect(await cursors('entity-list')).toEqual(['auto', 'auto', 'auto'])
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

// A cell taller than its row grew the row and sat hard against the hairlines:
// the cells had no vertical padding at all.
test('a table cell taller than the row keeps clear of the lines above and below', async ({ page }) => {
  await open(page)
  const box = page.locator('[data-layout-case="table-tall-cell"]')
  const cell = box.locator('tbody tr').first().locator('td').nth(1)
  const td = (await cell.boundingBox())!
  const content = (await cell.locator('[data-tall-cell]').boundingBox())!
  expect(td.height).toBeGreaterThan(68) // the row did grow
  expect(content.y - td.y).toBeGreaterThanOrEqual(8)
  expect(td.y + td.height - (content.y + content.height)).toBeGreaterThanOrEqual(8)
})

// In a fixed layout the one width-less column takes what the others leave. When
// they left nothing it was 0px wide, and its text was drawn over the next cell.
test('a fixed table keeps its width-less column, and scrolls sideways before squeezing it out', async ({ page }) => {
  await open(page)
  const box = page.locator('[data-scroll-case="table-fixed-squeezed"]')
  const row = box.locator('tbody tr').first()
  const first = (await row.locator('td').nth(0).boundingBox())!
  const second = (await row.locator('td').nth(1).boundingBox())!
  expect(first.width).toBeGreaterThanOrEqual(190) // 12rem
  const name = (await row.locator('[data-signal-name]').boundingBox())!
  const badge = (await row.locator('td').nth(1).locator('[data-slot=badge]').boundingBox())!
  expect(overlaps(name, badge)).toBe(false)
  expect(name.x + name.width).toBeLessThanOrEqual(second.x + 1)
  // The other columns keep the widths they were given; the table scrolls.
  expect(Math.round(second.width)).toBe(112) // 7rem
  const scroller = box.locator('[data-slot=table-container]')
  expect(await scroller.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
})

test('a fixed table with room to spare is given no minimum width', async ({ page }) => {
  await open(page)
  const tables = page.locator('[data-layout-case^="table-few-rows"] table')
  expect(await tables.count()).toBeGreaterThan(0)
  for (const t of await tables.all()) expect(await t.evaluate((el: HTMLElement) => el.style.minWidth)).toBe('')
})

// A StatBand lays out by its own width. It used to follow the window, so in a
// narrow column on a desktop screen (a Split's aside) three figures got 50px
// each: labels cut to a letter, and the logo stack on top of the hint.
test.describe('StatBand by its own width', () => {
  const cells = (page: Page, name: string) =>
    page.locator(`[data-layout-case="${name}"] [data-slot=stat-band] > div`)
  const boxes = async (page: Page, name: string) =>
    Promise.all((await cells(page, name).all()).map(async (c) => (await c.boundingBox())!))

  test('at a page width the figures share one row', async ({ page }) => {
    await open(page)
    const all = await boxes(page, 'stat-band-wide')
    expect(all).toHaveLength(3)
    expect(new Set(all.map((b) => Math.round(b.y))).size).toBe(1)
  })

  test('in a 200px column they stack, one a row, at the full width', async ({ page }) => {
    await open(page)
    const band = (await page.locator('[data-layout-case="stat-band-aside"] [data-slot=stat-band]').boundingBox())!
    const all = await boxes(page, 'stat-band-aside')
    expect(all).toHaveLength(3)
    expect(new Set(all.map((b) => Math.round(b.y))).size).toBe(3)
    for (const b of all) expect(b.width).toBeGreaterThanOrEqual(band.width - 2)
  })

  test('in a narrow cell the label is whole and the media sits under the text', async ({ page }) => {
    await open(page)
    const first = cells(page, 'stat-band-aside').first()
    const label = first.locator('dt')
    await expect(label).toHaveText('Two or more signals')
    expect(await label.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    const text = (await first.locator('> div').first().boundingBox())!
    const media = (await first.locator('[data-slot=entity-stack]').boundingBox())!
    expect(overlaps(text, media)).toBe(false)
    expect(media.y).toBeGreaterThanOrEqual(text.y + text.height)
  })

  test('the headed band stacks the same way', async ({ page }) => {
    await open(page)
    const all = await boxes(page, 'stat-band-headed-aside')
    expect(all).toHaveLength(2)
    expect(new Set(all.map((b) => Math.round(b.y))).size).toBe(2)
  })

  test('stretched taller than its figures, they stay at the top', async ({ page }) => {
    await open(page)
    const band = (await page.locator('[data-layout-case="stat-band-stretched"] [data-slot=stat-band]').boundingBox())!
    expect(band.height).toBe(600)
    const all = await boxes(page, 'stat-band-stretched')
    const last = all[all.length - 1]
    expect(last.y + last.height - band.y).toBeLessThan(400)
  })
})

// A dialog is read, so it sits on the lightest surface, not the page's canvas.
test('a dialog is on the card surface, lighter than the page behind it', async ({ page }) => {
  const content = await openDialog(page, 'facts')
  const colours = await content.evaluate((el) => {
    const probe = (value: string) => {
      const p = document.createElement('div')
      p.style.background = value
      document.body.appendChild(p)
      const c = getComputedStyle(p).backgroundColor
      p.remove()
      return c
    }
    return {
      dialog: getComputedStyle(el).backgroundColor,
      card: probe('var(--surface-card)'),
      shell: probe('var(--surface-shell)'),
    }
  })
  expect(colours.dialog).toBe(colours.card)
  expect(colours.dialog).not.toBe(colours.shell)
})

test('in a dialog the summary line and the fact labels are 16px, over 14px text', async ({ page }) => {
  const content = await openDialog(page, 'facts')
  const size = (sel: string) =>
    content.locator(sel).first().evaluate((el) => getComputedStyle(el).fontSize)
  expect(await size('[data-slot=dialog-description]')).toBe('16px')
  expect(await size('[data-slot=fact-label]')).toBe('16px')
  expect(await size('[data-slot=fact-text]')).toBe('14px')
})

test('a company given as a dialog title is drawn large: 64px logo, 24px name, 14px firmographics', async ({ page }) => {
  const content = await openDialog(page, 'facts')
  const title = content.locator('[data-slot=dialog-title]')
  const logo = (await title.locator('[data-slot=company-logo]').boundingBox())!
  expect(Math.round(logo.width)).toBe(64)
  expect(await title.locator('[data-slot=entity-name]').evaluate((el) => getComputedStyle(el).fontSize)).toBe('24px')
  expect(await title.locator('[data-slot=company-meta]').evaluate((el) => getComputedStyle(el).fontSize)).toBe('14px')
  // `medium` is 768px wide.
  expect(Math.round((await content.boundingBox())!.width)).toBe(768)
  // Outside a dialog title the same name keeps its own size.
  await open(page)
  const elsewhere = page.locator('[data-layout-case] [data-slot=entity-name]').first()
  expect(await elsewhere.evaluate((el) => getComputedStyle(el).fontSize)).not.toBe('24px')
})

test('on a card a fact label keeps its 13px', async ({ page }) => {
  await open(page)
  const label = page.locator('[data-layout-case] [data-slot=fact-label]').first()
  expect(await label.evaluate((el) => getComputedStyle(el).fontSize)).toBe('13px')
})

// An event built from chips and paragraphs was one size in one grey. The
// component gives each part a weight of its own.
test.describe('EvidenceItem', () => {
  const item = (page: Page, name = 'evidence') =>
    page.locator(`[data-layout-case="${name}"] [data-slot=evidence-item]`).first()
  const style = (page: Page, sel: string) =>
    item(page)
      .locator(sel)
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el)
        return { size: cs.fontSize, weight: Number(cs.fontWeight), color: cs.color, background: cs.backgroundColor }
      })

  test('the headline is larger, heavier and darker than the text under it', async ({ page }) => {
    await open(page)
    const title = await style(page, '[data-slot=evidence-title]')
    const text = await style(page, '[data-slot=evidence-text]')
    expect(title.size).toBe('16px')
    expect(text.size).toBe('14px')
    expect(title.weight).toBeGreaterThanOrEqual(600)
    expect(text.weight).toBeLessThan(500)
    expect(title.color).not.toBe(text.color)
  })

  test('the tags are tinted, and are not the colour of the text', async ({ page }) => {
    await open(page)
    const tag = await style(page, '[data-slot=evidence-tags] [data-slot=badge]')
    const text = await style(page, '[data-slot=evidence-text]')
    expect(tag.color).not.toBe(text.color)
    expect(tag.background).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('five tags show as three and a count of the rest', async ({ page }) => {
    await open(page)
    const tags = item(page).locator('[data-slot=evidence-tags] [data-slot=badge]')
    await expect(tags).toHaveCount(4)
    await expect(tags.last()).toHaveText('+2 more')
    await expect(tags.last()).toHaveAttribute('title', 'Payments migration, Subscription billing')
  })

  test('the source sits under the headline, and the list has room between its items', async ({ page }) => {
    await open(page)
    const title = (await item(page).locator('[data-slot=evidence-title]').boundingBox())!
    const source = (await item(page).locator('[data-slot=evidence-source]').boundingBox())!
    expect(source.y).toBeGreaterThanOrEqual(title.y + title.height)
    const items = page.locator('[data-layout-case="evidence"] [data-slot=evidence-item]')
    const first = (await items.nth(0).boundingBox())!
    const second = (await items.nth(1).boundingBox())!
    await expect(page.locator('[data-layout-case="evidence"] [data-slot=evidence-list-title]')).toHaveText('Events (2)')
    // 20px of padding on each side of the hairline: more than the 8px inside an item.
    expect(second.y - (first.y + first.height)).toBeGreaterThanOrEqual(0)
    expect(await items.nth(1).evaluate((el) => getComputedStyle(el).paddingTop)).toBe('20px')
  })
})

test('a dialog body that fits has no rules', async ({ page }) => {
  const content = await openDialog(page, 'short-body')
  await expect(content.locator('[data-slot=dialog-body]')).toBeVisible()
  await expect(content.locator('[data-slot=dialog-body-rule]')).toHaveCount(0)
})

test('a TagChip shows text given as children', async ({ page }) => {
  await open(page)
  await expect(page.locator('[data-layout-case="tag-chip-children"]')).toHaveText('Fraud & KYC hiring')
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

test.describe('a table sizes its rows to the list', () => {
  const face = (page: Page, name: string) =>
    page.locator(`[data-layout-case="${name}"] tbody tr`).first().locator('[data-slot=person-avatar]')

  test('six rows or fewer: 64px faces on 88px rows', async ({ page }) => {
    await open(page)
    expect((await face(page, 'table-few-rows').boundingBox())!.width).toBe(64)
    const row = page.locator('[data-layout-case="table-few-rows"] tbody tr').first()
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(88)
  })

  test('while loading, the skeleton rows are the size the rows will be', async ({ page }) => {
    await open(page)
    const loading = page.locator('[data-layout-case="table-few-rows-loading"] tbody tr').first()
    const loaded = page.locator('[data-layout-case="table-few-rows"] tbody tr').first()
    expect((await loading.boundingBox())!.height).toBe((await loaded.boundingBox())!.height)
    expect((await loading.locator('[data-slot=skeleton]').first().boundingBox())!.width).toBe(64)
  })

  test('more than six rows: the standard 48px faces', async ({ page }) => {
    await open(page)
    expect((await face(page, 'table-many-rows').boundingBox())!.width).toBe(48)
  })

  test('a person with its own size keeps it, name included', async ({ page }) => {
    await open(page)
    const box = page.locator('[data-layout-case="table-few-rows-pinned-size"]')
    expect((await box.locator('[data-slot=person-avatar]').boundingBox())!.width).toBe(36)
    const name = box.locator('[data-slot=entity-row] span.truncate').first()
    expect(await name.evaluate((el) => getComputedStyle(el).fontSize)).toBe('14px')
  })
})
