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
import { defineComponent, createLibrary } from "@openuidev/react-lang";
import { z } from "zod";
import { Fragment, type ReactNode } from "react";

/** Renderuje listę węzłów-dzieci przez renderNode dostarczony przez runtime. */
function Children({
  nodes,
  renderNode,
}: {
  nodes: unknown;
  renderNode?: (node: unknown) => ReactNode;
}) {
  if (!Array.isArray(nodes) || !renderNode) return null;
  return (
    <>
      {nodes.map((n, i) => (
        <Fragment key={i}>{renderNode(n)}</Fragment>
      ))}
    </>
  );
}

const Root = defineComponent({
  name: "Root",
  description: "Korzeń widoku: tytuł strony i lista sekcji.",
  props: z.object({
    title: z.string().describe("Tytuł widoku"),
    children: z.array(z.any()).describe("Sekcje i bloki widoku"),
    subtitle: z.string().optional().describe("Podtytuł/kontekst"),
  }),
  component: ({ props, renderNode }: any) => (
    <div className="root">
      <header className="root-head">
        <h1>{props?.title}</h1>
        {props?.subtitle ? <p className="muted">{props.subtitle}</p> : null}
      </header>
      <div className="root-body">
        <Children nodes={props?.children} renderNode={renderNode} />
      </div>
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
  component: ({ props, renderNode }: any) => (
    <section className="section">
      <h2>{props?.title}</h2>
      <Children nodes={props?.children} renderNode={renderNode} />
    </section>
  ),
});

const Row = defineComponent({
  name: "Row",
  description: "Układ poziomy — kafelki obok siebie, zawija się na wąskim ekranie.",
  props: z.object({
    children: z.array(z.any()).describe("Elementy w rzędzie"),
  }),
  component: ({ props, renderNode }: any) => (
    <div className="row">
      <Children nodes={props?.children} renderNode={renderNode} />
    </div>
  ),
});

const StatTile = defineComponent({
  name: "StatTile",
  description: "Kafelek z pojedynczą metryką (liczba commitów, tokeny, czas).",
  props: z.object({
    label: z.string().describe("Nazwa metryki"),
    value: z.string().describe("Wartość metryki"),
    hint: z.string().optional().describe("Dopisek pod wartością"),
  }),
  component: ({ props }: any) => (
    <div className="tile">
      <div className="tile-label">{props?.label}</div>
      <div className="tile-value">{props?.value}</div>
      {props?.hint ? <div className="tile-hint">{props.hint}</div> : null}
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
  component: ({ props }: any) => (
    <div className="repo">
      <div className="repo-name">{props?.name}</div>
      {props?.description ? <div className="muted">{props.description}</div> : null}
      <div className="repo-meta">
        {props?.branch ? <span className="chip">{props.branch}</span> : null}
        {props?.updated ? <span className="muted small">{props.updated}</span> : null}
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
  component: ({ props }: any) => {
    const columns: string[] = Array.isArray(props?.columns) ? props.columns : [];
    const rows: string[][] = Array.isArray(props?.rows) ? props.rows : [];
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i}>{String(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {(Array.isArray(r) ? r : [r]).map((c, j) => (
                  <td key={j}>{String(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});

const TimelineEvent = defineComponent({
  name: "TimelineEvent",
  description:
    "Jedno zdarzenie w historii pracy agenta (trajectory): rodzaj, tytuł, szczegóły, czas.",
  props: z.object({
    kind: z.enum(["task", "model", "tool", "finish", "error"]).describe("Rodzaj zdarzenia"),
    title: z.string().describe("Krótki opis zdarzenia"),
    detail: z.string().optional().describe("Szczegóły — polecenie, wynik, fragment odpowiedzi"),
    time: z.string().optional().describe("Znacznik czasu"),
  }),
  component: ({ props }: any) => (
    <div className={`ev ev-${props?.kind ?? "model"}`}>
      <div className="ev-head">
        <span className={`badge badge-${props?.kind ?? "model"}`}>{props?.kind}</span>
        <span className="ev-title">{props?.title}</span>
        {props?.time ? <span className="muted small">{props.time}</span> : null}
      </div>
      {props?.detail ? <pre className="ev-detail">{props.detail}</pre> : null}
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
  component: ({ props }: any) => (
    <span className={`badge badge-${props?.tone ?? "info"}`}>{props?.label}</span>
  ),
});

const Text = defineComponent({
  name: "Text",
  description: "Akapit tekstu.",
  props: z.object({ content: z.string().describe("Treść") }),
  component: ({ props }: any) => <p className="text">{props?.content}</p>,
});

export const library = createLibrary({
  components: [Root, Section, Row, StatTile, RepoCard, DataTable, TimelineEvent, StatusBadge, Text],
  root: "Root",
});
