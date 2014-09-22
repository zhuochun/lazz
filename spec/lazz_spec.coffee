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
    expect(lazz._data.meta.title).toBe("website")

  it "transform data", ->
    lazz.transform((data) -> data.special = "defined")
    expect(lazz._data.special).toBe("defined")

  it "add filters", ->
    lazz.filter({ name: -> "name" })
    expect(lazz._data.filter.name).toBeDefined()

  it "parse a content file", ->
    data = lazz._parse("""
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
    lazz._read("post", "./fixture/post.md")
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