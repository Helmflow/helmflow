import { createParser } from "@openuidev/lang-core";
import { library } from "./components";
const LANG = `root = Root("Tytuł", [sec], "podtytuł")
sec = Section("Sekcja", [tile])
tile = StatTile("Metryka", "42", "wskazówka")`;
const p1 = createParser(library.toJSONSchema());
const r1 = p1.parse(LANG);
console.log("=== parser(toJSONSchema) root:", JSON.stringify(r1.root, null, 1).slice(0, 700));
const p2 = createParser(library as any);
const r2 = p2.parse(LANG);
console.log("=== parser(library) root:", JSON.stringify(r2.root, null, 1).slice(0, 700));
