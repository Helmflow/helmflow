/**
 * Backend eksperymentu: proxy danych + brama do modelu.
 *
 * Trzyma sekrety po stronie serwera (token Forgejo, klucz LiteLLM) — przeglądarka
 * nigdy ich nie widzi. Odpowiada wyłącznie danymi odczytowymi; żadnej logiki domenowej.
 */
import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 8787;

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

const forgejoEnv = readEnvFile(join(here, "..", "forgejo", ".env"));
const litellmEnv = readEnvFile(join(here, "..", "harness-build", ".env"));
const FORGEJO_TOKEN = process.env.FORGEJO_TOKEN || forgejoEnv.FORGEJO_TOKEN;
const LITELLM_KEY = process.env.LITELLM_MASTER_KEY || litellmEnv.LITELLM_MASTER_KEY;
const FORGEJO_URL = "http://127.0.0.1:3000";
const LITELLM_URL = "http://127.0.0.1:4000";

const app = express();
app.use(express.json({ limit: "2mb" }));

const forgejo = (path) =>
  fetch(`${FORGEJO_URL}/api/v1${path}`, {
    headers: { Authorization: `token ${FORGEJO_TOKEN}` },
  }).then((r) => r.json());

app.get("/api/repos", async (_req, res) => {
  try {
    const repos = await forgejo("/user/repos?limit=20");
    res.json(
      (Array.isArray(repos) ? repos : []).map((r) => ({
        name: r.full_name,
        description: r.description || "",
        branch: r.default_branch,
        updated: (r.updated_at || "").slice(0, 16).replace("T", " "),
        empty: r.empty,
      }))
    );
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

app.get("/api/commits", async (req, res) => {
  const repo = req.query.repo;
  if (!repo) return res.status(400).json({ error: "brak parametru repo" });
  try {
    const commits = await forgejo(`/repos/${repo}/commits?limit=10`);
    res.json(
      (Array.isArray(commits) ? commits : []).map((c) => ({
        sha: (c.sha || "").slice(0, 8),
        author: c.commit?.author?.name || "",
        email: c.commit?.author?.email || "",
        message: (c.commit?.message || "").split("\n")[0],
        date: (c.commit?.author?.date || "").slice(0, 16).replace("T", " "),
      }))
    );
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

/** Trajectory agenta z wcześniejszych eksperymentów (append-only JSONL). */
app.get("/api/trajectory", (_req, res) => {
  const path = join(here, "..", "forgejo", "praca", "trajectory.jsonl");
  if (!existsSync(path)) return res.json({ events: [], usage: null });
  const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
  const events = lines.map((l) => JSON.parse(l));
  const finish = events.find((e) => e.kind === "finish");
  res.json({
    events: events.map((e) => ({
      kind: e.kind,
      time: (e.ts || "").slice(11, 19),
      iteration: e.iteration ?? null,
      command: e.command ?? null,
      exit_code: e.exit_code ?? null,
      content: (e.content || e.summary || "").slice(0, 400),
      tool_calls: (e.tool_calls || []).map((t) => t.name),
    })),
    usage: finish?.usage || null,
    status: finish?.status || null,
  });
});

/** Brama do modelu: prompt systemowy z katalogu komponentów + prośba użytkownika. */
app.post("/api/generate", async (req, res) => {
  const { systemPrompt, userPrompt } = req.body || {};
  if (!systemPrompt || !userPrompt)
    return res.status(400).json({ error: "wymagane systemPrompt i userPrompt" });
  const started = Date.now();
  try {
    const r = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LITELLM_KEY}`,
      },
      body: JSON.stringify({
        model: "helmflow-default",
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    const data = await r.json();
    if (!data.choices) return res.status(502).json({ error: JSON.stringify(data).slice(0, 400) });
    let lang = data.choices[0].message.content || "";
    lang = lang.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    lang = lang.replace(/^```[a-z-]*\n?/i, "").replace(/```$/, "").trim();
    res.json({
      lang,
      usage: data.usage,
      latency_ms: Date.now() - started,
    });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

app.get("/api/health", (_req, res) =>
  res.json({
    forgejo_token: Boolean(FORGEJO_TOKEN),
    litellm_key: Boolean(LITELLM_KEY),
  })
);

app.listen(PORT, "127.0.0.1", () =>
  console.log(`backend eksperymentu: http://127.0.0.1:${PORT}`)
);
