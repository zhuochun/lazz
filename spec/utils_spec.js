var utils;

utils = require("../lib/utils");

describe("utils", function() {
  it("check is json", function() {
    var file, files, _i, _len, _results;
    expect(utils.isJSON("abc")).toBe(false);
    files = ["abc.json", "abc.JSON", "abc.Json", ".json"];
    _results = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      _results.push(expect(utils.isJSON(file)).toBe(true));
    }
    return _results;
  });
  it("get keyname", function() {
    var file, files, _i, _len, _results;
    files = ["abc.", "abc.md", "abc.json"];
    _results = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      _results.push(expect(utils.keyname(file)).toBe("abc"));
    }
    return _results;
  });
  return it("fix file path", function() {
    var html, htmls, _i, _j, _len, _len1, _results;
    htmls = ["test.jade", "test.html", "test.md"];
    for (_i = 0, _len = htmls.length; _i < _len; _i++) {
      html = htmls[_i];
      expect(utils.fixPath(html)).toBe("test.html");
    }
    htmls = ["test.less", "test.scss", "test.xml"];
    _results = [];
    for (_j = 0, _len1 = htmls.length; _j < _len1; _j++) {
      html = htmls[_j];
      _results.push(expect(utils.fixPath(html)).toBe(html));
    }
    return _results;
  });
});
