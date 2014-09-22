var PATH_MAP, fixPath, fs, isFile, isFileType, isJSON, keyname, path;

fs = require("fs-extra");

path = require("path");

isFile = function(file) {
  return fs.statSync(file).isFile();
};

isFileType = function(types, file) {
  file = file.toLowerCase();
  return types.indexOf(file) !== -1 || types.indexOf(path.extname(file)) !== -1;
};

isJSON = isFileType.bind(void 0, [".json"]);

keyname = function(file) {
  return path.basename(file, path.extname(file));
};

PATH_MAP = {
  ".html": [".html", ".jade", ".md", ".mkd", ".markdown"],
  ".css": [".css", ".styl"],
  ".js": [".js", ".coffee"]
};

fixPath = function(file) {
  var extname, filename, type, vals;
  extname = path.extname(file).toLowerCase();
  filename = path.basename(file, extname);
  for (type in PATH_MAP) {
    vals = PATH_MAP[type];
    if (vals.indexOf(extname) !== -1) {
      extname = type;
      break;
    }
  }
  file = path.join(path.dirname(file), "" + filename + extname);
  return path.normalize(file);
};

module.exports = {
  isFile: isFile,
  isFileType: isFileType,
  isJSON: isJSON,
  keyname: keyname,
  fixPath: fixPath
};
