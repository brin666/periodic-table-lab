import type { KnowledgePack } from "./knowledge-map";

const imports = import.meta.glob<{ default: KnowledgePack }>(
  "./knowledge-packs.generated/*.json",
);
const loaded = new Map<string, KnowledgePack>();
const pending = new Map<string, Promise<KnowledgePack>>();

export const getLoadedKnowledgePack = (id: string) => loaded.get(id);

export function loadKnowledgePack(id: string): Promise<KnowledgePack> {
  const pack = loaded.get(id);
  if (pack) return Promise.resolve(pack);
  const inFlight = pending.get(id);
  if (inFlight) return inFlight;
  const load = imports[`./knowledge-packs.generated/${id}.json`];
  if (!load)
    return Promise.reject(new Error(`Unknown knowledge element: ${id}`));
  const request = load().then(
    ({ default: pack }) => {
      loaded.set(id, pack);
      pending.delete(id);
      return pack;
    },
    (error: unknown) => {
      pending.delete(id);
      throw error;
    },
  );
  pending.set(id, request);
  return request;
}
