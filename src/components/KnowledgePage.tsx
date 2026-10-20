import type { ComponentProps } from "react";
import { KnowledgeMap } from "./KnowledgeMap";

export type KnowledgePageProps = Omit<
  ComponentProps<typeof KnowledgeMap>,
  "pack"
>;

/** The renderer loads alongside the requested element's separate data chunk. */
export function KnowledgePage(props: ComponentProps<typeof KnowledgeMap>) {
  return <KnowledgeMap {...props} />;
}
