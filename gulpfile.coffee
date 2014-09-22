gulp = require "gulp"
gutil = require "gulp-util"
coffee = require "gulp-coffee"
jasmine = require "gulp-jasmine"

# files
scripts = ["lib/**/*.coffee"]
tests = ["spec/*_spec.coffee"]

# compile lazz
gulp.task "build", ->
  gulp.src(scripts)
      .pipe(coffee({bare: true}).on("error", gutil.log))
      .pipe(gulp.dest("lib/"))

# run test
gulp.task "test", ["build"], ->
  gulp.src(tests)
      .pipe(coffee({bare: true}).on("error", gutil.log))
      .pipe(gulp.dest("spec/"))
      .pipe(jasmine())

# watch changes
gulp.task "watch", ->
  gulp.watch(scripts, ["test"])
  gulp.watch(tests, ["test"])

# do it all
gulp.task "default", ["watch", "test"]
