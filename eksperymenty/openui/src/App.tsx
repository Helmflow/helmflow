import { useEffect, useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import { library } from "./components";
import { repoView, trajectoryView, type Repo, type Commit, type TrajectoryEvent } from "./views";

type Tab = "repos" | "trajectory" | "adhoc";

const REPO = "helmflow/demo-agenta";

export default function App() {
  const [tab, setTab] = useState<Tab>("repos");
  const [repoLang, setRepoLang] = useState("");
  const [trajLang, setTrajLang] = useState("");
  const [adhocLang, setAdhocLang] = useState("");
  const [prompt, setPrompt] = useState(
    "Pokaż porównanie repozytoriów jako tabelę oraz kafelki z liczbą commitów agenta i statusem ostatniego przebiegu."
  );
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const repos: Repo[] = await fetch("/api/repos").then((r) => r.json());
        const commits: Commit[] = await fetch(
          `/api/commits?repo=${encodeURIComponent(REPO)}`
        ).then((r) => r.json());
        setRepoLang(repoView(repos, Array.isArray(commits) ? commits : [], REPO));
      } catch (e) {
        setErr(`Dane z Forgejo niedostępne: ${e}`);
      }
      try {
        const t = await fetch("/api/trajectory").then((r) => r.json());
        setTrajLang(
          trajectoryView(t.events as TrajectoryEvent[], t.usage, t.status)
        );
      } catch (e) {
        setErr((p) => p + ` | Trajectory niedostępne: ${e}`);
      }
    })();
  }, []);

  async function generate() {
    setBusy(true);
    setErr("");
    setMeta("");
    try {
      const systemPrompt = library.prompt({
        preamble:
          "Budujesz widoki dla Helmflow — systemu nadzoru nad agentami programistycznymi. " +
          "Odpowiadasz wyłącznie w openui-lang.",
        additionalRules: [
          "Używaj wyłącznie komponentów z katalogu.",
          "Dane wstawiaj jako literały tekstowe w argumentach.",
          "Zaczynaj od root = Root(...).",
        ],
      });
      const dane = await fetch("/api/repos").then((r) => r.json());
      const commits = await fetch(`/api/commits?repo=${encodeURIComponent(REPO)}`).then((r) =>
        r.json()
      );
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          userPrompt:
            `${prompt}\n\nDane repozytoriów (JSON):\n${JSON.stringify(dane)}\n\n` +
            `Commity ${REPO} (JSON):\n${JSON.stringify(commits)}`,
        }),
      }).then((x) => x.json());
      if (r.error) throw new Error(r.error);
      setAdhocLang(r.lang);
      setMeta(
        `${r.usage?.prompt_tokens ?? "?"} / ${r.usage?.completion_tokens ?? "?"} tokenów · ${
          r.latency_ms
        } ms`
      );
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  const lang = tab === "repos" ? repoLang : tab === "trajectory" ? trajLang : adhocLang;

  return (
    <div className="app">
      <nav className="tabs">
        <button className={tab === "repos" ? "on" : ""} onClick={() => setTab("repos")}>
          Repozytoria <span className="tag">predefiniowany</span>
        </button>
        <button className={tab === "trajectory" ? "on" : ""} onClick={() => setTab("trajectory")}>
          Praca agenta <span className="tag">predefiniowany</span>
        </button>
        <button className={tab === "adhoc" ? "on" : ""} onClick={() => setTab("adhoc")}>
          Wygeneruj widok <span className="tag tag-ai">ad-hoc</span>
        </button>
      </nav>

      {tab === "adhoc" && (
        <div className="adhoc-bar">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Opisz widok…" />
          <button onClick={generate} disabled={busy}>
            {busy ? "Model komponuje…" : "Wygeneruj"}
          </button>
          {meta && <span className="muted small">{meta}</span>}
        </div>
      )}

      {err && <div className="err">{err}</div>}

      <main className="stage">
        {lang ? (
          <Renderer response={lang} library={library} isStreaming={false} />
        ) : (
          <p className="muted">
            {tab === "adhoc" ? "Opisz widok i naciśnij „Wygeneruj”." : "Wczytywanie danych…"}
          </p>
        )}
      </main>

      {lang && (
        <details className="src">
          <summary>Źródło OpenUI Lang ({lang.split("\n").length} linii)</summary>
          <pre>{lang}</pre>
        </details>
      )}
    </div>
  );
}
