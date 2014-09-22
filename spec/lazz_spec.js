var config, lazz;

lazz = require("../lib/lazz");

config = {
  source: __dirname,
  destination: __dirname,
  layout: __dirname
};

describe("Lazz", function() {
  beforeEach(function() {
    return lazz.config(config);
  });
  it("customize config", function() {
    return expect(lazz._config.source).toBe(config.source);
  });
  it("set globals", function() {
    lazz.global({
      title: "website"
    });
    return expect(lazz._data.meta.title).toBe("website");
  });
  it("set globals from JSON", function(done) {
    var task;
    lazz.global("./fixture/*.json");
    expect(lazz._task.read.length).toBe(1);
    task = lazz._task.read[0];
    return task(function() {
      expect(lazz._data.meta.fruits).toBeDefined();
      return done();
    });
  });
  it("transform data", function(done) {
    var task;
    lazz.transform(function(data, done) {
      data.special = "defined";
      return done();
    });
    expect(lazz._task.process.length).toBe(1);
    task = lazz._task.process[0];
    return task(function() {
      expect(lazz._data.special).toBe("defined");
      return done();
    });
  });
  it("add filters", function() {
    lazz.filter({
      name: function() {
        return "name";
      }
    });
    return expect(lazz._data.filter.name).toBeDefined();
  });
  it("add compiler at head", function() {
    var compiler;
    compiler = {
      extnames: [".css"],
      runner: function() {}
    };
    lazz.compiler(compiler);
    return expect(lazz._compilers[0]).toBe(compiler);
  });
  it("add assets", function(done) {
    var task;
    lazz._task.read.length = 0;
    lazz.asset("./fixture/*.styl");
    expect(lazz._task.read.length).toBe(1);
    task = lazz._task.read[0];
    return task(function() {
      expect(lazz._data.file.asset.length).toBe(1);
      expect(lazz._storage.path.length).toBe(1);
      expect(lazz._data.asset['fixture/main.styl']).toBeDefined();
      return done();
    });
  });
  it("parse a file buffer", function() {
    var data;
    data = lazz._parseBuffer("---\ntitle: hello world\nlayout: post\n---\n\nthis is content.", {
      keyword: "lazz"
    });
    expect(data.keyword).toBe("lazz");
    expect(data.layout).toBe("post");
    return expect(data.content).toBe("\nthis is content.");
  });
  it("read a file", function() {
    var post;
    expect(lazz._data.file["post"]).toBeUndefined();
    lazz._data.file["post"] = [];
    lazz._readFile("post", "./fixture/post.md");
    expect(lazz._data.file["post"]).toBeDefined();
    post = lazz._data.file["post"][0];
    expect(post.layout).toBe("post");
    return expect(post.path).toBe("fixture/post.html");
  });
  it("compile markdown content", function(done) {
    var file;
    file = {
      __extname: ".md",
      content: "**bold** and _italic_"
    };
    return lazz._compile(file, function(error, file) {
      expect(file).toBe("<p><strong>bold</strong> and <em>italic</em></p>\n");
      return done();
    });
  });
  return it("compile markdown with layout", function(done) {
    var file, output;
    file = {
      __extname: ".md",
      title: "my title",
      layout: "fixture/post",
      content: "**my content**"
    };
    output = "<!DOCTYPE html><html><head><title>my title</title></head><body><p><strong>my content</strong></p>\n</body></html>";
    return lazz._compile(file, function(error, file) {
      expect(file).toBe(output);
      return done();
    });
  });
});
