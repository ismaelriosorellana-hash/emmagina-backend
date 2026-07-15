"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
test("review module files and routes exist", () => {
  ["models/Resena.js","controllers/reviewController.js","controllers/adminReviewController.js","routes/resenas.js","routes/admin/resenas.js"].forEach((file)=>assert.ok(fs.existsSync(path.join(root,file)),file));
  const app = fs.readFileSync(path.join(root,"app.js"),"utf8");
  assert.match(app,/\/api\/resenas/);
  assert.match(app,/\/api\/admin\/resenas/);
});
