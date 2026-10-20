import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getKnowledgePack } from "../src/data/element-knowledge";
import { knowledgeElementIds } from "../src/data/knowledge-availability";

// The reviewed snapshot remains the single content source. Runtime chunks are
// derived with the same selector used by the content checks.
const directory = new URL(
  "../src/data/knowledge-packs.generated/",
  import.meta.url,
);
await mkdir(directory, { recursive: true });
for (const id of knowledgeElementIds) {
  const pack = getKnowledgePack(id);
  if (!pack) throw new Error(`Missing knowledge pack: ${id}`);
  await writeFile(new URL(`${id}.json`, directory), JSON.stringify(pack));
}
console.log(
  `Generated ${knowledgeElementIds.length} element packs in ${fileURLToPath(directory)}`,
);
