#!/usr/bin/env coffee

lazz = require "../lib/lazz"

lazz.global
  title: "Lezz Static Blog"
  site: "http://www.bicrement.com/lazz"
  author: "Wang Zhuochun"
.content "pages", "./pages/*"
.asset "./asset/*"
.rest "./*.jade"
.thatsAll()
