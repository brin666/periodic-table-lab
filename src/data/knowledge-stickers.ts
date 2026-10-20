import cardIds from "./knowledge-sticker-assets.generated.json" with { type: "json" };

// Keep URLs relative to Vite's deployment base, including an isolated subpath.
const base = import.meta.env?.BASE_URL ?? "/";

/** Every reviewed card has one stable asset, shared by preview and dialog. */
export const knowledgeStickerByCardId: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      cardIds.map((id) => [
        id,
        `${base}stickers/knowledge-20261017/${id}.webp`,
      ]),
    ),
  );
