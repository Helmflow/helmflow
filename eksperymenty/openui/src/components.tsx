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
import { defineComponent, createLibrary } from "@openuidev/react-lang";
import { z } from "zod";
import type { ReactNode } from "react";

const Root = defineComponent({
  name: "Root",
  description: "Korzeń widoku: tytuł strony i lista sekcji.",
  props: z.object({
    title: z.string().describe("Tytuł widoku"),
    children: z.array(z.any()).describe("Sekcje i bloki widoku"),
    subtitle: z.string().optional().describe("Podtytuł/kontekst"),
  }),
  component: ({ title, children, subtitle }) => (
    <div className="root">
      <header className="root-head">
        <h1>{title}</h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </header>
      <div className="root-body">{children as ReactNode}</div>
    </div>
  ),
});

const Section = defineComponent({
  name: "Section",
  description: "Sekcja z nagłówkiem grupująca inne komponenty.",
  props: z.object({
    title: z.string().describe("Nagłówek sekcji"),
    children: z.array(z.any()).describe("Zawartość sekcji"),
  }),
  component: ({ title, children }) => (
    <section className="section">
      <h2>{title}</h2>
      {children as ReactNode}
    </section>
  ),
});

const Row = defineComponent({
  name: "Row",
  description: "Układ poziomy — kafelki obok siebie, zawija się na wąskim ekranie.",
  props: z.object({
    children: z.array(z.any()).describe("Elementy w rzędzie"),
  }),
  component: ({ children }) => <div className="row">{children as ReactNode}</div>,
});

const StatTile = defineComponent({
  name: "StatTile",
  description: "Kafelek z pojedynczą metryką (liczba commitów, tokeny, czas).",
  props: z.object({
    label: z.string().describe("Nazwa metryki"),
    value: z.string().describe("Wartość metryki"),
    hint: z.string().optional().describe("Dopisek pod wartością"),
  }),
  component: ({ label, value, hint }) => (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className="tile-value">{value}</div>
      {hint ? <div className="tile-hint">{hint}</div> : null}
    </div>
  ),
});

const RepoCard = defineComponent({
  name: "RepoCard",
  description: "Karta repozytorium: nazwa, opis, gałąź domyślna, czas aktualizacji.",
  props: z.object({
    name: z.string().describe("Pełna nazwa repozytorium"),
    description: z.string().optional().describe("Opis repozytorium"),
    branch: z.string().optional().describe("Gałąź domyślna"),
    updated: z.string().optional().describe("Data ostatniej zmiany"),
  }),
  component: ({ name, description, branch, updated }) => (
    <div className="repo">
      <div className="repo-name">{name}</div>
      {description ? <div className="muted">{description}</div> : null}
      <div className="repo-meta">
        {branch ? <span className="chip">{branch}</span> : null}
        {updated ? <span className="muted small">{updated}</span> : null}
      </div>
    </div>
  ),
});

const DataTable = defineComponent({
  name: "DataTable",
  description: "Tabela danych. Pierwszy argument to nagłówki, drugi to wiersze (tablica tablic).",
  props: z.object({
    columns: z.array(z.string()).describe("Nagłówki kolumn"),
    rows: z.array(z.array(z.string())).describe("Wiersze — każdy jako tablica komórek"),
  }),
  component: ({ columns, rows }) => (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c: string, i: number) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r: string[], i: number) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
});

const TimelineEvent = defineComponent({
  name: "TimelineEvent",
  description:
    "Jedno zdarzenie w historii pracy agenta (trajectory): rodzaj, tytuł, szczegóły, czas.",
  props: z.object({
    kind: z
      .enum(["task", "model", "tool", "finish", "error"])
      .describe("Rodzaj zdarzenia"),
    title: z.string().describe("Krótki opis zdarzenia"),
    detail: z.string().optional().describe("Szczegóły — polecenie, wynik, fragment odpowiedzi"),
    time: z.string().optional().describe("Znacznik czasu"),
  }),
  component: ({ kind, title, detail, time }) => (
    <div className={`ev ev-${kind}`}>
      <div className="ev-head">
        <span className={`badge badge-${kind}`}>{kind}</span>
        <span className="ev-title">{title}</span>
        {time ? <span className="muted small">{time}</span> : null}
      </div>
      {detail ? <pre className="ev-detail">{detail}</pre> : null}
    </div>
  ),
});

const StatusBadge = defineComponent({
  name: "StatusBadge",
  description: "Znacznik stanu (np. wynik testów, stan Agent Run).",
  props: z.object({
    label: z.string().describe("Tekst znacznika"),
    tone: z.enum(["ok", "warn", "error", "info"]).describe("Wydźwięk"),
  }),
  component: ({ label, tone }) => <span className={`badge badge-${tone}`}>{label}</span>,
});

const Text = defineComponent({
  name: "Text",
  description: "Akapit tekstu.",
  props: z.object({ content: z.string().describe("Treść") }),
  component: ({ content }) => <p className="text">{content}</p>,
});

export const library = createLibrary({
  components: [Root, Section, Row, StatTile, RepoCard, DataTable, TimelineEvent, StatusBadge, Text],
  root: "Root",
});
