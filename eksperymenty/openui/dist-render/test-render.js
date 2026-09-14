import { renderToString } from "react-dom/server";
import { Renderer, createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Fragment } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
//#region src/components.tsx
/**
* Katalog komponentów Helmflow dla OpenUI.
*
* KONTRAKT RENDERERA (ustalony z kodu @openuidev/react-lang):
* komponent dostaje `{ props, renderNode, statementId }` — właściwe propsy są
* zagnieżdżone pod kluczem `props`, a zagnieżdżone komponenty (children) to
* węzły AST, które renderuje się funkcją `renderNode(node)`.
*
* WAŻNE: argumenty w OpenUI Lang są POZYCYJNE — kolejność pól w schemacie Zod
* wyznacza kolejność argumentów w wywołaniu komponentu.
*
* Ten sam katalog obsługuje oba tryby z tezy eksperymentu:
*  - widoki predefiniowane (kompozycja zapisana w repo, karmiona danymi z silnika),
*  - widoki ad-hoc (kompozycja od modelu w czasie działania).
*/
/** Renderuje listę węzłów-dzieci przez renderNode dostarczony przez runtime. */
function Children({ nodes, renderNode }) {
	if (!Array.isArray(nodes) || !renderNode) return null;
	return /* @__PURE__ */ jsx(Fragment$1, { children: nodes.map((n, i) => /* @__PURE__ */ jsx(Fragment, { children: renderNode(n) }, i)) });
}
var Root = defineComponent({
	name: "Root",
	description: "Korzeń widoku: tytuł strony i lista sekcji.",
	props: z.object({
		title: z.string().describe("Tytuł widoku"),
		children: z.array(z.any()).describe("Sekcje i bloki widoku"),
		subtitle: z.string().optional().describe("Podtytuł/kontekst")
	}),
	component: ({ props, renderNode }) => /* @__PURE__ */ jsxs("div", {
		className: "root",
		children: [/* @__PURE__ */ jsxs("header", {
			className: "root-head",
			children: [/* @__PURE__ */ jsx("h1", { children: props?.title }), props?.subtitle ? /* @__PURE__ */ jsx("p", {
				className: "muted",
				children: props.subtitle
			}) : null]
		}), /* @__PURE__ */ jsx("div", {
			className: "root-body",
			children: /* @__PURE__ */ jsx(Children, {
				nodes: props?.children,
				renderNode
			})
		})]
	})
});
var Section = defineComponent({
	name: "Section",
	description: "Sekcja z nagłówkiem grupująca inne komponenty.",
	props: z.object({
		title: z.string().describe("Nagłówek sekcji"),
		children: z.array(z.any()).describe("Zawartość sekcji")
	}),
	component: ({ props, renderNode }) => /* @__PURE__ */ jsxs("section", {
		className: "section",
		children: [/* @__PURE__ */ jsx("h2", { children: props?.title }), /* @__PURE__ */ jsx(Children, {
			nodes: props?.children,
			renderNode
		})]
	})
});
var Row = defineComponent({
	name: "Row",
	description: "Układ poziomy — kafelki obok siebie, zawija się na wąskim ekranie.",
	props: z.object({ children: z.array(z.any()).describe("Elementy w rzędzie") }),
	component: ({ props, renderNode }) => /* @__PURE__ */ jsx("div", {
		className: "row",
		children: /* @__PURE__ */ jsx(Children, {
			nodes: props?.children,
			renderNode
		})
	})
});
var StatTile = defineComponent({
	name: "StatTile",
	description: "Kafelek z pojedynczą metryką (liczba commitów, tokeny, czas).",
	props: z.object({
		label: z.string().describe("Nazwa metryki"),
		value: z.string().describe("Wartość metryki"),
		hint: z.string().optional().describe("Dopisek pod wartością")
	}),
	component: ({ props }) => /* @__PURE__ */ jsxs("div", {
		className: "tile",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "tile-label",
				children: props?.label
			}),
			/* @__PURE__ */ jsx("div", {
				className: "tile-value",
				children: props?.value
			}),
			props?.hint ? /* @__PURE__ */ jsx("div", {
				className: "tile-hint",
				children: props.hint
			}) : null
		]
	})
});
var RepoCard = defineComponent({
	name: "RepoCard",
	description: "Karta repozytorium: nazwa, opis, gałąź domyślna, czas aktualizacji.",
	props: z.object({
		name: z.string().describe("Pełna nazwa repozytorium"),
		description: z.string().optional().describe("Opis repozytorium"),
		branch: z.string().optional().describe("Gałąź domyślna"),
		updated: z.string().optional().describe("Data ostatniej zmiany")
	}),
	component: ({ props }) => /* @__PURE__ */ jsxs("div", {
		className: "repo",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "repo-name",
				children: props?.name
			}),
			props?.description ? /* @__PURE__ */ jsx("div", {
				className: "muted",
				children: props.description
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "repo-meta",
				children: [props?.branch ? /* @__PURE__ */ jsx("span", {
					className: "chip",
					children: props.branch
				}) : null, props?.updated ? /* @__PURE__ */ jsx("span", {
					className: "muted small",
					children: props.updated
				}) : null]
			})
		]
	})
});
var DataTable = defineComponent({
	name: "DataTable",
	description: "Tabela danych. Pierwszy argument to nagłówki, drugi to wiersze (tablica tablic).",
	props: z.object({
		columns: z.array(z.string()).describe("Nagłówki kolumn"),
		rows: z.array(z.array(z.string())).describe("Wiersze — każdy jako tablica komórek")
	}),
	component: ({ props }) => {
		const columns = Array.isArray(props?.columns) ? props.columns : [];
		const rows = Array.isArray(props?.rows) ? props.rows : [];
		return /* @__PURE__ */ jsx("div", {
			className: "table-wrap",
			children: /* @__PURE__ */ jsxs("table", { children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: columns.map((c, i) => /* @__PURE__ */ jsx("th", { children: String(c) }, i)) }) }), /* @__PURE__ */ jsx("tbody", { children: rows.map((r, i) => /* @__PURE__ */ jsx("tr", { children: (Array.isArray(r) ? r : [r]).map((c, j) => /* @__PURE__ */ jsx("td", { children: String(c) }, j)) }, i)) })] })
		});
	}
});
var TimelineEvent = defineComponent({
	name: "TimelineEvent",
	description: "Jedno zdarzenie w historii pracy agenta (trajectory): rodzaj, tytuł, szczegóły, czas.",
	props: z.object({
		kind: z.enum([
			"task",
			"model",
			"tool",
			"finish",
			"error"
		]).describe("Rodzaj zdarzenia"),
		title: z.string().describe("Krótki opis zdarzenia"),
		detail: z.string().optional().describe("Szczegóły — polecenie, wynik, fragment odpowiedzi"),
		time: z.string().optional().describe("Znacznik czasu")
	}),
	component: ({ props }) => /* @__PURE__ */ jsxs("div", {
		className: `ev ev-${props?.kind ?? "model"}`,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "ev-head",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: `badge badge-${props?.kind ?? "model"}`,
					children: props?.kind
				}),
				/* @__PURE__ */ jsx("span", {
					className: "ev-title",
					children: props?.title
				}),
				props?.time ? /* @__PURE__ */ jsx("span", {
					className: "muted small",
					children: props.time
				}) : null
			]
		}), props?.detail ? /* @__PURE__ */ jsx("pre", {
			className: "ev-detail",
			children: props.detail
		}) : null]
	})
});
var StatusBadge = defineComponent({
	name: "StatusBadge",
	description: "Znacznik stanu (np. wynik testów, stan Agent Run).",
	props: z.object({
		label: z.string().describe("Tekst znacznika"),
		tone: z.enum([
			"ok",
			"warn",
			"error",
			"info"
		]).describe("Wydźwięk")
	}),
	component: ({ props }) => /* @__PURE__ */ jsx("span", {
		className: `badge badge-${props?.tone ?? "info"}`,
		children: props?.label
	})
});
var Text = defineComponent({
	name: "Text",
	description: "Akapit tekstu.",
	props: z.object({ content: z.string().describe("Treść") }),
	component: ({ props }) => /* @__PURE__ */ jsx("p", {
		className: "text",
		children: props?.content
	})
});
var library = createLibrary({
	components: [
		Root,
		Section,
		Row,
		StatTile,
		RepoCard,
		DataTable,
		TimelineEvent,
		StatusBadge,
		Text
	],
	root: "Root"
});
//#endregion
//#region src/views.ts
/**
* Widoki predefiniowane — kompozycje OpenUI Lang zapisane w repozytorium
* i karmione danymi z silnika (tu: proxy do Forgejo i trajectory agenta).
*
* To druga połowa tezy eksperymentu: ten sam renderer i ten sam katalog
* komponentów co przy generowaniu ad-hoc, ale kompozycja jest deterministyczna
* i przejrzana przez człowieka.
*
* Składnia: `nazwa = Komponent(arg1, arg2, ...)`, argumenty POZYCYJNE.
*/
var q = (v) => JSON.stringify(String(v ?? ""));
var arr = (names) => `[${names.join(", ")}]`;
function repoView(repos, commits, repoName) {
	const lines = [];
	const repoRefs = repos.map((_, i) => `repo${i}`);
	const tileRefs = [
		"tRepos",
		"tCommits",
		"tAgent"
	];
	lines.push(`root = Root(${q("Repozytoria w Forgejo")}, ${arr([
		"secStats",
		"secRepos",
		"secCommits"
	])}, ${q("Widok predefiniowany — dane na żywo z API Forgejo")})`);
	lines.push(`secStats = Section(${q("Podsumowanie")}, ${arr(["rowStats"])})`);
	lines.push(`rowStats = Row(${arr(tileRefs)})`);
	lines.push(`tRepos = StatTile(${q("Repozytoria")}, ${q(repos.length)})`);
	lines.push(`tCommits = StatTile(${q("Commity w " + repoName)}, ${q(commits.length)}, ${q("ostatnie 10")})`);
	const agentCommits = commits.filter((c) => c.email.includes("helmflow.local")).length;
	lines.push(`tAgent = StatTile(${q("Commity agenta")}, ${q(agentCommits)}, ${q("autor: Agent Eksperymentu")})`);
	lines.push(`secRepos = Section(${q("Lista repozytoriów")}, ${arr(repoRefs)})`);
	repos.forEach((r, i) => {
		lines.push(`repo${i} = RepoCard(${q(r.name)}, ${q(r.description || (r.empty ? "puste repozytorium" : ""))}, ${q(r.branch)}, ${q(r.updated)})`);
	});
	lines.push(`secCommits = Section(${q("Historia commitów: " + repoName)}, ${arr(["tblCommits"])})`);
	const rows = commits.map((c) => `[${q(c.sha)}, ${q(c.author)}, ${q(c.message)}, ${q(c.date)}]`);
	lines.push(`tblCommits = DataTable([${q("SHA")}, ${q("Autor")}, ${q("Opis")}, ${q("Data")}], [${rows.join(", ")}])`);
	return lines.join("\n");
}
function trajectoryView(events, usage, status) {
	const lines = [];
	const shown = events.slice(0, 24);
	const evRefs = shown.map((_, i) => `ev${i}`);
	lines.push(`root = Root(${q("Praca agenta — trajectory")}, ${arr(["secMeta", "secTimeline"])}, ${q("Widok predefiniowany — historia z pliku JSONL, której Forgejo nie ma")})`);
	lines.push(`secMeta = Section(${q("Przebieg")}, ${arr(["rowMeta"])})`);
	lines.push(`rowMeta = Row(${arr([
		"mStatus",
		"mEvents",
		"mTokens"
	])})`);
	lines.push(`mStatus = StatTile(${q("Status")}, ${q(status ?? "w toku")})`);
	lines.push(`mEvents = StatTile(${q("Zdarzenia")}, ${q(events.length)}, ${q("append-only")})`);
	lines.push(`mTokens = StatTile(${q("Tokeny")}, ${q(usage ? `${usage.prompt_tokens} / ${usage.completion_tokens}` : "—")}, ${q("wejście / wyjście")})`);
	lines.push(`secTimeline = Section(${q("Oś czasu")}, ${arr(evRefs)})`);
	shown.forEach((e, i) => {
		const kind = e.kind === "tool_result" ? "tool" : e.kind === "model_response" ? "model" : e.kind === "task" ? "task" : e.kind === "finish" ? "finish" : "error";
		const title = e.command ? e.command.slice(0, 90) : e.tool_calls?.length ? `wywołanie: ${e.tool_calls.join(", ")}` : e.kind === "task" ? "zadanie przekazane agentowi" : e.kind === "finish" ? "agent zakończył pracę" : "odpowiedź modelu";
		const detail = e.exit_code !== null && e.exit_code !== void 0 ? `exit=${e.exit_code}${e.content ? "\n" + e.content.slice(0, 200) : ""}` : e.content?.slice(0, 200) || "";
		lines.push(`ev${i} = TimelineEvent(${q(kind)}, ${q(title)}, ${q(detail)}, ${q(e.time)})`);
	});
	return lines.join("\n");
}
//#endregion
//#region src/test-render.tsx
/**
* Test renderowania KAŻDEGO widoku: czy <Renderer> produkuje HTML zawierający
* faktyczne dane, a nie samą strukturę. Walidacja parsera to za mało — ten test
* sprawdza to, co realnie zobaczy użytkownik.
*/
var API = "http://127.0.0.1:8787";
function ocen({ nazwa, lang, oczekiwane }) {
	let html = "";
	try {
		html = renderToString(/* @__PURE__ */ jsx(Renderer, {
			response: lang,
			library,
			isStreaming: false
		}));
	} catch (e) {
		console.log(`✗ ${nazwa}: WYJĄTEK ${String(e).slice(0, 160)}`);
		return false;
	}
	const tekst = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
	const brakujace = oczekiwane.filter((o) => !html.includes(o));
	const komponenty = new Set([...html.matchAll(/class="(root|section|row|tile|repo|table-wrap|ev|badge)"/g)].map((m) => m[1]));
	const ok = brakujace.length === 0 && tekst.length > 40;
	console.log(`${ok ? "✓" : "✗"} ${nazwa}: html=${html.length} zn., tekst=${tekst.length} zn., komponenty=[${[...komponenty].join(",")}]` + (brakujace.length ? ` | BRAK DANYCH: ${brakujace.join(", ")}` : ""));
	if (ok) console.log(`   podgląd: ${tekst.slice(0, 150)}…`);
	return ok;
}
async function main() {
	const repos = await fetch(`${API}/api/repos`).then((r) => r.json());
	const commits = await fetch(`${API}/api/commits?repo=helmflow%2Fdemo-agenta`).then((r) => r.json());
	const traj = await fetch(`${API}/api/trajectory`).then((r) => r.json());
	const sprawdziany = [{
		nazwa: "widok predefiniowany: Repozytoria",
		lang: repoView(repos, commits, "helmflow/demo-agenta"),
		oczekiwane: [
			"Repozytoria w Forgejo",
			"helmflow/demo-agenta",
			"a189a2d2",
			"Agent Eksperymentu"
		]
	}, {
		nazwa: "widok predefiniowany: Praca agenta",
		lang: trajectoryView(traj.events, traj.usage, traj.status),
		oczekiwane: [
			"Praca agenta",
			"success",
			String(traj.events.length)
		]
	}];
	const systemPrompt = library.prompt({
		preamble: "Budujesz widoki dla Helmflow — systemu nadzoru nad agentami programistycznymi. Odpowiadasz wyłącznie w openui-lang.",
		additionalRules: [
			"Używaj wyłącznie komponentów z katalogu.",
			"Dane wstawiaj jako literały tekstowe w argumentach.",
			"Zaczynaj od root = Root(...)."
		]
	});
	const gen = await fetch(`${API}/api/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			systemPrompt,
			userPrompt: `Pokaż przegląd: kafelki z liczbą repozytoriów i commitów agenta oraz tabelę commitów.

Repozytoria:\n${JSON.stringify(repos)}\n\nCommity:\n${JSON.stringify(commits)}`
		})
	}).then((r) => r.json());
	if (gen.lang) sprawdziany.push({
		nazwa: `widok ad-hoc (model, ${gen.usage?.completion_tokens} tok, ${gen.latency_ms} ms)`,
		lang: gen.lang,
		oczekiwane: ["demo-agenta"]
	});
	else console.log("✗ widok ad-hoc: brak odpowiedzi modelu:", String(gen.error).slice(0, 200));
	const wyniki = sprawdziany.map(ocen);
	const zdane = wyniki.filter(Boolean).length;
	console.log(`\nWYNIK: ${zdane}/${wyniki.length} widoków renderuje się z danymi.`);
	process.exit(zdane === wyniki.length ? 0 : 1);
}
main().catch((e) => {
	console.error("BŁĄD:", e);
	process.exit(1);
});
//#endregion
export {};
