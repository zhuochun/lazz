#!/usr/bin/env coffee

lazz = require "../lib/lazz"

lazz
.global "data/*.json"
.content "posts", "posts/*"
.content "pages", "pages/*", layout: "page"
.asset "asset/*"
.rest "*.jade"
.thatsAll()
