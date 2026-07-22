"use strict";

const DEFAULT_BASE_URL = "https://api.llm-token.cn/v1";
const DEFAULT_MODEL = "gpt-5.6-luna";
const MAX_INPUT_CHARS = 8000;
const REQUEST_TIMEOUT_MS = 25000;
const RATE_WINDOW_MS = 60000;
const RATE_LIMIT = 20;
const rateWindows = new Map();

const SYSTEM_PROMPT = `你是“AI 伴学”，一个嵌在真实工作中的轻量协作助手。你的目标不是授课，而是让用户眼前的内容立刻变好，并顺手留下一个可迁移的方法。

严格要求：
1. 一次只指出一个影响最大的改进点，不列知识清单，不考试，不说教。
2. rewrite 必须可以直接复制使用，保留原意，不编造事实。
3. why 只用一句话，连接用户已有经验，避免术语。
4. method 是一句可在相似情境复用的方法，最多 28 个汉字。
5. 如果原文涉及法律、医疗、财务、隐私或对外承诺，在 risk 中简短提示人工核验；否则 risk 为空字符串。
6. 只返回 JSON，不使用 Markdown 或代码围栏。格式：{"title":"","rewrite":"","why":"","method":"","risk":""}`;

const MODE_PROMPTS = {
  clarify: "让内容更容易被目标读者理解，并明确希望对方作出的判断或行动。",
  check: "找出最可能造成错误、误解或无法验收的一处，并给出谨慎修订。",
  action: "把内容转换为不超过 3 项的可交接行动，明确负责人角色、时间和完成标准；未知信息标记待确认。"
};

function isAllowedOrigin(origin) {
  return !origin || origin.startsWith("chrome-extension://") ||
    origin === "https://ai-knowledge-sigma.vercel.app" ||
    /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
}

function setCors(req, res) {
  const origin = String(req.headers?.origin || "");
  if (origin && isAllowedOrigin(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
}

function isRateLimited(req) {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "local");
  const client = forwarded.split(",")[0].trim();
  const now = Date.now();
  const current = rateWindows.get(client);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateWindows.set(client, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function extractJson(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("模型没有返回 JSON 对象");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeResult(value) {
  const result = {};
  for (const key of ["title", "rewrite", "why", "method", "risk"]) {
    result[key] = typeof value?.[key] === "string" ? value[key].trim() : "";
  }
  if (!result.title || !result.rewrite || !result.why || !result.method) {
    throw new Error("模型返回缺少必要字段");
  }
  return result;
}

function getMessageText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part?.text || "").join("");
  return "";
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (!isAllowedOrigin(String(req.headers?.origin || ""))) return sendJson(res, 403, { ok: false, error: "origin_not_allowed" });

  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const baseUrl = (process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const configured = Boolean(process.env.AI_API_KEY);

  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      configured,
      model,
      provider: process.env.AI_PROVIDER || "openai-compatible",
      privacy: "Only explicitly submitted text is sent to the model."
    });
  }

  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  if (!configured) return sendJson(res, 503, { ok: false, error: "model_not_configured" });
  if (isRateLimited(req)) return sendJson(res, 429, { ok: false, error: "rate_limited" });

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const mode = MODE_PROMPTS[req.body?.mode] ? req.body.mode : "clarify";
  const source = typeof req.body?.source === "string" ? req.body.source.slice(0, 200) : "当前任务";

  if (!text) return sendJson(res, 400, { ok: false, error: "empty_text" });
  if (text.length > MAX_INPUT_CHARS) return sendJson(res, 413, { ok: false, error: "input_too_long", limit: MAX_INPUT_CHARS });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `来源：${source}\n任务模式：${MODE_PROMPTS[mode]}\n\n用户内容：\n${text}` }
        ],
        temperature: 0.25,
        max_tokens: 700
      }),
      signal: controller.signal
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("AI upstream error", upstream.status, payload?.error?.code || "unknown");
      return sendJson(res, 502, { ok: false, error: "model_upstream_error" });
    }

    const result = normalizeResult(extractJson(getMessageText(payload)));
    return sendJson(res, 200, {
      ok: true,
      result,
      meta: {
        model,
        inputTokens: payload?.usage?.prompt_tokens || null,
        outputTokens: payload?.usage?.completion_tokens || null
      }
    });
  } catch (error) {
    const code = error?.name === "AbortError" ? "model_timeout" : "invalid_model_response";
    console.error("AI companion error", code);
    return sendJson(res, code === "model_timeout" ? 504 : 502, { ok: false, error: code });
  } finally {
    clearTimeout(timeout);
  }
};
