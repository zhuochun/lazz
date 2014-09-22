#!/usr/bin/env coffee

lazz = require "../lib/lazz"

lazz.global
  title: "Lazz Blog"
  site: "http://www.bicrement.com/"
  author: "Wang Zhuochun"
.global "data/*.json"
.content "posts", "posts/*"
.content "pages", "pages/*", layout: "page"
.asset "asset/*"
.rest "*.jade"
.thatsAll()
