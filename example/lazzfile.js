#!/usr/bin/env node

var lazz;

lazz = require("../lib/lazz");

console.log("write");

lazz.global({
  title: "Lezz Static Blog",
  site: "http://www.bicrement.com/lazz",
  author: "Wang Zhuochun"
})
.content("pages", "pages/*")
.asset("asset/*")
.rest("*.jade");

lazz.thatsAll();
