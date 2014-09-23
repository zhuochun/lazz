lazz = require "../lib/lazz"

# default config
config =
  source: __dirname
  destination: __dirname
  layout: __dirname

describe "Lazz", ->
  beforeEach ->
    lazz.config(config)

  it "customize config", ->
    expect(lazz._config.source).toBe(config.source)

  it "set globals", ->
    lazz.global(title: "website")
    expect(lazz._data.site.title).toBe("website")

  it "set globals from JSON", (done) ->
    lazz.global("./fixture/*.json")
    expect(lazz._task.read.length).toBe(1)
    task = lazz._task.read[0]
    task ->
      expect(lazz._data.site.fruits).toBeDefined()
      done()

  it "process data", (done) ->
    lazz.process((data, done) -> data.special = "defined"; done())
    expect(lazz._task.process.length).toBe(1)
    task = lazz._task.process[0]
    task ->
      expect(lazz._data.special).toBe("defined")
      done()

  it "add filters", ->
    lazz.helper("name", -> @ )
    expect(lazz._data.fn.$name()).toBe(lazz._data)

  it "add compiler at head", ->
    compiler = { extnames: [".css"], runner: () -> }
    lazz.compiler(compiler)
    expect(lazz._compilers[0]).toBe(compiler)

  it "add assets", (done) ->
    lazz._task.read.length = 0
    lazz.asset("./fixture/*.styl")
    expect(lazz._task.read.length).toBe(1)
    task = lazz._task.read[0]
    task ->
      expect(lazz._data.file.asset.length).toBe(1)
      expect(lazz._storage.path.length).toBe(1)
      expect(lazz._data.asset['fixture/main.styl']).toBeDefined()
      done()

  it "parse a file buffer", ->
    data = lazz._parseBuffer("""
      ---
      title: hello world
      layout: post
      ---

      this is content.
      """, { keyword: "lazz" })
    expect(data.keyword).toBe("lazz")
    expect(data.layout).toBe("post")
    expect(data.content).toBe("\nthis is content.")

  it "read a file", ->
    expect(lazz._data.file["post"]).toBeUndefined()
    lazz._data.file["post"] = []
    lazz._readFile("post", "./fixture/post.md")
    expect(lazz._data.file["post"]).toBeDefined()
    post = lazz._data.file["post"][0]
    expect(post.layout).toBe("post")
    expect(post.path).toBe("fixture/post.html")

  it "compile markdown content", (done) ->
    file =
      __extname: ".md"
      content: "**bold** and _italic_"

    lazz._compile file, (error, file) ->
      expect(file).toBe("<p><strong>bold</strong> and <em>italic</em></p>\n")
      done()

  it "compile markdown with layout", (done) ->
    file =
      __extname: ".md"
      title: "my title"
      layout: "fixture/post"
      content: "**my content**"

    output = """
<!DOCTYPE html><html><head><title>my title</title></head><body><p><strong>my content</strong></p>
</body></html>
"""
    lazz._compile file, (error, file) ->
      expect(file).toBe(output)
      done()
