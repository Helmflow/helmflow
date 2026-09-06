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

const q = (v: unknown) => JSON.stringify(String(v ?? ""));
const arr = (names: string[]) => `[${names.join(", ")}]`;

export type Repo = {
  name: string;
  description: string;
  branch: string;
  updated: string;
  empty: boolean;
};
export type Commit = {
  sha: string;
  author: string;
  email: string;
  message: string;
  date: string;
};

export function repoView(repos: Repo[], commits: Commit[], repoName: string): string {
  const lines: string[] = [];
  const repoRefs = repos.map((_, i) => `repo${i}`);
  const tileRefs = ["tRepos", "tCommits", "tAgent"];

  lines.push(
    `root = Root(${q("Repozytoria w Forgejo")}, ${arr(["secStats", "secRepos", "secCommits"])}, ${q(
      "Widok predefiniowany — dane na żywo z API Forgejo"
    )})`
  );
  lines.push(`secStats = Section(${q("Podsumowanie")}, ${arr(["rowStats"])})`);
  lines.push(`rowStats = Row(${arr(tileRefs)})`);
  lines.push(`tRepos = StatTile(${q("Repozytoria")}, ${q(repos.length)})`);
  lines.push(
    `tCommits = StatTile(${q("Commity w " + repoName)}, ${q(commits.length)}, ${q("ostatnie 10")})`
  );
  const agentCommits = commits.filter((c) => c.email.includes("helmflow.local")).length;
  lines.push(
    `tAgent = StatTile(${q("Commity agenta")}, ${q(agentCommits)}, ${q("autor: Agent Eksperymentu")})`
  );

  lines.push(`secRepos = Section(${q("Lista repozytoriów")}, ${arr(repoRefs)})`);
  repos.forEach((r, i) => {
    lines.push(
      `repo${i} = RepoCard(${q(r.name)}, ${q(r.description || (r.empty ? "puste repozytorium" : ""))}, ${q(
        r.branch
      )}, ${q(r.updated)})`
    );
  });

  lines.push(`secCommits = Section(${q("Historia commitów: " + repoName)}, ${arr(["tblCommits"])})`);
  const rows = commits.map(
    (c) => `[${q(c.sha)}, ${q(c.author)}, ${q(c.message)}, ${q(c.date)}]`
  );
  lines.push(
    `tblCommits = DataTable([${q("SHA")}, ${q("Autor")}, ${q("Opis")}, ${q("Data")}], [${rows.join(", ")}])`
  );

  return lines.join("\n");
}

export type TrajectoryEvent = {
  kind: string;
  time: string;
  iteration: number | null;
  command: string | null;
  exit_code: number | null;
  content: string;
  tool_calls: string[];
};

export function trajectoryView(
  events: TrajectoryEvent[],
  usage: { prompt_tokens: number; completion_tokens: number } | null,
  status: string | null
): string {
  const lines: string[] = [];
  const shown = events.slice(0, 24);
  const evRefs = shown.map((_, i) => `ev${i}`);

  lines.push(
    `root = Root(${q("Praca agenta — trajectory")}, ${arr(["secMeta", "secTimeline"])}, ${q(
      "Widok predefiniowany — historia z pliku JSONL, której Forgejo nie ma"
    )})`
  );

  lines.push(`secMeta = Section(${q("Przebieg")}, ${arr(["rowMeta"])})`);
  lines.push(`rowMeta = Row(${arr(["mStatus", "mEvents", "mTokens"])})`);
  lines.push(`mStatus = StatTile(${q("Status")}, ${q(status ?? "w toku")})`);
  lines.push(`mEvents = StatTile(${q("Zdarzenia")}, ${q(events.length)}, ${q("append-only")})`);
  lines.push(
    `mTokens = StatTile(${q("Tokeny")}, ${q(
      usage ? `${usage.prompt_tokens} / ${usage.completion_tokens}` : "—"
    )}, ${q("wejście / wyjście")})`
  );

  lines.push(`secTimeline = Section(${q("Oś czasu")}, ${arr(evRefs)})`);
  shown.forEach((e, i) => {
    const kind =
      e.kind === "tool_result" ? "tool"
      : e.kind === "model_response" ? "model"
      : e.kind === "task" ? "task"
      : e.kind === "finish" ? "finish"
      : "error";
    const title =
      e.command ? e.command.slice(0, 90)
      : e.tool_calls?.length ? `wywołanie: ${e.tool_calls.join(", ")}`
      : e.kind === "task" ? "zadanie przekazane agentowi"
      : e.kind === "finish" ? "agent zakończył pracę"
      : "odpowiedź modelu";
    const detail =
      e.exit_code !== null && e.exit_code !== undefined
        ? `exit=${e.exit_code}${e.content ? "\n" + e.content.slice(0, 200) : ""}`
        : e.content?.slice(0, 200) || "";
    lines.push(
      `ev${i} = TimelineEvent(${q(kind)}, ${q(title)}, ${q(detail)}, ${q(e.time)})`
    );
  });

  return lines.join("\n");
}
