# Between Elements · Interactive Periodic Table

A bilingual chemistry learning site for middle- and high-school students. First visits default to Simplified Chinese; the interface can be switched to English, and a saved language preference persists on later visits.

[Live demo](https://brin666.github.io/demos/periodic-table/) · [简体中文](README.md) · [Third-party sources and reuse notes](THIRD_PARTY_NOTICES.md)

This is a standalone source repository. The live demo is hosted separately by the existing website; this repository does not include a GitHub Pages deployment workflow.

## Explore

- Browse all 118 elements and inspect element details, electron shells, and related substances.
- Explore 25 knowledge maps with 228 unique knowledge cards and their source references.
- Discover compounds from the site's curated inorganic-compound collection. This is not a general chemical database or reaction predictor.
- Browse a ground-state nuclide index based on NUBASE2020.
- Navigate with a keyboard or touch input, with narrow-screen layouts and reduced-motion support.

### Scientific scope

The periodic table covers all 118 elements, while knowledge maps cover 25 selected elements. Compound discovery searches the site's curated inorganic-compound collection and does not represent all known compounds. The nuclide browser contains 3,555 ground-state index records from NUBASE2020, whose literature cutoff is 2020-10-30. It includes estimated entries and one entry with uncertain existence, so it is not a live or complete census of discovered nuclides. Textbook alignment is tied to recorded page sources and verification status; a publicly referenced edition may differ from a reader's specific printing.

## Run locally

Requires Node.js 20.19+ or 22.12+, plus npm. Clone the repository and run from its root:

```sh
git clone https://github.com/brin666/periodic-table-lab.git
cd periodic-table-lab
npm ci
npm run dev
```

The development server prints its local URL. Common build and verification commands:

```sh
npm test                 # data and logic tests
npm run typecheck        # TypeScript type check
npm run build            # generate knowledge packs and build to dist/
npx playwright install chromium # install Chromium before the first browser-test run
npm run test:browser     # optional CHROMIUM_PATH environment variable selects an existing Chromium executable
```

`npm run dev` and `npm run build` run the knowledge-pack generator automatically. To run it separately, use `npm run generate:knowledge-packs`.

`npm test` runs offline using the source fixtures in `tests/fixtures/`: 559 compact PubChem compound-property JSON responses and a byte-preserved NUBASE2020 numeric table checked against its source hash. The fixtures include no textbook PDFs or third-party article prose; `knowledge-copy-before.json` is a regression snapshot of project-authored content.

## Source layout

- `src/`: React + TypeScript interface and interactions.
- `src/data/`: element, substance, equation, compound, nuclide, and source metadata; `knowledge-packs.generated/` contains generated files.
- `src/i18n/`: English interface and content mappings.
- `public/stickers/knowledge-20261017/`: the 228 WebP stickers used by current public knowledge cards. Legacy hydrogen stickers are retained only as local historical material and are not published with this repository.
- `scripts/`: knowledge-pack build scripts.
- `server/`: optional anonymous feedback receiver; see [server/README.md](server/README.md).
- `tests/`: data, logic, and browser tests.

## Optional feedback receiver

The site can connect to a separately deployed feedback receiver. Follow `server/README.md` for server-side configuration. Before running `npm run feedback:local`, set `FEEDBACK_GITHUB_OWNER` and `FEEDBACK_GITHUB_REPO` locally to a dedicated public feedback repository that you control; the helper currently defaults to `brin666/periodic-table-feedback`. It reads the local GitHub CLI login by default. Submitted reports are public Issues in the selected repository. The local helper uses your local GitHub CLI login; a deployed receiver keeps its credentials in the server's private environment. Never put credentials in frontend code, a `VITE_` variable, or the repository. The browser-side `VITE_FEEDBACK_API_URL`, if needed, is only the receiver URL, not a secret.

## Sources and reuse

Element, nuclide, chemistry, and textbook-page references are recorded with the related content. Read [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for source details and reuse boundaries. This repository currently has no project-wide license; publication as a public repository does not grant general permission to reuse its code, data, text, or images.
