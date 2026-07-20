import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const practice = read("practice.html");

test("practice page exposes the approved eight-station route", () => {
  const ids = [
    "map",
    "feishu",
    "ai-cli",
    "cli-loops",
    "site",
    "daily",
    "gov",
    "refs",
  ];

  for (const id of ids) {
    assert.match(practice, new RegExp(`<article[^>]+id="${id}"`), `missing #${id}`);
    assert.match(practice, new RegExp(`href="#${id}"`), `missing nav link to #${id}`);
  }
});

test("practice page loads its page-only progressive enhancement", () => {
  assert.match(practice, /<script src="js\/practice\.js"><\/script>/);
});

test("new watercolor assets exist and are referenced with explicit dimensions", () => {
  const assets = [
    "feishu-collaboration-garden.png",
    "ai-feishu-cli-loop.png",
    "ai-coding-launch-route.png",
  ];

  for (const name of assets) {
    assert.equal(existsSync(new URL(`../images/illustrations/${name}`, import.meta.url)), true);
    const tag =
      practice.match(
        new RegExp(`<img[^>]+src="images/illustrations/${name}"[^>]*>`),
      )?.[0] || "";
    assert.match(tag, /width="\d+"/, `missing intrinsic width for ${name}`);
    assert.match(tag, /height="\d+"/, `missing intrinsic height for ${name}`);
  }
});
