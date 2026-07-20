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

test("first-principles copy distinguishes Feishu AI, Aily, and CLI", () => {
  assert.match(practice, /飞书 AI 是现成的脑力助手/);
  assert.match(practice, /Aily 是 AI 应用装配台/);
  assert.match(practice, /飞书 CLI 是 AI 的操作手/);
  assert.match(practice, /AI 负责理解和生成/);
});

test("six CLI value loops and confirmation boundaries are present", () => {
  const loops = [
    "每日工作简报",
    "会议闭环",
    "企业知识运营",
    "销售跟进",
    "经营周报",
    "AI 应用交付",
  ];

  for (const loop of loops) assert.match(practice, new RegExp(loop));
  assert.match(practice, /写入前确认/);
  assert.match(practice, /最小权限/);
});

test("AI Coding route uses five stages and corrects absolute claims", () => {
  const stages = [
    "选工具，也选名字",
    "在本地做出第一版",
    "给项目装上安全绳",
    "选择合适的上线方式",
    "上线后进入迭代",
  ];

  for (const stage of stages) assert.match(practice, new RegExp(stage));
  assert.match(practice, /不一定需要买服务器/);
  assert.match(practice, /中国大陆服务器/);
  assert.doesNotMatch(practice, /所有未备案域名都会被运营商拦截/);
  assert.doesNotMatch(practice, /自家的 Agent (一定|肯定)更适合/);
});

test("community tools are labeled and external links are hardened", () => {
  assert.match(practice, /neat-freak[^<]*社区/);
  assert.match(practice, /MIT/);

  const externalLinks = [
    ...practice.matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/g),
  ];
  assert.ok(externalLinks.length > 0);
  for (const [link] of externalLinks) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener noreferrer"/);
  }
});
