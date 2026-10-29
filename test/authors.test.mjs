import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = await build({
  entryPoints: [resolve(__dirname, "../src/authors.ts")],
  bundle: false,
  format: "esm",
  target: "es2018",
  write: false,
  platform: "neutral",
});
const code = out.outputFiles[0].text;
const mod = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
const { AUTHOR_RE, authorHueIndex } = mod;

function test(name, fn) {
  try {
    fn();
    console.log("  ok  -", name);
  } catch (err) {
    console.error("  FAIL -", name);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log("authors:");

test("AUTHOR_RE matches Claude:", () => {
  const m = "Claude: hello".match(AUTHOR_RE);
  assert.ok(m);
  assert.equal(m[1], "Claude");
});

test("AUTHOR_RE matches GPT-4:", () => {
  const m = "GPT-4: hi".match(AUTHOR_RE);
  assert.ok(m);
  assert.equal(m[1], "GPT-4");
});

test("AUTHOR_RE matches lowercased gpt:", () => {
  const m = "gpt: hi".match(AUTHOR_RE);
  assert.ok(m);
  assert.equal(m[1], "gpt");
});

test("AUTHOR_RE allows leading whitespace", () => {
  const m = "  Claude: hello".match(AUTHOR_RE);
  assert.ok(m);
  assert.equal(m[1], "Claude");
});

test("AUTHOR_RE tolerates whitespace before the colon", () => {
  // Intentional: `\s*:\s*` is permissive. "Claude : hi" is still a single-token
  // name and should match. Multi-word names are still rejected (covered above).
  const m = "Claude : hi".match(AUTHOR_RE);
  assert.ok(m);
  assert.equal(m[1], "Claude");
});

test("AUTHOR_RE rejects multi-word strings", () => {
  assert.equal("asdjak adakjds : oops".match(AUTHOR_RE), null);
  assert.equal("see line 4 : bad".match(AUTHOR_RE), null);
});

test("AUTHOR_RE rejects empty name", () => {
  assert.equal(": oops".match(AUTHOR_RE), null);
});

test("AUTHOR_RE rejects digit-leading name", () => {
  assert.equal("4chan: hi".match(AUTHOR_RE), null);
});

test("AUTHOR_RE accepts TODO: as a false positive (documented)", () => {
  const m = "TODO: fix".match(AUTHOR_RE);
  assert.ok(m);
  assert.equal(m[1], "TODO");
});

test("AUTHOR_RE matches an emoji name", () => {
  const m = "🤖: hello".match(AUTHOR_RE);
  assert.ok(m);
  assert.equal(m[1], "🤖");
  assert.equal("🤖: hello".slice(m[0].length), "hello");
});

test("AUTHOR_RE matches emoji with variation selector, skin tone, ZWJ and flags", () => {
  for (const name of ["❤️", "👩‍💻", "🧑🏽‍💻", "🇧🇪"]) {
    const m = `${name}: hi`.match(AUTHOR_RE);
    assert.ok(m, name);
    assert.equal(m[1], name);
  }
});

test("AUTHOR_RE matches non-ASCII letters (precomposed and combining)", () => {
  for (const name of ["José", "Jose\u0301", "Ünal", "李明", "Ελένη"]) {
    const m = `${name}: hi`.match(AUTHOR_RE);
    assert.ok(m, name);
    assert.equal(m[1], name);
  }
});

test("AUTHOR_RE still rejects multi-word and symbol-leading emoji names", () => {
  assert.equal("🤖 AI: oops".match(AUTHOR_RE), null);
  assert.equal("#tag: oops".match(AUTHOR_RE), null);
  assert.equal("1️⃣: oops".match(AUTHOR_RE), null);
});

test("AUTHOR_RE caps names at 30 code points", () => {
  assert.ok(("é".repeat(30) + ": hi").match(AUTHOR_RE));
  assert.equal(("é".repeat(31) + ": hi").match(AUTHOR_RE), null);
});

test("AUTHOR_RE behaves as the old ASCII regex on ASCII input", () => {
  const OLD = /^\s*([A-Za-z][\w.-]{0,29})\s*:\s*/;
  const alphabet = "aZ09_.-: \t#*";
  let seed = 1;
  const rand = (n) => ((seed = (seed * 1103515245 + 12345) >>> 0) % n);
  for (let i = 0; i < 20000; i++) {
    let s = "";
    const len = rand(40);
    for (let j = 0; j < len; j++) s += alphabet[rand(alphabet.length)];
    const a = s.match(OLD);
    const b = s.match(AUTHOR_RE);
    assert.deepEqual(a && [a[0], a[1]], b && [b[0], b[1]], JSON.stringify(s));
  }
});

test("authorHueIndex pins Claude to 7 (red)", () => {
  assert.equal(authorHueIndex("Claude"), 7);
  assert.equal(authorHueIndex("claude"), 7);
  assert.equal(authorHueIndex("CLAUDE"), 7);
});

test("authorHueIndex pins GPT variants to 2 (green)", () => {
  assert.equal(authorHueIndex("gpt"), 2);
  assert.equal(authorHueIndex("GPT"), 2);
  assert.equal(authorHueIndex("gpt-4"), 2);
  assert.equal(authorHueIndex("gpt-4o"), 2);
  assert.equal(authorHueIndex("ChatGPT"), 2);
});

test("authorHueIndex pins Gemini to 0 (blue)", () => {
  assert.equal(authorHueIndex("Gemini"), 0);
  assert.equal(authorHueIndex("gemini-pro"), 0);
});

test("authorHueIndex hashes unknown names deterministically into 0..7", () => {
  const a = authorHueIndex("Phil");
  const b = authorHueIndex("Phil");
  assert.equal(a, b);
  assert.ok(a >= 0 && a < 8);
  assert.ok(authorHueIndex("SomeNewModel") >= 0);
  assert.ok(authorHueIndex("SomeNewModel") < 8);
});

console.log("done.");
