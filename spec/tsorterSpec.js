var url = require('url')
// var fs = require('fs')
// var files = fs.readdirSync('.')
// for (var index = 0; index < files.length; index++) {
//   var filename = files[index]
//   if (!/.html$/.test(filename)) continue
//   describe("tsorter", function () {
//     it('work with filename' + filename, function () {
//       browser.url(url.pathToFileURL('spec/' + filename).href)
//       expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js')
//     })
//   })
// }

function test_table() {
  var table = $('#table')
  expect(table.getAttribute('class')).toBe(' tsorterSortable')
}

describe("tsorter", function () {
  it('works with filename full-table.html', function () {
    browser.url(url.pathToFileURL('spec/full-table.html').href)
    expect(browser).toHaveTitle('full-table.html')
    test_table()
  })
  it('works with filename basic-table.html', function () {
    browser.url(url.pathToFileURL('spec/basic-table.html').href)
    expect(browser).toHaveTitle('basic-table.html')
    test_table()
  })
  it('works with filename no-head-table.html', function () {
    browser.url(url.pathToFileURL('spec/no-head-table.html').href)
    expect(browser).toHaveTitle('no-head-table.html')
    test_table()
  })
  it('works with filename no-body-table.html', function () {
    browser.url(url.pathToFileURL('spec/no-body-table.html').href)
    expect(browser).toHaveTitle('no-body-table.html')
    test_table()
  })
})
