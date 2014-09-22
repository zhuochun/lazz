fs = require "fs-extra"
path = require "path"

isFile = (file) -> fs.statSync(file).isFile()

isFileType = (types, file) ->
  file = file.toLowerCase()
  types.indexOf(file) != -1 ||
    types.indexOf(path.extname(file)) != -1

isJSON = isFileType.bind(undefined, [".json"])

keyname = (file) ->
  path.basename(file, path.extname(file))

PATH_MAP =
  ".html": [".html", ".jade", ".md", ".mkd", ".markdown"]
  ".css": [".css", ".styl"]
  ".js": [".js", ".coffee"]

fixPath = (file) ->
  extname = path.extname(file).toLowerCase()
  filename = path.basename(file, extname)

  for type, vals of PATH_MAP
    if vals.indexOf(extname) != -1
      extname = type
      break

  file = path.join(path.dirname(file), "#{filename}#{extname}")
  return path.normalize(file)

module.exports =
  isFile: isFile
  isFileType: isFileType
  isJSON: isJSON
  keyname: keyname
  fixPath: fixPath
