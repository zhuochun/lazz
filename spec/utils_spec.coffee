utils = require "../lib/utils"

describe "utils", ->
  it "check is json", ->
    expect(utils.isJSON("abc")).toBe(false)
    files = ["abc.json", "abc.JSON", "abc.Json", ".json"]
    expect(utils.isJSON(file)).toBe(true) for file in files

  it "get keyname", ->
    files = ["abc.", "abc.md", "abc.json"]
    expect(utils.keyname(file)).toBe("abc") for file in files

  it "fix file path", ->
    htmls = ["test.jade", "test.html", "test.md"]
    expect(utils.fixPath(html)).toBe("test.html") for html in htmls
    htmls = ["test.less", "test.scss", "test.xml"]
    expect(utils.fixPath(html)).toBe(html) for html in htmls
