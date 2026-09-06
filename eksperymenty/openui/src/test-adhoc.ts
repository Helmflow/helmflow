/**
 * Test tezy eksperymentu: czy MiniMax-M3 (przez LiteLLM) potrafi komponować
 * widoki w OpenUI Lang z NASZEGO katalogu komponentów — i czy wynik przechodzi
 * walidację parsera (kontrakty propsów, rozwiązane referencje).
 *
 * Używa tej samej biblioteki co frontend, więc mierzy dokładnie to, co zobaczy
 * użytkownik. Uruchamiany po zbudowaniu: vite build --ssr.
 */
import { createParser } from "@openuidev/lang-core";
import { library } from "./components";
import { repoView, trajectoryView } from "./views";

const PROMPTY = [
  "Pokaż przegląd repozytoriów jako kafelki metryk i tabelę commitów.",
  "Zrób widok pracy agenta: status, zużyte tokeny i oś czasu ostatnich zdarzeń.",
  "Porównaj repozytoria w tabeli i dodaj sekcję z ostrzeżeniem o pustych repozytoriach.",
];

async function main() {
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

  const repos = await fetch("http://127.0.0.1:8787/api/repos").then((r) => r.json());
  const commits = await fetch(
    "http://127.0.0.1:8787/api/commits?repo=helmflow%2Fdemo-agenta"
  ).then((r) => r.json());
  const traj = await fetch("http://127.0.0.1:8787/api/trajectory").then((r) => r.json());

  // 1) Walidacja widoków predefiniowanych (kompozycje z repozytorium).
  const parser = createParser(library.toJSONSchema());
  for (const [nazwa, lang] of [
    ["predefiniowany: repozytoria", repoView(repos, commits, "helmflow/demo-agenta")],
    ["predefiniowany: trajectory", trajectoryView(traj.events, traj.usage, traj.status)],
  ] as const) {
    const res = parser.parse(lang);
    const bledy = res.meta?.validationErrors ?? [];
    console.log(
      `${nazwa}: root=${res.root ? "OK" : "BRAK"} | statements=${res.meta?.statementCount} | ` +
        `nierozwiązane=${(res.meta?.unresolved ?? []).length} | błędy walidacji=${bledy.length}`
    );
    if (bledy.length) console.log("   ", JSON.stringify(bledy).slice(0, 300));
  }

  // 2) Widoki ad-hoc: model komponuje w czasie działania.
  console.log(`\nsystem prompt: ${systemPrompt.length} znaków\n`);
  for (const p of PROMPTY) {
    const r = await fetch("http://127.0.0.1:8787/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt,
        userPrompt: `${p}\n\nRepozytoria:\n${JSON.stringify(repos)}\n\nCommity:\n${JSON.stringify(
          commits
        )}\n\nPrzebieg agenta: status=${traj.status}, zdarzeń=${traj.events.length}, tokeny=${JSON.stringify(
          traj.usage
        )}`,
      }),
    }).then((x) => x.json());

    if (r.error) {
      console.log(`ad-hoc "${p.slice(0, 40)}…": BŁĄD ${String(r.error).slice(0, 200)}`);
      continue;
    }
    const res = parser.parse(r.lang);
    const bledy = res.meta?.validationErrors ?? [];
    const komponenty = [...r.lang.matchAll(/=\s*([A-Z][A-Za-z]*)\(/g)].map((m: any) => m[1]);
    console.log(
      `ad-hoc "${p.slice(0, 40)}…": root=${res.root ? "OK" : "BRAK"} | ` +
        `statements=${res.meta?.statementCount} | błędy=${bledy.length} | ` +
        `komponenty=${[...new Set(komponenty)].join(",")} | ` +
        `${r.usage?.prompt_tokens}/${r.usage?.completion_tokens} tok | ${r.latency_ms} ms`
    );
    if (bledy.length) console.log("   ", JSON.stringify(bledy).slice(0, 300));
    console.log("--- LANG ---\n" + r.lang + "\n--- KONIEC ---");
  }
}

main().catch((e) => {
  console.error("BŁĄD:", e);
  process.exit(1);
});
