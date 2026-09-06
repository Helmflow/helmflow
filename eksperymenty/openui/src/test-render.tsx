/**
 * Test renderowania KAŻDEGO widoku: czy <Renderer> produkuje HTML zawierający
 * faktyczne dane, a nie samą strukturę. Walidacja parsera to za mało — ten test
 * sprawdza to, co realnie zobaczy użytkownik.
 */
import { renderToString } from "react-dom/server";
import { Renderer } from "@openuidev/react-lang";
import { library } from "./components";
import { repoView, trajectoryView } from "./views";

const API = "http://127.0.0.1:8787";

type Sprawdzian = { nazwa: string; lang: string; oczekiwane: string[] };

function ocen({ nazwa, lang, oczekiwane }: Sprawdzian) {
  let html = "";
  try {
    html = renderToString(<Renderer response={lang} library={library} isStreaming={false} />);
  } catch (e) {
    console.log(`✗ ${nazwa}: WYJĄTEK ${String(e).slice(0, 160)}`);
    return false;
  }
  const tekst = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const brakujace = oczekiwane.filter((o) => !html.includes(o));
  const komponenty = new Set([...html.matchAll(/class="(root|section|row|tile|repo|table-wrap|ev|badge)"/g)].map((m) => m[1]));
  const ok = brakujace.length === 0 && tekst.length > 40;
  console.log(
    `${ok ? "✓" : "✗"} ${nazwa}: html=${html.length} zn., tekst=${tekst.length} zn., ` +
      `komponenty=[${[...komponenty].join(",")}]` +
      (brakujace.length ? ` | BRAK DANYCH: ${brakujace.join(", ")}` : "")
  );
  if (ok) console.log(`   podgląd: ${tekst.slice(0, 150)}…`);
  return ok;
}

async function main() {
  const repos = await fetch(`${API}/api/repos`).then((r) => r.json());
  const commits = await fetch(`${API}/api/commits?repo=helmflow%2Fdemo-agenta`).then((r) => r.json());
  const traj = await fetch(`${API}/api/trajectory`).then((r) => r.json());

  const sprawdziany: Sprawdzian[] = [
    {
      nazwa: "widok predefiniowany: Repozytoria",
      lang: repoView(repos, commits, "helmflow/demo-agenta"),
      oczekiwane: ["Repozytoria w Forgejo", "helmflow/demo-agenta", "a189a2d2", "Agent Eksperymentu"],
    },
    {
      nazwa: "widok predefiniowany: Praca agenta",
      lang: trajectoryView(traj.events, traj.usage, traj.status),
      oczekiwane: ["Praca agenta", "success", String(traj.events.length)],
    },
  ];

  // Widok ad-hoc — komponowany przez model w czasie działania.
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
  const gen = await fetch(`${API}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      userPrompt:
        "Pokaż przegląd: kafelki z liczbą repozytoriów i commitów agenta oraz tabelę commitów.\n\n" +
        `Repozytoria:\n${JSON.stringify(repos)}\n\nCommity:\n${JSON.stringify(commits)}`,
    }),
  }).then((r) => r.json());

  if (gen.lang) {
    sprawdziany.push({
      nazwa: `widok ad-hoc (model, ${gen.usage?.completion_tokens} tok, ${gen.latency_ms} ms)`,
      lang: gen.lang,
      oczekiwane: ["demo-agenta"],
    });
  } else {
    console.log("✗ widok ad-hoc: brak odpowiedzi modelu:", String(gen.error).slice(0, 200));
  }

  const wyniki = sprawdziany.map(ocen);
  const zdane = wyniki.filter(Boolean).length;
  console.log(`\nWYNIK: ${zdane}/${wyniki.length} widoków renderuje się z danymi.`);
  process.exit(zdane === wyniki.length ? 0 : 1);
}

main().catch((e) => {
  console.error("BŁĄD:", e);
  process.exit(1);
});
