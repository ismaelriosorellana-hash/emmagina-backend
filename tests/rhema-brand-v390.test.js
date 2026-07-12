const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const frontend = path.resolve(__dirname, "../../frontend");

test("la Home presenta Rhema Diseños, Memories, Alma y Santiago", () => {
  if (!fs.existsSync(frontend)) return;
  const html = fs.readFileSync(path.join(frontend, "index.html"), "utf8");
  assert.match(html, /Rhema Diseños/);
  assert.match(html, /Memories/);
  assert.match(html, /Alma/);
  assert.match(html, /Santiago/);
});
