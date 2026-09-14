import { createStreamingParser } from "@openuidev/lang-core";
import { library } from "./components";
const LANG = `root = Root("Tytuł", [sec], "podtytuł")
sec = Section("Sekcja", [tile])
tile = StatTile("Metryka", "42", "wskazówka")`;
const schema = library.toJSONSchema();
console.log("library.root =", JSON.stringify((library as any).root));

const a = createStreamingParser(schema, (library as any).root).set(LANG);
console.log("A) z library.root:", JSON.stringify(a.root?.props ?? null).slice(0, 200));

const b = createStreamingParser(schema).set(LANG);
console.log("B) bez root:", JSON.stringify(b.root?.props ?? null).slice(0, 200));
