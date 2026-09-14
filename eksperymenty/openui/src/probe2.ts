import { library } from "./components";
const s: any = library.toJSONSchema();
console.log(JSON.stringify(s, null, 1).slice(0, 1800));
