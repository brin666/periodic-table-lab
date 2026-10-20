# Offline source-check fixtures

These files make the source and data tests reproducible without network access.
The original local research workspace is not needed to build or test a clone.

- `knowledge-copy-before.json`: this project's authored knowledge-card snapshot
  before the wording pass. Tests compare IDs, links, curriculum and scientific
  fields so that prose edits cannot silently change the underlying records.
- `nubase2020/nubase_4.mas20.txt`: the pinned numerical NUBASE2020 table retrieved
  on 2026-10-16 from the [IAEA-hosted Atomic Mass Data Center](https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt).
  Citation: F. G. Kondev, M. Wang, W. J. Huang, S. Naimi and G. Audi,
  *The NUBASE2020 evaluation of nuclear physics properties*, Chinese Physics C
  45, 030001 (2021), [doi:10.1088/1674-1137/abddae](https://doi.org/10.1088/1674-1137/abddae).
  The file's citation and field-format header are retained. `ledger.json` is the
  project's import metadata. The tests verify the exact original SHA-256,
  scope, and individual fields; they do not treat this as a current census.
- `pubchem-inorganic/ledger.json`: the project's collection and inclusion
  ledger. `raw/` contains only the 559 compact PUG REST compound-property JSON
  responses required by the published inorganic records. Fields are CID,
  formula, molecular weight, IUPAC name and title when provided. The ledger
  retains the original request URL and each response's SHA-256. No downloaded
  textbook, article, safety narrative or experimental procedure is included.

Upstream data retain their original provenance and applicable conditions;
these files are not assigned a new blanket license. See
[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md). `.gitattributes` disables
newline conversion for this directory because byte-level evidence tests depend
on the exact files.
