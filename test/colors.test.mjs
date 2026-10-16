import { strict as assert } from "node:assert";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = await build({
  entryPoints: [resolve(__dirname, "../src/colors.ts")],
  bundle: true,
  format: "esm",
  target: "es2018",
  write: false,
  platform: "node",
});
const mod = await import(
  "data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64")
);
const { colorCssProps, isHexColor, EMPTY_MARK_COLORS, DEFAULT_MARK_INTENSITY } = mod;

// Defaults remove every inline variable so the stylesheet applies.
const defaults = colorCssProps(EMPTY_MARK_COLORS, DEFAULT_MARK_INTENSITY);
assert.equal(Object.keys(defaults).length, 8);
for (const [k, v] of Object.entries(defaults)) assert.equal(v, "", k);

// Overrides: rgb triples for washes, hex passthrough for gradient stops.
const props = colorCssProps(
  { ...EMPTY_MARK_COLORS, addition: "#00FF7f", commentYou: "#010203", aiTextEnd: "#ABCDEF" },
  200,
);
assert.equal(props["--tc-add-rgb"], "0, 255, 127");
assert.equal(props["--tc-you-rgb"], "1, 2, 3");
assert.equal(props["--tc-aitext-end"], "#abcdef");
assert.equal(props["--tc-del-rgb"], "");
assert.equal(props["--tc-intensity"], "2");
assert.equal(colorCssProps(EMPTY_MARK_COLORS, 75)["--tc-intensity"], "0.75");

// Malformed stored values fall back to the default.
assert.equal(colorCssProps({ ...EMPTY_MARK_COLORS, deletion: "red" }, 100)["--tc-del-rgb"], "");

assert.ok(isHexColor("#a1b2c3"));
for (const bad of ["#fff", "red", "", "a1b2c3", "#a1b2c3ff", null, undefined, 42]) {
  assert.ok(!isHexColor(bad), String(bad));
}

console.log("colors tests passed");
