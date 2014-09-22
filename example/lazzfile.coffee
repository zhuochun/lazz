#!/usr/bin/env coffee

lazz = require "../lib/lazz"

console.log lazz._config

lazz.global
  title: "Lezz Static Blog"
  site: "http://www.bicrement.com/lazz"
  author: "Wang Zhuochun"

console.log lazz._data.meta
console.log lazz.path_to("./pages/*")

lazz.content "pages", "./pages/*"

console.log lazz._data.file

lazz.asset "./asset/*"

console.log lazz._data.file

lazz.rest "./*.jade"

console.log lazz._data.file

lazz.thatsAll()
