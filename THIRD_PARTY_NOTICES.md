# Third-party sources and reuse notes

This file records the provenance of data and reference material used by the project. A source link or attribution does not transfer rights or grant permission to republish the linked material.

## Project license status

This repository currently has no project-wide license file. Making the repository public does not grant a general license to copy, modify, redistribute, or commercially use its code, structured content, writing, or images. No MIT or other blanket license is claimed here.

Dependencies retain their own package terms and notices. Direct dependencies and pinned package versions are recorded in `package.json` and `package-lock.json`; consult each package's own license and notices before redistributing it.

## Element data and chemistry references

| Source | Project metadata and use |
| --- | --- |
| [PubChem periodic-table CSV](https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/CSV) — NIH / NCBI PubChem | Retrieved and parsed on 2026-10-11. The 118-row source supplies atomic numbers, symbols, English names, categories, and electron configurations. Shell populations are calculated after expanding noble-gas cores. The CSV `AtomicMass` column is not used as standard atomic weight. |
| [PubChem PUG REST compound properties](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/sodium%20carbonate%20monohydrate/property/MolecularFormula,MolecularWeight,IUPACName,Title/JSON) — NIH / NCBI PubChem | Compound lookups were read on 2026-10-16. The 559 accepted records use the returned CID, molecular formula, molecular weight, IUPAC name, and title. Each candidate was checked against the intended elemental composition before inclusion. This example URL is one of the name-based property requests recorded by the source data workflow. |
| [Abridged Standard Atomic Weights 2024](https://ciaaw.org/abridged-atomic-weights.htm) — IUPAC Commission on Isotopic Abundances and Atomic Weights (CIAAW) | Retrieved and parsed on 2026-10-11. The project retains the table's abridged values and stated uncertainties, including the 2024 revisions for zirconium, gadolinium, and lutetium. An em dash is not replaced with an isotope mass. |
| [Chinese Chemical Society: Chinese periodic table release page](https://www.chemsoc.org.cn/international/news/a2613.html) — Chinese Chemical Society | Retrieved on 2026-10-11. Used to check Chinese element names and table positions. Project metadata identifies the downloaded PDF as dated 2019-01-23. This source is not used for atomic weights. |
| [Lawrencium element page](https://periodic-table.rsc.org/element/103/lawrencium) — Royal Society of Chemistry (RSC) | Retrieved on 2026-10-11. The RSC fact box supplies the lawrencium configuration used to replace the older configuration in the PubChem CSV. Other RSC element pages are linked from the relevant knowledge-card source records. |
| [Zinc element page](https://periodic-table.rsc.org/element/30/zinc) — Royal Society of Chemistry (RSC) | Referenced by selected extension cards for zinc facts. It is a chemistry reference, not evidence of alignment to a Chinese textbook page. |
| [Titration of hydrogen peroxide by KMnO₄](https://www.rsc.org/suppdata/nj/c2/c2nj21007j/c2nj21007j.pdf#page=2) — RSC, *New Journal of Chemistry* (2012) | Referenced for an acid-medium peroxide redox example. The site's equation presentation is identified as an extension; it is not represented as a textbook quotation. |

## NUBASE2020 nuclide index

The nuclide data is based on the [NUBASE2020 evaluated nuclear properties file](https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt) and its [2021 publication](https://www-nds.iaea.org/amdc/ame2020/NUBASE2020.pdf), by F. G. Kondev and coauthors, *Chinese Physics C* 45, 030001 (2021), DOI [10.1088/1674-1137/abddae](https://doi.org/10.1088/1674-1137/abddae).

Project metadata records a literature cutoff of 2020-10-30 and retrieval on 2026-10-16. The downloaded source was 761,906 bytes with SHA-256 `1585a5eea86c5e17e90307c7e6e786d060049c4039e392a261ff6db977df9859`. From 5,843 source records, the project retained the 3,557 ground-state entries for Z=1–118, excluded two entries marked RN (reported nonexistent in the evaluation), and presents 3,555 records across 118 elements. The index includes estimated values and one EU entry whose existence is uncertain; it excludes the free neutron and non-ground-state entries. It is a NUBASE2020 version index, not a live census of discovered nuclides.

## Textbook references

The site records textbook page references and their verification status. It does not include textbook scans. Some pages were read through public mirrors, whose availability does not grant permission to reproduce the textbook.

| Reference | Edition and evidence boundary |
| --- | --- |
| People's Education Press, junior-high Chemistry, Book 1: [public FlipHTML5 mirror, reader page 47](https://online.fliphtml5.com/wvxmb/hcsg/#p=47) | The cover carries a 2024 approval mark; the exact printing and ISBN are not shown. The project records printed pages separately from the mirror's reader-page numbers. The mirror identifies uploader `luyiese`. |
| People's Education Press, senior-high Chemistry, Compulsory Book 1: [SCNU course PDF, PDF page 42](https://moodle.scnu.edu.cn/pluginfile.php/1332827/mod_folder/content/0/2023%E7%89%88%E4%BA%BA%E6%95%99%E7%89%88%E5%BF%85%E4%BF%AE%E4%B8%80.pdf?forcedownload=1#page=42) | The cover carries a 2019 approval mark; the exact printing and ISBN are not shown. The project links page-level evidence and does not treat the filename's `2023` text as a publication date. |
| People's Education Press, junior-high Chemistry, Book 2: [official reading entry](https://book.pep.com.cn/1342001302241/) | Listed as an official entry. The project source record marks the textbook body as pending; it is not used to claim page-verified alignment. |

The project also cites chemistry references such as RSC, OpenStax, and university teaching materials. Their source records distinguish general scientific support from a verified textbook-page match. See `src/data/textbook-sources.ts`, `src/data/element-sources.ts`, `src/data/content.ts`, and the source records attached to the knowledge packs for the exact content-level citations and notes.

These citations identify provenance and do not assign a license to source-derived values or text. The project does not claim that PubChem as a whole, or every record contributed to PubChem, is public domain. For reuse, check the current terms and attribution requirements of the relevant provider and record.

## Generated and retained images

The public knowledge-card set contains 228 WebP files in `public/stickers/knowledge-20261017/`. The integration record classifies them as 222 newly added files and 6 retained repaired samples; the current card mapping points to this set. The local source checkout also retains a separate legacy hydrogen set with 20 PNG source images and 20 WebP display images under `public/stickers/hydrogen-v1/`. `.gitignore` excludes that entire legacy directory, so these images are local historical material and are not published with this repository.

Generated artwork does not automatically have cleared reuse rights. Review provenance and rights for each published asset before redistributing it, especially for commercial use. The public repository does not grant a blanket image license.
