const url = require('url')

async function test_table() {
  const table = await $('#table')
  expect(await table.getAttribute('class')).toMatch(/\btsorterSortable\b/)
  let header = await $('#table th:first-child')
  if (header.error)
    header = await $('#table td:first-child')
  await header.click()
  const rows = await $$('#table tr')
  expect(await rows.every(async (element, index) => {
    if (index < 1) return true
    const cell = await element.$('td:first-child')
    const value = parseInt(await cell.getText())
    return value == index
  })).toBeTrue()
}

describe("tsorter", () => {
  it('works with filename full-table.html', async () => {
    await browser.url(url.pathToFileURL('spec/full-table.html').href)
    expect(await browser.getTitle()).toBe('full-table.html')
    await test_table()
  })
  it('works with filename basic-table.html', async () => {
    await browser.url(url.pathToFileURL('spec/basic-table.html').href)
    expect(await browser.getTitle()).toBe('basic-table.html')
    await test_table()
  })
  it('works with filename no-head-table.html', async () => {
    await browser.url(url.pathToFileURL('spec/no-head-table.html').href)
    expect(await browser.getTitle()).toBe('no-head-table.html')
    await test_table()
  })
  it('works with filename no-body-table.html', async () => {
    await browser.url(url.pathToFileURL('spec/no-body-table.html').href)
    expect(await browser.getTitle()).toBe('no-body-table.html')
    await test_table()
  })
})
