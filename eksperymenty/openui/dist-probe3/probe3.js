import { createParser } from "@openuidev/lang-core";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components.tsx
/**
* Katalog komponentów Helmflow dla OpenUI.
*
* WAŻNE: argumenty w OpenUI Lang są POZYCYJNE — kolejność pól w schemacie Zod
* wyznacza kolejność argumentów w wywołaniu komponentu. Najważniejszy prop idzie
* pierwszy, opcjonalne na końcu.
*
* Ten sam katalog obsługuje oba tryby z tezy eksperymentu:
*  - widoki predefiniowane (kompozycja zapisana w repo, karmiona danymi z silnika),
*  - widoki ad-hoc (kompozycja od modelu w czasie działania).
*/
var Root = defineComponent({
	name: "Root",
	description: "Korzeń widoku: tytuł strony i lista sekcji.",
	props: z.object({
		title: z.string().describe("Tytuł widoku"),
		children: z.array(z.any()).describe("Sekcje i bloki widoku"),
		subtitle: z.string().optional().describe("Podtytuł/kontekst")
	}),
	component: ({ title, children, subtitle }) => /* @__PURE__ */ jsxs("div", {
		className: "root",
		children: [/* @__PURE__ */ jsxs("header", {
			className: "root-head",
			children: [/* @__PURE__ */ jsx("h1", { children: title }), subtitle ? /* @__PURE__ */ jsx("p", {
				className: "muted",
				children: subtitle
			}) : null]
		}), /* @__PURE__ */ jsx("div", {
			className: "root-body",
			children
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
	component: ({ title, children }) => /* @__PURE__ */ jsxs("section", {
		className: "section",
		children: [/* @__PURE__ */ jsx("h2", { children: title }), children]
	})
});
var Row = defineComponent({
	name: "Row",
	description: "Układ poziomy — kafelki obok siebie, zawija się na wąskim ekranie.",
	props: z.object({ children: z.array(z.any()).describe("Elementy w rzędzie") }),
	component: ({ children }) => /* @__PURE__ */ jsx("div", {
		className: "row",
		children
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
	component: ({ label, value, hint }) => /* @__PURE__ */ jsxs("div", {
		className: "tile",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "tile-label",
				children: label
			}),
			/* @__PURE__ */ jsx("div", {
				className: "tile-value",
				children: value
			}),
			hint ? /* @__PURE__ */ jsx("div", {
				className: "tile-hint",
				children: hint
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
	component: ({ name, description, branch, updated }) => /* @__PURE__ */ jsxs("div", {
		className: "repo",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "repo-name",
				children: name
			}),
			description ? /* @__PURE__ */ jsx("div", {
				className: "muted",
				children: description
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "repo-meta",
				children: [branch ? /* @__PURE__ */ jsx("span", {
					className: "chip",
					children: branch
				}) : null, updated ? /* @__PURE__ */ jsx("span", {
					className: "muted small",
					children: updated
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
	component: ({ columns, rows }) => /* @__PURE__ */ jsx("div", {
		className: "table-wrap",
		children: /* @__PURE__ */ jsxs("table", { children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: columns.map((c, i) => /* @__PURE__ */ jsx("th", { children: c }, i)) }) }), /* @__PURE__ */ jsx("tbody", { children: rows.map((r, i) => /* @__PURE__ */ jsx("tr", { children: r.map((c, j) => /* @__PURE__ */ jsx("td", { children: c }, j)) }, i)) })] })
	})
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
	component: ({ kind, title, detail, time }) => /* @__PURE__ */ jsxs("div", {
		className: `ev ev-${kind}`,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "ev-head",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: `badge badge-${kind}`,
					children: kind
				}),
				/* @__PURE__ */ jsx("span", {
					className: "ev-title",
					children: title
				}),
				time ? /* @__PURE__ */ jsx("span", {
					className: "muted small",
					children: time
				}) : null
			]
		}), detail ? /* @__PURE__ */ jsx("pre", {
			className: "ev-detail",
			children: detail
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
	component: ({ label, tone }) => /* @__PURE__ */ jsx("span", {
		className: `badge badge-${tone}`,
		children: label
	})
});
var Text = defineComponent({
	name: "Text",
	description: "Akapit tekstu.",
	props: z.object({ content: z.string().describe("Treść") }),
	component: ({ content }) => /* @__PURE__ */ jsx("p", {
		className: "text",
		children: content
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
//#region src/probe3.ts
var LANG = `root = Root("Tytuł", [sec], "podtytuł")
sec = Section("Sekcja", [tile])
tile = StatTile("Metryka", "42", "wskazówka")`;
var r1 = createParser(library.toJSONSchema()).parse(LANG);
console.log("=== parser(toJSONSchema) root:", JSON.stringify(r1.root, null, 1).slice(0, 700));
var r2 = createParser(library).parse(LANG);
console.log("=== parser(library) root:", JSON.stringify(r2.root, null, 1).slice(0, 700));
//#endregion
export {};
