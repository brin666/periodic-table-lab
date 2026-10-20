/** Route metadata only: keep the reviewed content in the deferred knowledge page. */
export const knowledgeElementIds = [
  "h",
  "c",
  "n",
  "o",
  "s",
  "p",
  "si",
  "li",
  "na",
  "k",
  "mg",
  "ca",
  "al",
  "ba",
  "f",
  "he",
  "ar",
  "cl",
  "br",
  "i",
  "mn",
  "fe",
  "cu",
  "zn",
  "ag",
] as const;

const knowledgeElements = new Set<string>(knowledgeElementIds);
export const hasKnowledgeMap = (id: string) => knowledgeElements.has(id);
