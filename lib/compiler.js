var coffee, coffeeCompiler, jade, jadeCompiler, marked, markedCompiler, stylus, stylusCompiler, _;

_ = require("lodash");

jade = require("jade");

stylus = require("stylus");

coffee = require("coffee-script");

marked = require("marked");

markedCompiler = {
  extnames: [".md", ".mkd", ".markdown"],
  runner: function(file, _arg, done) {
    var content, data, layout;
    data = _arg.data, layout = _arg.layout;
    content = marked(file.content);
    if (layout) {
      return done(null, layout({
        site: data,
        page: file,
        content: content
      }));
    } else {
      return done(null, content);
    }
  }
};

jadeCompiler = {
  extnames: [".jade"],
  runner: function(file, _arg, done) {
    var content, data, layout;
    data = _arg.data, layout = _arg.layout;
    content = jade.renderFile(file.__source, {
      site: data,
      page: file
    });
    if (layout) {
      return done(null, layout({
        site: data,
        page: file,
        content: content
      }));
    } else {
      return done(null, content);
    }
  }
};

stylusCompiler = {
  extnames: [".styl"],
  runner: function(file, _arg, done) {
    var data, opts, storage;
    data = _arg.data, storage = _arg.storage;
    opts = {
      filename: file.path,
      paths: storage.path
    };
    return stylus.render(file.content, opts, done);
  }
};

coffeeCompiler = {
  extnames: [".coffee"],
  runner: function(file, _arg, done) {
    var data, options;
    data = _arg.data, options = _arg.options;
    return done(null, coffee.compile(file.content, options));
  }
};

module.exports = [jadeCompiler, stylusCompiler, coffeeCompiler, markedCompiler];
