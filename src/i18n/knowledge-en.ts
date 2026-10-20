import type { KnowledgePack, KnowledgeSource } from "../data/knowledge-map";

export interface KnowledgeEnglish {
  branches: Record<string, string>;
  cards: Record<
    string,
    {
      title: string;
      summary: string;
      paragraphs: string[];
      highlights: string[];
      curriculum: { volume: string; chapter: string };
    }
  >;
  gaps: Record<string, string>;
}

/** English UI copy is keyed by the stable IDs in the Chinese source packs. */
export const knowledgeEnglish: KnowledgeEnglish = {
  branches: {
    "c-ag-branch-1": "Silver and materials",
    "c-ag-branch-2": "Redox reactions of silver ions",
    "c-ag-branch-3": "Silver halides and equilibria",
    "b-al-branch-1": "Aluminum: position and atomic structure",
    "b-al-branch-2": "Aluminum and its protective film",
    "b-al-branch-3": "Aluminum oxides and hydroxides",
    "b-al-branch-4": "Aluminum alloys",
    "c-ar-branch-1": "Atomic structure and periodic-table position",
    "c-ar-branch-2": "Argon: properties and uses",
    "b-ba-branch-1": "Barium: element symbol",
    "b-ba-branch-2": "Barium salts and ionic reactions",
    "b-ba-branch-3": "Equilibria of sparingly soluble salts",
    "b-ba-branch-4": "Flame-test identification",
    "c-br-branch-1": "Element symbol and elemental bromine",
    "c-br-branch-2": "Halogen trends and extraction",
    "c-br-branch-3": "Bromide ions and silver salts",
    "c-reactions": "Hydrocarbon structure and reactions",
    "c-identity": "Carbon atoms and elemental carbon",
    "c-materials": "Carbon oxides and carbonates",
    "c-organic": "Functional groups and organic transformations",
    "b-ca-branch-1": "Calcium and mineral materials",
    "b-ca-branch-2": "Lime transformations",
    "b-ca-branch-3": "Calcium ions and precipitates",
    "b-ca-branch-4": "Flame tests and ionic crystals",
    "c-cl-branch-1": "Atomic structure and chloride ions",
    "c-cl-branch-2": "Chlorine, hydrogen chloride, and hypochlorous acid",
    "c-cl-branch-3": "Halogen trends and identification",
    "c-cl-branch-4": "Chlorine-containing materials and reactions with bases",
    "c-cu-branch-1": "Copper: element and properties",
    "c-cu-branch-2": "Redox reactions of copper",
    "c-cu-branch-3": "Electrochemical connections",
    "c-cu-branch-4": "Copper compounds and coordination",
    "c-fe-branch-1": "Iron and materials",
    "c-fe-branch-2": "Reactions and oxides of iron",
    "c-fe-branch-3": "Iron(II) and iron(III) ions",
    "c-fe-branch-4": "Corrosion and protection",
    "b-f-branch-1": "Atomic structure and position in the halogen group",
    "b-f-branch-2": "Halogen trends and hydrogen fluoride",
    "b-f-branch-3": "Fluoride ions and crystals",
    "b-f-branch-4": "Distinguishing fluorine-containing materials",
    "c-he-branch-1": "Atomic structure and periodic-table position",
    "c-he-branch-2": "Helium: properties and uses",
    "h-atom": "Atomic structure",
    "h-gas": "Properties of hydrogen gas",
    "h-materials": "Hydrogen-containing substances",
    "h-reactions": "Reactions of hydrogen",
    "b-k-branch-1": "Potassium: atomic structure and position",
    "b-k-branch-2": "Potassium and water",
    "b-k-branch-3": "Potassium salts and flame tests",
    "b-k-branch-4": "Potassium compounds and uses",
    "b-li-branch-1": "Lithium: atomic structure and position",
    "b-li-branch-2": "Lithium and the alkali-metal group",
    "b-li-branch-3": "Lithium compounds and reactions",
    "b-li-branch-4": "Lithium in batteries and alloys",
    "b-mg-branch-1": "Magnesium: atomic structure and position",
    "b-mg-branch-2": "Magnesium and its reactions",
    "b-mg-branch-3": "Magnesium compounds and equilibria",
    "b-mg-branch-4": "Magnesium in materials and electrochemistry",
    "b-na-branch-1": "Sodium: atomic structure and position",
    "b-na-branch-2": "Sodium and water",
    "b-na-branch-3": "Sodium compounds and their properties",
    "b-na-branch-4": "Sodium in industry and daily life",
    "c-i-branch-1": "Iodine: element and atomic structure",
    "c-i-branch-2": "Iodine, iodide, and equilibria",
    "c-i-branch-3": "Iodine in materials and reactions",
    "c-mn-branch-1": "Manganese: element and common compounds",
    "c-mn-branch-2": "Manganese oxidation states and redox",
    "c-mn-branch-3": "Permanganate reactions",
    "c-mn-branch-4": "Manganese in alloys and batteries",
    "c-zn-branch-1": "Zinc: element and reactions",
    "c-zn-branch-2": "Zinc ions and compounds",
    "c-zn-branch-3": "Zinc in cells, alloys, and materials",
    "n-ammonium": "Ammonia and ammonium ions",
    "n-fixation": "Nitrogen fixation and the nitrogen cycle",
    "n-knowledge": "Nitrogen: atomic structure and properties",
    "n-oxides": "Nitrogen oxides and nitric acid",
    "o-identity": "Oxygen atoms, molecules, and elemental oxygen",
    "o-materials": "Oxygen-containing substances and materials",
    "o-reactions": "Oxygen in chemical reactions",
    "o-structure": "Atomic structure and periodic-table position",
    "p-biomolecules": "Phosphorus in biological molecules",
    "p-knowledge": "Phosphorus: atomic structure and properties",
    "p-oxide": "Phosphorus oxides and related reactions",
    "p-structure": "Phosphorus structures and allotropes",
    "s-acid": "Sulfuric acid and sulfate salts",
    "s-cycle": "Sulfur transformations and environmental effects",
    "s-dioxide": "Sulfur dioxide: properties and reactions",
    "s-knowledge": "Sulfur: atomic structure and common valences",
    "si-industry": "Silicon in industrial materials",
    "si-knowledge": "Silicon: atomic structure and properties",
    "si-oxide": "Silicon dioxide and silicates",
    "si-technology": "Silicon in technology and materials",
  },
  cards: {
    "b-na-brine-process": {
      title: "Why saturated brine is used to make sodium hydroxide",
      summary: "Industrial NaOH is made mainly by electrolyzing saturated brine; feedstock availability and cost also shape the process choice.",
      paragraphs: [
        "Na₂O also reacts with water to form NaOH, but Na₂O is scarce as a feedstock and expensive. A reaction that can occur is not necessarily a suitable industrial production route.",
        "Saturated brine contains mobile Na⁺ and Cl⁻ ions. Passing an electric current drives chemical change, so electrolysis can be used to produce NaOH. This process uses electrical energy to drive the conversion of substances.",
      ],
      highlights: ["saturated brine", "industrial process", "cost and feedstocks"],
      curriculum: { volume: "Compulsory 1", chapter: "Chemical conversion and industrial process choices" },
    },
    "b-na-carbonate-bicarbonate": {
      title: "How to distinguish sodium carbonate from sodium bicarbonate",
      summary: "Na₂CO₃ and NaHCO₃ are both sodium salts; heating can exploit the greater ease with which sodium bicarbonate decomposes.",
      paragraphs: [
        "Sodium carbonate is a white powder, while sodium bicarbonate is a fine white crystalline solid. Both solutions are alkaline. Sodium carbonate contains CO₃²⁻ and sodium bicarbonate contains HCO₃⁻; sharing the word “carbonate” does not make their formulas the same.",
        "Na₂CO₃ is comparatively stable on heating, whereas NaHCO₃ decomposes more readily. Heating solid sodium bicarbonate produces sodium carbonate, water, and carbon dioxide; the different products can be used to distinguish the two solids.",
      ],
      highlights: ["Na₂CO₃", "NaHCO₃", "identification by heating"],
      curriculum: { volume: "Compulsory 1", chapter: "Sodium carbonate and sodium bicarbonate" },
    },
    "b-na-carbonate-hydrolysis": {
      title: "Why sodium carbonate solution is alkaline",
      summary: "Na₂CO₃ ionizes first; CO₃²⁻ then hydrolyzes reversibly in water. Hydrolysis should not be written as direct ionization of the salt to produce OH⁻.",
      paragraphs: [
        "Na₂CO₃ is a salt of a strong base and a weak acid, so its aqueous solution is alkaline. It first dissociates into 2Na⁺ and CO₃²⁻ in water; this step does not directly produce OH⁻.",
        "The main hydrolysis step is CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻. HCO₃⁻ can hydrolyze further, but to a smaller extent. The resulting increase in OH⁻ makes the solution alkaline; the second hydrolysis step of sodium carbonate does not normally release CO₂.",
      ],
      highlights: ["ionization and hydrolysis", "CO₃²⁻", "alkaline solution"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Salt hydrolysis" },
    },
    "b-na-flame-yellow": {
      title: "Sodium's yellow flame and its interference",
      summary: "Sodium gives a characteristic yellow flame that can interfere with observing potassium's lilac flame.",
      paragraphs: [
        "A flame test uses characteristic flame colors from certain metals or their compounds when heated for qualitative identification. Sodium gives a yellow flame, but flame color alone is not a unique way to identify a sodium salt.",
        "When observing potassium's lilac flame, blue cobalt glass can filter yellow light that may come from trace sodium salts. A flame test is associated with the element; it does not turn Na⁺ into sodium metal.",
      ],
      highlights: ["yellow flame", "cobalt glass", "qualitative identification"],
      curriculum: { volume: "Compulsory 1", chapter: "Flame tests" },
    },
    "b-na-nacl-crystal": {
      title: "NaCl is an ionic crystal, not a collection of separate molecules",
      summary: "NaCl gives the simplest ratio of Na⁺ to Cl⁻; ions repeat in a three-dimensional crystal lattice.",
      paragraphs: [
        "In a salt crystal, Na⁺ and Cl⁻ occur in a 1:1 ratio and balance each other's charge. NaCl gives the simplest ratio of the ions; it does not mean the crystal contains separate NaCl molecules.",
        "Ions in the solid are constrained by the lattice and usually cannot migrate freely. When dissolved in water or molten, mobile ions can carry charge and conduct electricity. Connecting crystal structure to conductivity helps distinguish sodium metal, Na⁺, and sodium chloride.",
      ],
      highlights: ["Na⁺ and Cl⁻", "ionic crystal", "simplest ratio"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Ionic crystals and chemical bonding" },
    },
    "b-na-oxygen-contrast": {
      title: "Sodium and oxygen: conditions change the product",
      summary: "A sodium surface can form sodium oxide in air at room temperature; burning heated sodium can produce pale-yellow sodium peroxide.",
      paragraphs: [
        "A freshly exposed sodium surface is metallic and lustrous, but it soon darkens. At room temperature, the surface can form Na₂O, in which oxygen usually has oxidation state −2.",
        "When heated, sodium first melts and then reacts vigorously with oxygen; the product can be pale-yellow Na₂O₂, in which oxygen has oxidation state −1. Conditions change the main product, so the formulas of the two oxides must not be confused.",
      ],
      highlights: ["Na₂O at room temperature", "Na₂O₂ on heating", "oxidation state of oxygen"],
      curriculum: { volume: "Compulsory 1", chapter: "Sodium and its compounds" },
    },
    "b-na-peroxide-conversion": {
      title: "Sodium peroxide reacting with water and carbon dioxide",
      summary: "Na₂O₂ produces oxygen with both water and CO₂; the sodium-containing products are NaOH and Na₂CO₃, respectively.",
      paragraphs: [
        "Sodium peroxide reacts with water: 2Na₂O₂ + 2H₂O → 4NaOH + O₂↑. Water participates in the reaction, which produces an alkaline solution and oxygen; Na₂O₂ should not be treated simply as an ordinary basic oxide.",
        "It also reacts with carbon dioxide: 2Na₂O₂ + 2CO₂ → 2Na₂CO₃ + O₂. Both reactions produce oxygen, which is why sodium peroxide can be used in breathing apparatus.",
      ],
      highlights: ["sodium peroxide", "oxygen production", "NaOH and Na₂CO₃"],
      curriculum: { volume: "Compulsory 1", chapter: "Transformations of sodium peroxide" },
    },
    "b-na-water-redox": {
      title: "Sodium and water: equation and electron transfer",
      summary: "2Na + 2H₂O → 2NaOH + H₂↑; sodium loses electrons and some hydrogen in water is reduced.",
      paragraphs: [
        "Sodium reacts with water according to 2Na + 2H₂O → 2NaOH + H₂↑. The sodium hydroxide makes the resulting solution alkaline, hydrogen gas escapes, and the reaction releases heat.",
        "In redox terms, Na changes from oxidation state 0 to +1 and acts as the reducing agent; some hydrogen in water changes from +1 to 0. The hydrogen gas comes from water. Sodium metal and Na⁺ are different particles.",
      ],
      highlights: ["sodium loses electrons", "H₂ comes from water", "alkaline product"],
      curriculum: { volume: "Compulsory 1", chapter: "Sodium reacting with water" },
    },
    "c-i-triiodide": {
      title: "Equilibrium between iodine and iodide ions",
      summary: "In aqueous solution, I₂ can combine with I⁻ to form I₃⁻.",
      paragraphs: [
        "The equilibrium I₂ + I⁻ ⇌ I₃⁻ occurs in aqueous solution. When more I⁻ is present, more I₂ remains in the aqueous phase as I₃⁻, and the purple color of an iodine-containing organic phase can become paler.",
        "I₂, I⁻, and I₃⁻ are distinct particles and should not be written interchangeably. Equations for halogen displacement should still specify the particles involved in the actual reaction.",
      ],
      highlights: ["I₂ + I⁻ ⇌ I₃⁻", "distribution between phases"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Molecular structure and properties of substances" },
    },
    "c-iodine-starch": {
      title: "The color reaction between iodine and starch",
      summary: "An aqueous solution containing iodine and iodide turns deep blue with starch, helping indicate the presence of iodine.",
      paragraphs: [
        "Adding starch to an aqueous solution containing I₂ and I⁻ can produce a deep-blue color; I⁻ alone does not give this color with starch. If a halogen-displacement reaction produces I₂, this observation can help detect it.",
        "The color also depends on concentration and other substances in the sample. Color alone cannot establish that a particular displacement reaction occurred.",
      ],
      highlights: ["iodine–iodide–starch", "deep blue"],
      curriculum: { volume: "Compulsory 1", chapter: "Observations in halogen displacement reactions" },
    },
    "c-mn-oxidation-states": {
      title: "Oxidation states of manganese in different substances",
      summary: "Manganese is +4 in MnO₂ and +7 in KMnO₄.",
      paragraphs: [
        "In MnO₂, each oxygen is −2, so electrical neutrality requires manganese to be +4. In KMnO₄, K is +1 and the four oxygen atoms total −8, so manganese is +7. Oxidation state is a stoichiometric assignment for a compound; manganese does not have only one fixed oxidation state.",
        "MnO₂ can catalyze the decomposition of hydrogen peroxide, whereas KMnO₄ itself decomposes on heating and produces oxygen. The fact that both contain manganese does not mean they play the same role in a reaction.",
      ],
      highlights: ["Mn(IV)", "Mn(VII)"],
      curriculum: { volume: "Compulsory 1", chapter: "Redox reactions and oxidation states" },
    },
    "c-mn-zinc-dry-cell": {
      title: "Redox in a zinc–manganese dry cell",
      summary: "In common zinc–manganese dry cells, zinc loses electrons and manganese dioxide participates in the electron-gain process.",
      paragraphs: [
        "In a common zinc–manganese dry cell, zinc is used at the negative electrode and changes from oxidation state 0 to +2 as it loses electrons. MnO₂ is part of the positive-electrode system and participates in the electron-gain process while the cell operates.",
        "The role of MnO₂ here differs from its role as a catalyst for hydrogen peroxide decomposition. The electrolyte and overall reaction can vary among zinc–manganese cells, but zinc is oxidized and reduction occurs at the positive electrode.",
      ],
      highlights: ["zinc loses electrons", "MnO₂ participates in reduction"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Chemical power sources" },
    },
    "c-zn-acid-redox": {
      title: "Electron transfer when zinc reacts with hydrochloric acid",
      summary: "Zinc reacts with hydrochloric acid to form ZnCl₂ and H₂; Zn changes from 0 to +2.",
      paragraphs: [
        "When zinc reacts with dilute hydrochloric acid, 1 mol Zn consumes 2 mol HCl and forms 1 mol ZnCl₂ and 1 mol H₂. Zn loses electrons to become Zn²⁺, while H⁺ gains electrons to form H₂; Cl⁻ is unchanged in the net ionic equation.",
        "This is both a metal-displacement reaction and a redox reaction. A conclusion about dilute hydrochloric acid cannot be extended directly to every acid or concentration.",
      ],
      highlights: ["Zn²⁺", "H₂"],
      curriculum: { volume: "Compulsory 1", chapter: "Redox and the activity of metals" },
    },
    "c-zn-copper-cell": {
      title: "The roles of zinc and copper ions in a galvanic cell",
      summary: "Zinc can be the electrode that loses electrons, while Cu²⁺ gains electrons at the other electrode to form copper.",
      paragraphs: [
        "In a galvanic cell made from Zn/Zn²⁺ and Cu²⁺/Cu half-cells, zinc undergoes Zn → Zn²⁺ + 2e⁻ at one electrode, while copper ions undergo Cu²⁺ + 2e⁻ → Cu at the other. Electrons pass through the external circuit between the half-reactions.",
        "A salt bridge or other ion pathway maintains charge balance in the solutions. Simply placing zinc and copper strips in an unsuitable system does not guarantee that this complete cell reaction will occur.",
      ],
      highlights: ["oxidation at the negative electrode", "reduction at the positive electrode"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "How a galvanic cell works" },
    },
    "i-natural-forms": {
      title: "Iodine-containing does not mean elemental iodine",
      summary: "Iodine can occur in combined forms in nature; an iodine-containing material does not necessarily contain pure elemental iodine.",
      paragraphs: [
        "Iodine also occurs in combined forms in nature, such as iodide ions in seawater and iodates in minerals. These examples are not a complete list of all iodine-containing substances in seawater.",
      ],
      highlights: ["combined forms", "elemental iodine"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: iodine does not always occur as an element" },
    },
    "i-solid-sublimation": {
      title: "Iodine crystals sublime when heated",
      summary: "Elemental iodine is a lustrous, dark crystal that can sublime to purple vapor when heated.",
      paragraphs: [
        "Common elemental iodine consists of I₂ molecules, each containing two iodine atoms.",
        "Sublimation is the direct change from solid to gas. Purple iodine vapor is still elemental iodine; it is not a different element.",
      ],
      highlights: ["I₂", "sublimation", "purple vapor"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: iodine crystals and vapor" },
    },
    "i-symbol": {
      title: "What does I represent?",
      summary: "I is the chemical symbol for iodine and, in a microscopic context, can represent one iodine atom.",
      paragraphs: [
        "I is the chemical symbol for iodine. It represents the element, not a particular iodine-containing compound.",
        "A one-letter element symbol is capitalized.",
      ],
      highlights: ["I", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does I represent?" },
    },
    "k-permanganate-composition": {
      title: "Potassium in potassium permanganate",
      summary: "Potassium permanganate, KMnO₄, contains potassium, manganese, and oxygen and is a compound.",
      paragraphs: [
        "A chemical formula shows which elements a substance contains; containing potassium does not mean that the substance contains potassium metal.",
        "The textbook classifies potassium permanganate as a compound. It contains oxygen but has more than two elements, so it does not meet the definition of an oxide.",
      ],
      highlights: ["KMnO₄", "three elements"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Potassium in potassium permanganate" },
    },
    "k-symbol": {
      title: "What does K represent?",
      summary: "K is the chemical symbol for potassium and, in a microscopic context, can represent one potassium atom.",
      paragraphs: [
        "K represents potassium and, in a microscopic context, one potassium atom. It does not represent a particular potassium compound. A one-letter element symbol is capitalized.",
      ],
      highlights: ["K", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does K represent?" },
    },
    "li-atom-shells": {
      title: "Reading the shell diagram of a lithium atom",
      summary: "A neutral lithium atom has three electrons, arranged by shell as 2, 1.",
      paragraphs: [
        "A neutral lithium atom has nuclear charge +3 and three electrons, distributed across its shells as 2 and 1 from the innermost outward. It has atomic number 3 and three protons; this electron arrangement should not be applied directly to its ions.",
      ],
      highlights: ["atomic number 3", "one outer-shell electron"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a lithium atom" },
    },
    "li-battery-alloy-uses": {
      title: "Lithium in batteries and alloys",
      summary: "Lithium is used in rechargeable batteries and can also form lightweight alloys with aluminum or magnesium.",
      paragraphs: [
        "A rechargeable battery is a device, while a lightweight alloy is a material; the lithium in a particular product is not necessarily elemental lithium. Lithium metal and various lithium compounds have different uses. When discussing “lithium use,” distinguish the element, the elemental substance, compounds, and devices.",
      ],
      highlights: ["rechargeable batteries", "lightweight alloys"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: lithium in batteries and alloys" },
    },
    "li-symbol": {
      title: "What does Li represent?",
      summary: "Li is the chemical symbol for lithium and, in a microscopic context, can represent one lithium atom.",
      paragraphs: [
        "Li represents lithium and, in a microscopic context, one lithium atom. It does not represent a particular lithium compound. In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Li", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Li represent?" },
    },
    "mg-atom-shells": {
      title: "Reading the shell diagram of a magnesium atom",
      summary: "A neutral magnesium atom has 12 electrons, arranged by shell as 2, 8, 2.",
      paragraphs: [
        "A neutral magnesium atom has nuclear charge +12 and 12 electrons, distributed across its shells as 2, 8, and 2 from the innermost outward. It has atomic number 12 and 12 protons; this electron arrangement should not be applied directly to its ions.",
      ],
      highlights: ["atomic number 12", "two outer-shell electrons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a magnesium atom" },
    },
    "mg-lightweight-alloys": {
      title: "Lightweight alloys containing magnesium",
      summary: "Magnesium has a relatively low density, and magnesium-containing alloys are used to reduce weight in products such as cars, cameras, and laptops.",
      paragraphs: [
        "Magnesium can be added to aluminum alloys to improve processing and mechanical properties. Lightweight magnesium-containing materials are used in products such as cars, cameras, and laptops.",
        "An alloy contains multiple components; a finished alloy should not be equated with pure magnesium metal.",
      ],
      highlights: ["relatively low density", "alloy"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: lightweight magnesium alloys" },
    },
    "mg-oxygen-reaction": {
      title: "Magnesium reacts with oxygen to form magnesium oxide",
      summary: "When ignited, magnesium reacts with oxygen to form magnesium oxide.",
      paragraphs: [
        "When ignited, the equation can be balanced by conserving atoms: 2Mg + O₂ → 2MgO. Magnesium metal and the magnesium oxide product are different substances; the numbers of magnesium and oxygen atoms are each equal on both sides.",
      ],
      highlights: ["ignition", "magnesium oxide"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Magnesium reacts with oxygen to form magnesium oxide" },
    },
    "mg-symbol": {
      title: "What does Mg represent?",
      summary: "Mg is the chemical symbol for magnesium and, in a microscopic context, can represent one magnesium atom.",
      paragraphs: [
        "Mg represents magnesium and, in a microscopic context, one magnesium atom. It does not represent a particular magnesium compound. In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Mg", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Mg represent?" },
    },
    "mn-steel-alloy-use": {
      title: "Manganese in steel and other alloys",
      summary: "Metallic manganese is brittle and is commonly used as a component in steel and other alloys.",
      paragraphs: [
        "Manganese can affect the strength, workability, and wear resistance of steel. The material's uses depend on the particular alloy composition.",
        "Manganese metal and manganese dioxide are different substances. MnO₂ can act as a catalyst, but this does not mean that manganese metal has the same role in every related reaction.",
      ],
      highlights: ["manganese metal", "alloy"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: manganese in alloys" },
    },
    "mn-symbol": {
      title: "What does Mn represent?",
      summary: "Mn is the chemical symbol for manganese and, in a microscopic context, can represent one manganese atom.",
      paragraphs: [
        "Mn is the chemical symbol for manganese. It represents the element, not a particular manganese-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Mn", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Mn represent?" },
    },
    "n-ammonia-water": {
      title: "The weakly basic nature of ammonia water",
      summary: "Ammonia dissolves in water to form ammonia monohydrate, only a small fraction of which ionizes.",
      paragraphs: [
        "Ammonia gas is highly soluble in water and combines with water to form NH₃·H₂O. Only a small fraction of ammonia monohydrate ionizes to produce NH₄⁺ and OH⁻, so ammonia water is weakly basic.",
        "Ammonia reacts with hydrogen chloride to form ammonium chloride crystals: NH₃ + HCl = NH₄Cl. This forms an ammonium salt; ammonia, NH₃, and the ammonium ion, NH₄⁺, are not the same particle.",
      ],
      highlights: ["ammonia monohydrate", "ammonium ion"],
      curriculum: { volume: "Compulsory 2", chapter: "The weakly basic nature of ammonia water" },
    },
    "n-ammonium-test": {
      title: "Testing for ammonium ions",
      summary: "Ammonium salts release ammonia when heated with a strong base; this is the basis for testing NH₄⁺.",
      paragraphs: [
        "When heated, NH₄⁺ reacts with OH⁻ to form NH₃ and H₂O. In an experiment, moist red litmus paper turning blue can indicate that the released alkaline gas is ammonia.",
        "To test for ammonium, connect the reaction conditions, the gas produced, and the litmus-paper observation. An alkaline solution or bubbles alone are not enough to conclude directly that ammonium ions are present.",
      ],
      highlights: ["NH₄⁺", "moist red litmus paper"],
      curriculum: { volume: "Compulsory 2", chapter: "Testing for ammonium ions" },
    },
    "n-atom-shells": {
      title: "Reading the shell diagram of a nitrogen atom",
      summary: "A neutral nitrogen atom has seven electrons, arranged by shell as 2, 5.",
      paragraphs: [
        "In the shell diagram of a nitrogen atom, the nuclear charge is +7 and the shells contain 2 and 5 electrons from the innermost outward. A neutral nitrogen atom has the same total number of electrons and protons.",
        "Nitrogen has atomic number 7 and, in this shell model, five outer-shell electrons. For an ion, its electron count cannot be copied from that of the neutral atom.",
      ],
      highlights: ["atomic number 7", "outer shell", "five electrons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a nitrogen atom" },
    },
    "n-haber-control": {
      title: "Choosing conditions for ammonia synthesis",
      summary: "Ammonia synthesis requires a balance among reaction rate, equilibrium, and production cost.",
      paragraphs: [
        "Ammonia synthesis is the exothermic reversible reaction of nitrogen and hydrogen in a 1:3 ratio. There are fewer gas molecules on the product side, so higher pressure favors equilibrium in the direction of ammonia formation.",
        "A catalyst helps the system reach equilibrium faster but does not change the equilibrium composition. Industrial conditions must also balance temperature, pressure, equipment, and cost; choosing an extreme value for only one factor is not sufficient.",
      ],
      highlights: ["chemical equilibrium", "condition optimization"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Choosing conditions for ammonia synthesis" },
    },
    "n-haber-equilibrium": {
      title: "Balancing conditions for ammonia synthesis",
      summary: "N₂ + 3H₂ ⇌ 2NH₃ is an exothermic reversible reaction; industrial production must balance equilibrium and rate.",
      paragraphs: [
        "The reaction is exothermic. Higher pressure favors equilibrium in the direction of ammonia formation, but the reaction rate is slow at low temperature.",
        "Industrial ammonia synthesis commonly uses about 400–500°C, 150–250 atm, and a catalyst. An iron catalyst increases the reaction rate.",
      ],
      highlights: ["reversible reaction", "equilibrium and rate"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: compromise conditions for ammonia synthesis" },
    },
    "n-molecule-ammonia": {
      title: "Nitrogen gas and ammonia are different substances",
      summary: "Nitrogen gas, N₂, is an element; ammonia, NH₃, is a compound of nitrogen and hydrogen.",
      paragraphs: [
        "An ammonia molecule contains one nitrogen atom and three hydrogen atoms; nitrogen gas contains only nitrogen.",
        "Ammonia contains the element nitrogen, but that does not mean that nitrogen gas is mixed into the ammonia. When comparing substances, distinguish elemental composition from the identity of the substances themselves.",
      ],
      highlights: ["N₂", "NH₃", "element"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Nitrogen gas and ammonia are different substances" },
    },
    "n-nitric-acid": {
      title: "The oxidizing properties of nitric acid",
      summary: "Nitric acid is acidic and a strong oxidizing agent; the products of its reactions depend on concentration.",
      paragraphs: [
        "Nitric acid is a nitrogen-containing acid. Concentrated nitric acid decomposes in light or when heated, so it is usually stored in a brown reagent bottle. Because it is an oxidizing agent, its reactions with metals do not necessarily produce hydrogen gas.",
        "The concentration of nitric acid affects the products formed when it reacts with a metal. The concentration and reaction conditions must be stated when predicting products; the simple pattern “metal + acid → salt + H₂” cannot always be applied.",
      ],
      highlights: ["oxidizing properties", "concentration affects products"],
      curriculum: { volume: "Compulsory 2", chapter: "The oxidizing properties of nitric acid" },
    },
    "n-nitrogen-fixation": {
      title: "Nitrogen fixation and the nitrogen cycle",
      summary: "Nitrogen fixation converts atmospheric nitrogen into nitrogen-containing compounds that can be used by organisms.",
      paragraphs: [
        "In nature, lightning and certain microorganisms can promote the conversion of nitrogen gas. Artificial nitrogen fixation converts nitrogen gas into compounds through controlled oxidation or reduction.",
        "Ammonia synthesis is an important artificial nitrogen-fixation route. Ammonia can then be used to make fertilizers and other products, moving nitrogen from the air into soil and living organisms.",
      ],
      highlights: ["natural nitrogen fixation", "artificial nitrogen fixation"],
      curriculum: { volume: "Compulsory 2", chapter: "Nitrogen fixation and the nitrogen cycle" },
    },
    "n-nitrogen-oxides": {
      title: "Conversion between NO and NO₂",
      summary: "Nitric oxide can be oxidized by oxygen to form nitrogen dioxide.",
      paragraphs: [
        "NO is a colorless gas that readily reacts with oxygen at room temperature: 2NO + O₂ = 2NO₂. NO₂ is a reddish-brown gas, and its color can help identify this change.",
        "NO₂ dissolves in water to form nitric acid and NO: 3NO₂ + H₂O = 2HNO₃ + NO. These nitrogen oxides have different compositions and properties.",
      ],
      highlights: ["NO", "NO₂", "nitric acid"],
      curriculum: { volume: "Compulsory 2", chapter: "Conversion between NO and NO₂" },
    },
    "n-protective-atmosphere": {
      title: "Why nitrogen can be used as a protective gas",
      summary: "The textbook connects nitrogen's relative chemical inertness with its use as a protective gas and in food packaging.",
      paragraphs: [
        "“Inert” means relatively unreactive under the conditions being discussed; it does not mean that nitrogen cannot react under any conditions.",
        "Nitrogen is relatively stable, so it can be used as a protective gas and for nitrogen-flushed food packaging.",
      ],
      highlights: ["relatively unreactive", "protective gas"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Why nitrogen can be used as a protective gas" },
    },
    "n-symbol": {
      title: "What does N represent?",
      summary: "N is the chemical symbol for nitrogen and, in a microscopic context, can represent one nitrogen atom.",
      paragraphs: [
        "N is the chemical symbol for nitrogen and, in a microscopic context, can represent one nitrogen atom; it is not the formula of a nitrogen-containing compound.",
        "A one-letter element symbol is capitalized.",
      ],
      highlights: ["N", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does N represent?" },
    },
    "n-triple-bond": {
      title: "The triple bond in nitrogen gas",
      summary: "The two nitrogen atoms in a nitrogen molecule are joined by a covalent triple bond.",
      paragraphs: [
        "Nitrogen in air is mainly present as N₂. The N≡N bond within a molecule is strong and requires substantial energy to break, so nitrogen gas is relatively stable at room temperature.",
        "Stable does not mean unreactive under all conditions. Nitrogen can be transformed at high temperature or in an electrical discharge; industrial ammonia synthesis also uses a reaction between nitrogen and hydrogen under selected conditions.",
      ],
      highlights: ["N≡N", "stability"],
      curriculum: { volume: "Compulsory 2", chapter: "The triple bond in nitrogen gas" },
    },
    "na-atom-shells": {
      title: "Reading the shell diagram of a sodium atom",
      summary: "A neutral sodium atom has 11 electrons, arranged by shell as 2, 8, 1.",
      paragraphs: [
        "A neutral sodium atom has nuclear charge +11 and 11 electrons, distributed across its shells as 2, 8, and 1 from the innermost outward. It has atomic number 11 and 11 protons; this electron arrangement should not be applied directly to its ions.",
      ],
      highlights: ["atomic number 11", "one outer-shell electron"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a sodium atom" },
    },
    "na-salts-uses": {
      title: "Sodium salts and sodium metal have different uses",
      summary: "Sodium chloride is a chemical-industry feedstock, and sodium carbonate can soften water; these are uses of particular sodium salts.",
      paragraphs: [
        "Sodium chloride and sodium carbonate are compounds of sodium. Their uses cannot be directly attributed to sodium metal.",
      ],
      highlights: ["sodium salts", "sodium metal"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: sodium salts and sodium metal have different uses" },
    },
    "na-symbol": {
      title: "What does Na represent?",
      summary: "Na is the chemical symbol for sodium and, in a microscopic context, can represent one sodium atom.",
      paragraphs: [
        "Na represents sodium and, in a microscopic context, one sodium atom. It does not represent a particular sodium compound. In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Na", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Na represent?" },
    },
    "o-acidic-oxides": {
      title: "Acidic oxides",
      summary: "Oxides such as SO₂ can react with water to form the corresponding oxyacids.",
      paragraphs: [
        "SO₂ is an acidic oxide. In water it reversibly forms H₂SO₃. This process involves both gas dissolution and a chemical reaction.",
        "Acidic oxides are identified by their chemical properties, not simply by checking whether their formulas contain oxygen.",
      ],
      highlights: ["acidic oxide", "reversibly"],
      curriculum: { volume: "Compulsory 2", chapter: "Acidic oxides" },
    },
    "o-atom-shells": {
      title: "Reading the shell diagram of an oxygen atom",
      summary: "A neutral oxygen atom has eight electrons, arranged by shell as 2, 6.",
      paragraphs: [
        "In the shell diagram of an oxygen atom, the nuclear charge is +8 and the shells contain 2 and 6 electrons from the innermost outward. A neutral oxygen atom has the same total number of electrons and protons.",
        "Oxygen has atomic number 8 and, in this shell model, six outer-shell electrons. For an ion, its electron count cannot be copied from that of the neutral atom.",
      ],
      highlights: ["atomic number 8", "outer shell", "six electrons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of an oxygen atom" },
    },
    "o-ice-hydrogen-bond": {
      title: "Hydrogen-bond structure in ice",
      summary: "Hydrogen bonds connect water molecules in ice in a relatively open arrangement.",
      paragraphs: [
        "Water molecules in ice form a directional arrangement through hydrogen bonds, leaving relatively large spaces. This is why ice is less dense than liquid water.",
        "When ice melts, part of this structure breaks down and the spaces between molecules become smaller. Hydrogen bonds are intermolecular forces; they should not be confused with the O—H covalent bonds within a water molecule.",
      ],
      highlights: ["hydrogen bonds", "density of ice"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Hydrogen-bond structure in ice" },
    },
    "o-molecule": {
      title: "Oxygen atoms and oxygen molecules",
      summary: "One oxygen molecule, O₂, consists of two oxygen atoms.",
      paragraphs: [
        "O is an element symbol and can represent one oxygen atom in a microscopic context; O₂ represents oxygen gas and its molecular composition.",
        "Oxygen gas is an element. Water also contains oxygen, but water is not oxygen gas.",
      ],
      highlights: ["O", "O₂"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Oxygen atoms and oxygen molecules" },
    },
    "o-oxide-classification": {
      title: "Is every oxygen-containing compound an oxide?",
      summary: "An oxide contains exactly two elements, one of which is oxygen.",
      paragraphs: [
        "Water, H₂O, and carbon dioxide, CO₂, are oxides. To classify a substance, first establish that it is a pure compound, then check the number of elements and whether one is oxygen.",
        "Potassium permanganate contains potassium, manganese, and oxygen. Although it contains oxygen, it does not meet the definition of an oxide, which contains only two elements.",
      ],
      highlights: ["two elements", "contains oxygen"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Is every oxygen-containing compound an oxide?" },
    },
    "o-sulfur-oxidation": {
      title: "Oxygen participates in the oxidation of sulfur",
      summary: "Burning sulfur in oxygen forms sulfur dioxide, which can be oxidized further.",
      paragraphs: [
        "Sulfur reacts with oxygen to form SO₂, in which sulfur has oxidation state +4. Sulfur changes oxidation state during the reaction, and oxygen acts as the oxidizing agent.",
        "Under suitable temperature and catalyst conditions, SO₂ can react reversibly with oxygen to form SO₃. This second step is not the direct combustion of elemental sulfur; the two transformations should be distinguished.",
      ],
      highlights: ["oxidizing agent", "SO₂ → SO₃"],
      curriculum: { volume: "Compulsory 2", chapter: "Oxygen participates in the oxidation of sulfur" },
    },
    "o-supports-combustion": {
      title: "Supporting combustion is not the same as being combustible",
      summary: "Oxygen relights a glowing splint, showing that it supports combustion.",
      paragraphs: [
        "Oxygen participates in the combustion of other substances, but oxygen itself is not a fuel.",
        "The reactions of charcoal, sulfur, and iron in air and in oxygen can be compared to illustrate what “supporting combustion” means in practice.",
      ],
      highlights: ["supports combustion"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Supporting combustion is not the same as being combustible" },
    },
    "o-symbol": {
      title: "What does O represent?",
      summary: "O is the chemical symbol for oxygen and, in a microscopic context, can represent one oxygen atom.",
      paragraphs: [
        "O is the chemical symbol for oxygen and, in a microscopic context, can represent one oxygen atom; it is not the formula of an oxygen-containing compound.",
        "A one-letter element symbol is capitalized.",
      ],
      highlights: ["O", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does O represent?" },
    },
    "o-water-electrolysis-selective": {
      title: "Water decomposition in an electrolytic cell",
      summary: "Electrolysis converts electrical energy into chemical energy as water forms hydrogen and oxygen.",
      paragraphs: [
        "In an electrolytic cell, an external direct-current source can drive water decomposition. The overall stoichiometric ratio is two parts water to two parts hydrogen and one part oxygen; the reaction requires an electric current.",
        "An experiment on the composition of water focuses on identifying the overall products. Electrochemistry also distinguishes reduction at the cathode from oxidation at the anode. These are two ways of discussing the same decomposition of water.",
      ],
      highlights: ["electrolytic cell", "electric current"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Water decomposition in an electrolytic cell" },
    },
    "p-atom-shells": {
      title: "Reading the shell diagram of a phosphorus atom",
      summary: "A neutral phosphorus atom has 15 electrons, arranged by shell as 2, 8, 5.",
      paragraphs: [
        "A neutral phosphorus atom has nuclear charge +15 and 15 electrons, distributed across its shells as 2, 8, and 5 from the innermost outward. It has atomic number 15 and 15 protons; this electron arrangement should not be applied directly to its ions.",
      ],
      highlights: ["atomic number 15", "five outer-shell electrons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a phosphorus atom" },
    },
    "p-nucleotide-phosphate": {
      title: "Phosphate in nucleotides",
      summary: "Nucleic acids are made of nucleotides, and nucleotide hydrolysis can yield phosphate.",
      paragraphs: [
        "DNA and RNA are nucleic acids. The textbook describes nucleic acids as polymers made from nucleotide units; further hydrolysis of nucleotides can yield phosphate and a nucleoside.",
        "This shows that phosphorus occurs not only in minerals and fertilizers but also in the molecular structure of genetic material. It does not follow that all phosphorus-containing substances have the same biological role.",
      ],
      highlights: ["nucleotide", "phosphate"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Phosphate in nucleotides" },
    },
    "p-oxygen-reaction": {
      title: "Stoichiometry of phosphorus reacting with oxygen",
      summary: "When ignited, red phosphorus reacts with oxygen according to the balanced equation 4P + 5O₂ → 2P₂O₅.",
      paragraphs: [
        "The total numbers of phosphorus and oxygen atoms are each equal on both sides of the equation; this is the basis for balancing it. P₂O₅ is a stoichiometric formula here and does not establish the structure of an individual molecule of a phosphorus oxide.",
      ],
      highlights: ["balancing equations", "P₂O₅"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Stoichiometry of phosphorus reacting with oxygen" },
    },
    "p-phosphate-biomolecules": {
      title: "Phosphorus in biological molecules",
      summary: "Phosphorus is part of the sugar–phosphate backbone of DNA and RNA and also occurs in molecules such as ATP.",
      paragraphs: [
        "Phosphorus in these molecules is chemically combined; it is not present as red or white elemental phosphorus. When the same element is part of different compounds, the properties of elemental phosphorus do not apply. Molecular composition alone also cannot establish nutritional or medical effects.",
      ],
      highlights: ["sugar–phosphate backbone", "chemically combined"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: phosphorus in biological molecules" },
    },
    "p-phosphorus-oxides": {
      title: "Two molecular oxides of phosphorus",
      summary: "P₄O₆ and P₄O₁₀ are molecular oxides containing phosphorus and oxygen.",
      paragraphs: [
        "The textbook lists P₄O₆ and P₄O₁₀ as nonmetal oxides with molecular crystal structures. The formulas contain different numbers of oxygen atoms, showing that the same two elements can form different compounds.",
        "Taking oxygen as usually −2, the average oxidation state of phosphorus is +3 in P₄O₆ and +5 in P₄O₁₀. These values are calculated from the formulas; they do not mean that the substances can interconvert under arbitrary conditions.",
      ],
      highlights: ["P₄O₆", "P₄O₁₀"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Two molecular oxides of phosphorus" },
    },
    "p-symbol": {
      title: "What does P represent?",
      summary: "P is the chemical symbol for phosphorus and, in a microscopic context, can represent one phosphorus atom.",
      paragraphs: [
        "P represents phosphorus and, in a microscopic context, one phosphorus atom. It does not represent a particular phosphorus compound. A one-letter element symbol is capitalized.",
      ],
      highlights: ["P", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does P represent?" },
    },
    "p-white-phosphorus-crystal": {
      title: "The molecular crystal of white phosphorus",
      summary: "White phosphorus consists of P₄ molecules and forms a molecular crystal.",
      paragraphs: [
        "P₄ molecules can be identified in solid white phosphorus; intermolecular forces hold neighboring molecules together. The textbook lists white phosphorus alongside O₂, N₂, and S₈ as examples of molecular crystals.",
        "When the crystal melts, the arrangement and interactions between molecules mainly change; this does not mean that every P₄ molecule breaks apart into phosphorus atoms. Molecular structure and crystal structure are different levels of description.",
      ],
      highlights: ["P₄", "molecular crystal"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "The molecular crystal of white phosphorus" },
    },
    "permanganate-decomposition": {
      title: "Where the elements go when potassium permanganate decomposes",
      summary: "Heating potassium permanganate produces K₂MnO₄, MnO₂, and O₂.",
      paragraphs: [
        "On heating, 2KMnO₄ → K₂MnO₄ + MnO₂ + O₂↑. Potassium, manganese, and oxygen are distributed among different products, while the total number of atoms of each element is conserved. This is thermal decomposition of potassium permanganate and should not be confused with its separate reaction with hydrogen peroxide.",
      ],
      highlights: ["heating", "O₂↑"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Where the elements go when potassium permanganate decomposes" },
    },
    "s-atom-shells": {
      title: "Reading the shell diagram of a sulfur atom",
      summary: "A neutral sulfur atom has 16 electrons, arranged by shell as 2, 8, 6.",
      paragraphs: [
        "In the shell diagram of a sulfur atom, the nuclear charge is +16 and the shells contain 2, 8, and 6 electrons from the innermost outward. A neutral sulfur atom has the same total number of electrons and protons.",
        "Sulfur has atomic number 16 and, in this shell model, six outer-shell electrons. For an ion, its electron count cannot be copied from that of the neutral atom.",
      ],
      highlights: ["atomic number 16", "outer shell", "six electrons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a sulfur atom" },
    },
    "s-dioxide-redox": {
      title: "Oxidizing and reducing properties of SO₂",
      summary: "Sulfur is +4 in SO₂ and can either increase or decrease its oxidation state.",
      paragraphs: [
        "With a suitable temperature and catalyst, oxygen can oxidize SO₂ to SO₃. Sulfur changes from +4 to +6, so SO₂ acts as a reducing agent.",
        "SO₂ can also react with H₂S to form sulfur and water. In this reaction, sulfur in SO₂ changes from +4 to 0, so SO₂ acts as an oxidizing agent. A substance's oxidizing or reducing behavior must be considered in the context of a particular reaction.",
      ],
      highlights: ["+4", "oxidizing behavior", "reducing behavior"],
      curriculum: { volume: "Compulsory 2", chapter: "Oxidizing and reducing properties of SO₂" },
    },
    "s-eight-atom-molecule": {
      title: "S₈ molecules in common elemental sulfur",
      summary: "Common elemental sulfur consists of S₈ molecules, each containing eight sulfur atoms.",
      paragraphs: [
        "The subscript 8 in S₈ indicates eight sulfur atoms in one molecule. In a microscopic description, S and S₈ are not interchangeable particles.",
        "This molecular composition describes common elemental sulfur. It should not be generalized to mean that sulfur exists only as S₈ at every temperature and in every physical form.",
      ],
      highlights: ["S₈", "eight sulfur atoms"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: S₈ molecules in common sulfur" },
    },
    "s-oxygen-reaction": {
      title: "Sulfur reacts with oxygen to form sulfur dioxide",
      summary: "The textbook uses the combustion of sulfur in oxygen to form sulfur dioxide as an example of chemical transformation.",
      paragraphs: [
        "When ignited, elemental sulfur, S, reacts with O₂ in a 1:1 ratio to form SO₂.",
        "S is stoichiometric notation in the reaction equation; it does not mean that an elemental sulfur molecule has only one atom. SO₂ is an irritant gas.",
      ],
      highlights: ["SO₂", "ignition"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Sulfur reacts with oxygen to form sulfur dioxide" },
    },
    "s-sulfates": {
      title: "Common sulfate salts",
      summary: "Gypsum and copper sulfate illustrate different properties and uses of sulfate salts.",
      paragraphs: [
        "Gypsum is CaSO₄·2H₂O. Heating it produces plaster of Paris, which sets again when mixed with water. Sulfates are not just “products of sulfuric acid and metals”; they are also common materials and analytical reagents.",
        "CuSO₄ and BaSO₄ are also sulfates, but they differ in solubility and use. Sharing the SO₄²⁻ ion does not imply that all sulfates have the same properties.",
      ],
      highlights: ["gypsum", "SO₄²⁻"],
      curriculum: { volume: "Compulsory 2", chapter: "Common sulfate salts" },
    },
    "s-sulfur-cycle": {
      title: "Sulfur oxidation and acid rain",
      summary: "SO₂ from sulfur-containing fuels and minerals can contribute to acid rain.",
      paragraphs: [
        "Coal, petroleum, and some metal ores contain sulfur. Combustion or smelting can produce SO₂, which undergoes further changes in the atmosphere and contributes to acid rain.",
        "Changes from elemental sulfur and sulfides to oxides and sulfates involve changes in oxidation state. Nitrogen oxides also contribute to acid rain, so it should not be attributed to a single gas alone.",
      ],
      highlights: ["SO₂", "acid rain"],
      curriculum: { volume: "Compulsory 2", chapter: "Sulfur oxidation and acid rain" },
    },
    "s-sulfur-dioxide-bleaching": {
      title: "The bleaching action of SO₂",
      summary: "SO₂ can form unstable, colorless substances with some colored materials.",
      paragraphs: [
        "SO₂ can temporarily bleach certain colored substances, such as magenta dye. Heating decomposes the colorless product and can restore the color. This should not be confused with oxidative bleaching by chlorine water.",
        "SO₂ has also been used to bleach pulp, wool, and silk; permitted amounts and uses are subject to regulations.",
      ],
      highlights: ["temporary bleaching", "color can return"],
      curriculum: { volume: "Compulsory 2", chapter: "The bleaching action of SO₂" },
    },
    "s-sulfur-dioxide-water": {
      title: "SO₂ and sulfurous acid",
      summary: "SO₂ dissolves in water and reversibly forms unstable sulfurous acid.",
      paragraphs: [
        "SO₂ + H₂O ⇌ H₂SO₃. Sulfurous acid forms and decomposes under the same conditions, so the reaction is reversible.",
        "SO₂ is an acidic oxide, and its aqueous solution is acidic. A gas dissolving in water can also undergo a chemical reaction.",
      ],
      highlights: ["SO₂", "sulfurous acid", "reversible reaction"],
      curriculum: { volume: "Compulsory 2", chapter: "SO₂ and sulfurous acid" },
    },
    "s-sulfuric-acid": {
      title: "Properties of concentrated sulfuric acid",
      summary: "Concentrated sulfuric acid is hygroscopic, dehydrating, and strongly oxidizing.",
      paragraphs: [
        "Sulfuric acid ionizes to release hydrogen ions and therefore shows acidic properties. Concentrated sulfuric acid also has strong hygroscopic and dehydrating properties; these should not be described as properties of all acids.",
        "When heated, concentrated sulfuric acid can oxidize copper, producing SO₂. This differs from the use of dilute sulfuric acid to produce hydrogen with a reactive metal; observations at the two concentrations should not be conflated.",
      ],
      highlights: ["hygroscopic", "dehydrating", "strongly oxidizing"],
      curriculum: { volume: "Compulsory 2", chapter: "Properties of concentrated sulfuric acid" },
    },
    "s-symbol": {
      title: "What does S represent?",
      summary: "S is the chemical symbol for sulfur and, in a microscopic context, can represent one sulfur atom.",
      paragraphs: [
        "S is the chemical symbol for sulfur and, in a microscopic context, can represent one sulfur atom; it is not the formula of a sulfur-containing compound.",
        "A one-letter element symbol is capitalized.",
      ],
      highlights: ["S", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does S represent?" },
    },
    "s-valence": {
      title: "Common oxidation states of sulfur",
      summary: "Sulfur commonly has oxidation states −2, +4, and +6 in different compounds.",
      paragraphs: [
        "Sulfur is in Period 3 and Group 6A, with six outer-shell electrons. It can form sulfides with sulfur at −2, and commonly occurs at +4 or +6 in oxygen-containing substances at Earth's surface.",
        "Comparing sulfur's oxidation states in H₂S, SO₂, and H₂SO₄ links sulfides, sulfur dioxide, and sulfuric acid. Oxidation state is a clue for analyzing redox; it does not mean that an isolated atom literally carries that charge.",
      ],
      highlights: ["−2", "+4", "+6"],
      curriculum: { volume: "Compulsory 2", chapter: "Common oxidation states of sulfur" },
    },
    "si-atom-shells": {
      title: "Reading the shell diagram of a silicon atom",
      summary: "A neutral silicon atom has 14 electrons, arranged by shell as 2, 8, 4.",
      paragraphs: [
        "A neutral silicon atom has nuclear charge +14 and 14 electrons, distributed across its shells as 2, 8, and 4 from the innermost outward. It has atomic number 14 and 14 protons; this electron arrangement should not be applied directly to its ions.",
      ],
      highlights: ["atomic number 14", "four outer-shell electrons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a silicon atom" },
    },
    "si-cement": {
      title: "Cement and concrete",
      summary: "Ordinary Portland cement is made by processing raw materials such as clay and limestone.",
      paragraphs: [
        "Ordinary Portland cement production involves mixing, grinding, and firing raw materials, then adding an appropriate amount of gypsum to regulate the setting rate. Cement itself and concrete are not the same material.",
        "Mixing cement with sand, crushed stone, and water produces concrete. Its properties result from the combined action of multiple components; one chemical formula cannot represent an entire piece of concrete.",
      ],
      highlights: ["cement", "concrete"],
      curriculum: { volume: "Compulsory 2", chapter: "Cement and concrete" },
    },
    "si-glass-ceramics": {
      title: "Ceramics and glass",
      summary: "Ceramics and ordinary glass are common silicon-containing inorganic nonmetallic materials.",
      paragraphs: [
        "Ceramics are made mainly from clay containing hydrated aluminum silicates and are produced by high-temperature firing. Ordinary glass can be made by melting raw materials such as soda ash, limestone, and quartz sand.",
        "The main components of ordinary glass include Na₂SiO₃, CaSiO₃, and SiO₂. Glass is a mixture, not a substance with one single “glass molecule.”",
      ],
      highlights: ["ceramics", "glass", "silicates"],
      curriculum: { volume: "Compulsory 2", chapter: "Ceramics and glass" },
    },
    "si-quartz-network": {
      title: "Quartz as a covalent network crystal",
      summary: "Silicon–oxygen tetrahedra connect throughout the extended covalent structure of quartz.",
      paragraphs: [
        "Silicon–oxygen tetrahedra in quartz share corners to form an extended structure. SiO₂ gives the ratio of silicon to oxygen atoms; it does not mean that quartz consists of separate SiO₂ molecules.",
        "SiO₂ is used in glass, optical fibers, and silicon-based optical materials. Additional processing is needed to make these products; a quartz crystal is not itself the finished product.",
      ],
      highlights: ["quartz", "covalent network crystal"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Quartz as a covalent network crystal" },
    },
    "si-semiconductor": {
      title: "High-purity silicon as a semiconductor",
      summary: "High-purity elemental silicon can be used as a semiconductor in computers and microelectronic devices.",
      paragraphs: [
        "Small amounts of other elements can be deliberately introduced to control electrical properties. “Doping” does not turn silicon into silicon dioxide.",
        "Elemental silicon must be distinguished from compounds containing silicon and oxygen. Silicon used in chips should not be equated directly with sand or glass.",
      ],
      highlights: ["high-purity silicon", "semiconductor"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: high-purity silicon and semiconductors" },
    },
    "si-silicate-acid-base": {
      title: "Acid–base transformations of SiO₂ and silicates",
      summary: "Under relatively harsh alkaline conditions, SiO₂ can form silicates; acidifying a silicate solution can produce silica gel.",
      paragraphs: [
        "SiO₂ is a covalent network solid and usually does not react directly with water. At high temperature with more concentrated NaOH, it can be converted to Na₂SiO₃ and water; the conditions cannot be omitted as though it dissolved immediately in cold water.",
        "Adding dilute hydrochloric acid to a dilute sodium silicate solution can form a hydrated silica gel. The gel is not a pure crystalline substance with one fixed formula, H₂SiO₃.",
      ],
      highlights: ["SiO₂", "sodium silicate", "silica gel"],
      curriculum: { volume: "Compulsory 2", chapter: "Acid–base transformations of SiO₂ and silicates" },
    },
    "si-silicate-tetrahedron": {
      title: "The silicon–oxygen tetrahedron",
      summary: "The tetrahedral unit formed by silicon and oxygen is a basic structural unit for understanding silicates.",
      paragraphs: [
        "In the silicate structures described in the textbook, one silicon atom sits at the center and four oxygen atoms occupy the vertices of a tetrahedron. Many such units can connect with one another.",
        "Silicon–oxygen tetrahedra help explain the varied compositions of materials such as ceramics and glass. This is a structural unit; it does not mean that all silicates share one molecular formula.",
      ],
      highlights: ["silicon–oxygen tetrahedron", "structural unit"],
      curriculum: { volume: "Compulsory 2", chapter: "The silicon–oxygen tetrahedron" },
    },
    "si-silicon-purification": {
      title: "From crude silicon to high-purity silicon",
      summary: "SiO₂ in quartz can be reduced and the silicon then purified to produce high-purity silicon.",
      paragraphs: [
        "Crude silicon can be produced industrially by reducing SiO₂ with carbon at about 1,800–2,000°C: one part SiO₂ reacts with two parts C to produce one part Si and two parts CO.",
        "Crude silicon must be purified further before it can be used in chips and similar applications. Quartz sand is not the same as single-crystal silicon, and a single high-temperature reduction step does not yield electronic-grade material.",
      ],
      highlights: ["carbon reduction of SiO₂", "purification"],
      curriculum: { volume: "Compulsory 2", chapter: "From crude silicon to high-purity silicon" },
    },
    "si-symbol": {
      title: "What does Si represent?",
      summary: "Si is the chemical symbol for silicon and, in a microscopic context, can represent one silicon atom.",
      paragraphs: [
        "Si represents silicon and, in a microscopic context, one silicon atom. It does not represent a particular silicon compound. In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Si", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Si represent?" },
    },
    "zn-copper-replacement": {
      title: "Zinc displaces copper from copper sulfate solution",
      summary: "Zinc reacts with aqueous copper sulfate to produce copper and zinc sulfate.",
      paragraphs: [
        "Zn(s) + CuSO₄(aq) → Cu(s) + ZnSO₄(aq), where aq indicates an aqueous solution.",
      ],
      highlights: ["copper displacement", "aq"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: zinc displaces copper" },
    },
    "zn-galvanised-material": {
      title: "The zinc coating and iron base in galvanized steel",
      summary: "Zinc is often applied as a coating to iron and other metals to reduce corrosion.",
      paragraphs: [
        "Galvanized steel is used in materials such as vehicle bodies, lamp posts, and guardrails. The zinc coating and the iron-based material beneath it have different compositions.",
        "A galvanized steel object is not made entirely of elemental zinc.",
      ],
      highlights: ["coating", "iron-based material"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: galvanized material is not a block of pure zinc" },
    },
    "zn-symbol": {
      title: "What does Zn represent?",
      summary: "Zn is the chemical symbol for zinc and, in a microscopic context, can represent one zinc atom.",
      paragraphs: [
        "Zn is the chemical symbol for zinc. It represents the element, not a particular zinc-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Zn", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Zn represent?" },
    },
    "air-composition": {
      title: "Air is not pure oxygen",
      summary: "Air is a mixture, and oxygen makes up about 21% of its volume.",
      paragraphs: [
        "Nitrogen makes up about 78% of air and oxygen about 21%; the remaining components total about 1%. These percentages are by volume, not by mass.",
        "Pure oxygen contains only oxygen as a substance, whereas air is a mixture of several substances. The presence of oxygen does not make air pure oxygen.",
      ],
      highlights: ["mixture", "oxygen: about 21% by volume"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Air is not pure oxygen" },
    },
    "b-k-alkali-water": {
      title: "Potassium reacts with water more vigorously than sodium",
      summary: "Potassium reacts with water to form KOH and H₂, usually more vigorously than sodium does.",
      paragraphs: [
        "Both potassium and sodium have one electron in their outermost shell and commonly form compounds in the +1 oxidation state. Potassium reacts with water according to 2K + 2H₂O → 2KOH + H₂↑, analogous to the reaction of sodium.",
        "From lithium to sodium to potassium, the atoms have more electron shells and their outer electrons are easier to remove. Under common conditions, potassium usually reacts with water more vigorously than sodium. This group trend does not replace consideration of the specific reaction conditions.",
      ],
      highlights: ["KOH", "H₂", "trend down the group"],
      curriculum: { volume: "Compulsory 1", chapter: "Potassium and water; comparison within the group" },
    },
    "b-k-flame-purple": {
      title: "Why cobalt glass is used to observe potassium's lilac flame",
      summary: "Potassium gives a lilac flame; blue cobalt glass helps filter yellow light from trace sodium.",
      paragraphs: [
        "Potassium gives a lilac flame and sodium gives a yellow flame. A flame test uses differences in the light emitted by metal elements in a sample for qualitative identification.",
        "Yellow sodium light can mask potassium's lilac flame, so blue cobalt glass can be used when observing potassium. A flame test does not prove that a sample contains only one ion and cannot replace rigorous quantitative analysis.",
      ],
      highlights: ["lilac flame", "blue cobalt glass", "yellow sodium interference"],
      curriculum: { volume: "Compulsory 1", chapter: "Flame tests" },
    },
    "b-k-nitrate-electrolyte": {
      title: "Potassium nitrate forms mobile ions in water",
      summary: "Dry solid KNO₃ conducts poorly; its solution or melt contains mobile K⁺ and NO₃⁻ ions.",
      paragraphs: [
        "In solid KNO₃, ions are constrained by the crystal lattice and cannot move freely through the material, so the solid conducts poorly. Its aqueous solution can conduct electricity.",
        "Dissolution can be represented as KNO₃ → K⁺ + NO₃⁻; the ions are also mobile when the salt is molten. Conduction requires mobile charged particles; potassium nitrate does not decompose into potassium metal and nitrogen-oxygen gases when it dissolves.",
      ],
      highlights: ["K⁺", "NO₃⁻", "mobile ions"],
      curriculum: { volume: "Compulsory 1", chapter: "Ionization of electrolytes" },
    },
    "b-li-alkali-trend": {
      title: "Lithium at the top of the alkali-metal group",
      summary: "Lithium, sodium, and potassium each have one outer-shell electron; down the group, electron loss becomes easier and reactions with water are generally more vigorous.",
      paragraphs: [
        "Lithium is in Period 2 and Group 1A; sodium and potassium are below it. In chemical reactions, all three commonly lose their single outer-shell electron to form +1 ions, which explains similarities within the group.",
        "From lithium to potassium, atoms have more electron shells and larger radii, so the outer electron is less strongly attracted to the nucleus. Under common conditions, reactions with water usually become more vigorous down the group; the particular reactants and conditions still matter.",
      ],
      highlights: ["Group 1", "+1 ions", "trend down the group"],
      curriculum: { volume: "Compulsory 1", chapter: "Trends among the alkali metals" },
    },
    "b-li-ion-battery": {
      title: "Lithium ions in a lithium-ion battery",
      summary: "A lithium-ion battery supplies power through redox reactions at two electrodes, while Li⁺ moves inside the cell.",
      paragraphs: [
        "During discharge of a cell using lithiated graphite and lithium cobalt oxide as electrode materials, the negative-electrode material is oxidized and electrons flow through the external circuit toward the positive electrode. Li⁺ moves inside the battery toward the positive-electrode material. This is one example of lithium-ion battery materials.",
        "The cell supplies power by separating oxidation and reduction between two electrodes and converting chemical energy into electrical energy. Different electrode materials have different reaction equations; migration of Li⁺ inside a battery is not the same as putting lithium metal into water.",
      ],
      highlights: ["redox", "electrons in the external circuit", "Li⁺ migration"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Chemical reactions and conversion to electrical energy" },
    },
    "b-li-oxide-contrast": {
      title: "Lithium oxide and sodium peroxide",
      summary: "Heated lithium reacts with oxygen to form lithium oxide, while heated sodium can form sodium peroxide; products are not identical across the group.",
      paragraphs: [
        "When heated, lithium combines with oxygen to form Li₂O. Lithium is usually +1 and oxygen −2 in lithium oxide, consistent with the formula and charge balance.",
        "When heated, sodium reacts with oxygen to form pale-yellow Na₂O₂. Lithium and sodium belong to the same group, but these examples give different types of oxide products; potassium can also form more than one possible oxygen compound.",
      ],
      highlights: ["lithium oxide", "Na₂O₂", "oxygen-containing products"],
      curriculum: { volume: "Compulsory 1", chapter: "Alkali metals reacting with oxygen" },
    },
    "b-mg-cell-anode": {
      title: "Magnesium can be oxidized at the negative electrode of a galvanic cell",
      summary: "In some galvanic cells, magnesium is the negative electrode: Mg → Mg²⁺ + 2e⁻, releasing electrons to the external circuit.",
      paragraphs: [
        "In one galvanic cell pairing magnesium with Fe³⁺, magnesium is oxidized at the negative electrode: Mg → Mg²⁺ + 2e⁻. Fe³⁺ at the other electrode gains electrons.",
        "The two reactions occur in separate half-cells. Electrons pass through the external circuit, while a salt bridge maintains charge balance in the solutions. The device converts chemical energy from a redox reaction into electrical energy.",
      ],
      highlights: ["magnesium oxidation", "electrons in the external circuit", "salt bridge"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "The oxidation electrode in a galvanic cell" },
    },
    "b-mg-hydroxide-common-ion": {
      title: "The common-ion effect on Mg(OH)₂",
      summary: "For Mg(OH)₂(s) ⇌ Mg²⁺ + 2OH⁻, adding Mg²⁺ or OH⁻ shifts the dissolution equilibrium to the left.",
      paragraphs: [
        "Magnesium hydroxide establishes a dissolution equilibrium between the solid and its ions in water: Mg(OH)₂(s) ⇌ Mg²⁺(aq) + 2OH⁻(aq). This does not mean the solid is completely insoluble or that dissolved ions stop moving.",
        "If the system is close to saturation, adding a substance that supplies Mg²⁺ or OH⁻ usually shifts the equilibrium toward solid formation and lowers solubility. This is the effect of a common ion on a dissolution equilibrium.",
      ],
      highlights: ["dissolution equilibrium", "common-ion effect", "Mg²⁺ / OH⁻"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Dissolution equilibria of sparingly soluble electrolytes" },
    },
    "b-mg-period-trend": {
      title: "Magnesium lies between sodium and aluminum",
      summary: "In Period 3, Na, Mg, and Al have progressively more outer-shell electrons, while metallic character generally decreases.",
      paragraphs: [
        "Magnesium is in Period 3 and Group 2A. Sodium, magnesium, and aluminum have the same number of electron shells; their nuclear charges increase in sequence and their atomic radii generally decrease. Magnesium commonly forms Mg²⁺, unlike the Na⁺ commonly formed by sodium.",
        "Comparing how sodium and magnesium react with water and the properties of their hydroxides helps show the trend in metallic character across Period 3. Specific reactions still depend on conditions such as temperature and surface state.",
      ],
      highlights: ["Group 2", "Mg²⁺", "Period 3"],
      curriculum: { volume: "Compulsory 1", chapter: "Trends in metallic character across Period 3" },
    },
    "b-mg-water-contrast": {
      title: "Magnesium reacts with water less readily than sodium",
      summary: "A magnesium strip shows little reaction with water at room temperature; heating makes the reaction easier to observe, unlike sodium's behavior with water.",
      paragraphs: [
        "An oxide film covers magnesium, so the reaction with water is not obvious at room temperature; it is easier to observe on heating. Compared with sodium reacting with water, magnesium requires more favorable conditions to react.",
        "Magnesium reacts with hot water to form Mg(OH)₂ and H₂. Comparing observations in room-temperature and hot water shows the role of conditions more clearly than simply memorizing that magnesium reacts with water.",
      ],
      highlights: ["oxide film", "hot water", "comparison with sodium"],
      curriculum: { volume: "Compulsory 1", chapter: "Conditions for magnesium reacting with water" },
    },
    "c-halide-silver-precip": {
      title: "Silver ions form precipitates with halide ions",
      summary: "Ag⁺ can form sparingly soluble silver halides with Cl⁻, Br⁻, and I⁻.",
      paragraphs: [
        "In the net ionic equation Ag⁺ + X⁻ → AgX↓, X can be Cl, Br, or I. To identify an unknown solution, first rule out other ions that also precipitate with Ag⁺; a precipitate alone does not prove that a halide is present.",
        "Sparingly soluble does not mean completely insoluble. Silver-halide precipitates remain in dynamic equilibrium with the small amount of ions in solution. The solubility product can be used to assess precipitation under specified conditions.",
      ],
      highlights: ["AgCl", "AgBr", "AgI"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Dissolution equilibria of sparingly soluble electrolytes" },
    },
    "c-cl-chloride-identify": {
      title: "Evidence for identifying chloride ions",
      summary: "Ag⁺ and Cl⁻ form white AgCl; dilute nitric acid helps rule out carbonate interference.",
      paragraphs: [
        "Ag⁺ + Cl⁻ = AgCl↓. The AgCl formed is white and does not dissolve in dilute nitric acid. Silver carbonate does react with dilute nitric acid, so the acid helps rule out carbonate interference.",
        "Identifying Cl⁻ relies on the combined evidence of a precipitate and the removal of possible interference. A white precipitate after adding a silver salt is not, by itself, a unique identification.",
      ],
      highlights: ["white AgCl", "dilute nitric acid"],
      curriculum: { volume: "Compulsory 1", chapter: "Testing for chloride ions" },
    },
    "c-ag-precipitation-equilibrium": {
      title: "Dissolution equilibria of AgCl and AgI",
      summary: "Although AgCl and AgI are sparingly soluble, each remains in dynamic equilibrium with a small amount of dissolved ions.",
      paragraphs: [
        "AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq) represents a precipitate in equilibrium with the small amount of ions dissolved in solution. AgI has a corresponding equilibrium. At the same temperature, Ksp for AgI is far smaller than Ksp for AgCl, and adding I⁻ can drive the conversion of AgCl to AgI.",
        "Compare Ksp values only for specified substances at the same temperature. When analyzing precipitate conversion, also account for the stoichiometric ratios of the ions. “Sparingly soluble” does not mean that the corresponding ions are completely absent from solution.",
      ],
      highlights: ["AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq)", "conversion of AgCl to AgI"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Dissolution equilibria of sparingly soluble electrolytes" },
    },
    "ag-halide-light-response": {
      title: "Photosensitivity of silver bromide and silver iodide",
      summary: "Silver bromide and silver iodide are photosensitive and can be used in imaging materials.",
      paragraphs: [
        "These substances are silver salts, not metallic silver. Their properties are not the same merely because they all contain silver.",
      ],
      highlights: ["silver salts", "photosensitive"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: photosensitive silver salts" },
    },
    "c-cu-silver-displacement": {
      title: "Copper displaces silver from silver ions",
      summary: "Copper reduces Ag⁺ to silver and is converted to Cu²⁺.",
      paragraphs: [
        "In aqueous silver nitrate, Cu + 2Ag⁺ → Cu²⁺ + 2Ag. A gray-silver deposit can appear on the copper wire as the solution gradually turns blue; these observations correspond to Ag and a solution containing Cu²⁺, respectively.",
        "The electron transfer can be separated into Cu → Cu²⁺ + 2e⁻ and 2Ag⁺ + 2e⁻ → 2Ag. Running the half-reactions at separate electrodes connected by an external circuit links this reaction to oxidation and reduction in a galvanic cell.",
      ],
      highlights: ["Cu²⁺", "silver deposit"],
      curriculum: { volume: "Compulsory 1", chapter: "Metal displacement and redox" },
    },
    "c-ag-silver-mirror": {
      title: "The silver-mirror test for aldehydes",
      summary: "Silver(I) in Tollens' reagent can be reduced by acetaldehyde to metallic silver, forming a silver mirror.",
      paragraphs: [
        "Acetaldehyde can be oxidized by Tollens' reagent while silver(I) is reduced to metallic silver, which coats the surface as a silver mirror. Acetaldehyde also reacts with freshly prepared Cu(OH)₂ to form brick-red Cu₂O. Both observations can be related to the reducing behavior of aldehydes.",
        "The silver-mirror reaction is a common clue used to test for an aldehyde group, but a positive result does not prove that the original sample contains one: fructose can isomerize in an alkaline mixture and then reduce the silver reagent.",
      ],
      highlights: ["silver(I) is reduced", "silver mirror", "brick-red Cu₂O"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Properties of aldehydes and ketones" },
    },
    "ag-symbol": {
      title: "What does Ag represent?",
      summary: "Ag is the chemical symbol for silver and, in a microscopic context, can also represent one silver atom.",
      paragraphs: [
        "Ag is the chemical symbol for silver. It represents the element, not a particular silver-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Ag", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Ag represent?" },
    },
    "ag-surface-tarnish": {
      title: "Why does a silver surface darken?",
      summary: "Silver can react with sulfur-containing substances in the environment, forming black silver sulfide on its surface and losing its luster.",
      paragraphs: [
        "The darkening comes from a surface reaction between silver and sulfur-containing substances in the environment; it is not simply a deeper color of the silver itself.",
        "Silver sulfide on the surface does not mean that the entire silver object has turned into silver sulfide.",
      ],
      highlights: ["surface reaction", "silver sulfide"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: why silver tarnishes" },
    },
    "c-ag-ammonia-complex": {
      title: "Coordination of ammonia to silver ions",
      summary: "Ag⁺ can form [Ag(NH₃)₂]⁺ with NH₃, changing the dissolution equilibrium of silver salts.",
      paragraphs: [
        "When a white AgCl precipitate reacts with NH₃, it can form soluble [Ag(NH₃)₂]Cl, so the precipitate disappears. [Ag(NH₃)₂]⁺ is a complex cation and Cl⁻ is a counterion; Cl⁻ does not belong inside the square brackets of the complex ion.",
        "In AgCl(s) ⇌ Ag⁺ + Cl⁻, some dissolved Ag⁺ binds to NH₃. The concentration of free Ag⁺ falls, driving more AgCl to dissolve. This observation should not be generalized to every silver halide.",
      ],
      highlights: ["[Ag(NH₃)₂]⁺", "driving more AgCl to dissolve"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Coordination compounds and supramolecular chemistry" },
    },
    "al-symbol": {
      title: "What does Al represent?",
      summary: "Al is the chemical symbol for aluminum and, in a microscopic context, can also represent one aluminum atom.",
      paragraphs: [
        "Al represents the element aluminum and, in a microscopic context, can represent one aluminum atom. It does not represent a particular aluminum-containing compound. In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Al", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Al represent?" },
    },
    "al-atom-shells": {
      title: "Reading the shell diagram of an aluminum atom",
      summary: "A neutral aluminum atom has 13 electrons, arranged by shell as 2, 8, 3.",
      paragraphs: [
        "A neutral aluminum atom has nuclear charge +13 and 13 electrons, distributed across its shells as 2, 8, and 3 from the innermost outward. It has atomic number 13 and 13 protons; this electron arrangement should not be applied directly to its ions.",
      ],
      highlights: ["atomic number 13", "3 electrons in its outermost shell"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of an aluminum atom" },
    },
    "b-al-oxide-film": {
      title: "Why aluminum resists everyday corrosion despite being reactive",
      summary: "At room temperature, a dense Al₂O₃ film forms on aluminum and keeps air from reaching the metal underneath.",
      paragraphs: [
        "Aluminum is a fairly reactive metal and reacts with oxygen in air even at room temperature. The dense Al₂O₃ film that forms on its surface blocks further contact between the underlying aluminum and air, so its reactivity is consistent with the everyday corrosion resistance of aluminum objects.",
        "The film does not prove that aluminum is unreactive. Acids or strong bases can first react with the oxide layer and then with the aluminum itself; the film also cannot guarantee complete protection in every corrosive environment.",
      ],
      highlights: ["dense Al₂O₃ film", "blocks further contact", "corrosive environment"],
      curriculum: { volume: "Compulsory 1", chapter: "The oxide film on aluminum" },
    },
    "b-al-acid-alkali": {
      title: "Aluminum reacts with both acids and strong bases to release hydrogen",
      summary: "Acids and strong bases can first react with the surface film; aluminum then reacts under the corresponding conditions.",
      paragraphs: [
        "Hydrochloric acid can first react with the oxide film: Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O. Aluminum then reacts with the acid: 2Al + 6HCl → 2AlCl₃ + 3H₂↑. Considering the two steps separately helps explain why an unpolished aluminum strip may react slowly at first.",
        "In aqueous NaOH, the reaction can be written as 2Al + 2NaOH + 6H₂O → 2Na[Al(OH)₄] + 3H₂↑. Water is a reactant in this equation, and the product is sodium tetrahydroxoaluminate in aqueous solution. Do not omit water without also balancing the equation again.",
      ],
      highlights: ["oxide film", "strong bases", "sodium tetrahydroxoaluminate"],
      curriculum: { volume: "Compulsory 1", chapter: "Aluminum and aluminum oxide with acids and bases" },
    },
    "b-al-hydroxide-amphoteric": {
      title: "The amphoteric behavior of Al(OH)₃",
      summary: "Al(OH)₃ reacts with both acids and strong bases, unlike Mg(OH)₂.",
      paragraphs: [
        "Al(OH)₃ is a white, gelatinous precipitate that dissolves in both hydrochloric acid and NaOH solution. The ability to react with both acids and strong bases is called amphoteric behavior.",
        "In acidic solution, the reaction can be written as Al(OH)₃ + 3H⁺ → Al³⁺ + 3H₂O. In strong base, it can be written as Al(OH)₃ + OH⁻ → [Al(OH)₄]⁻. The second reaction forms the tetrahydroxoaluminate ion, not simply Al³⁺.",
      ],
      highlights: ["amphoteric behavior", "Al³⁺", "[Al(OH)₄]⁻"],
      curriculum: { volume: "Compulsory 1", chapter: "Amphoteric hydroxides" },
    },
    "b-al-aluminate-conversion": {
      title: "Precipitating aluminum hydroxide from solution",
      summary: "After bauxite is dissolved in strong base, excess CO₂ can precipitate Al(OH)₃, which can then be dehydrated to form Al₂O₃.",
      paragraphs: [
        "Aluminum-containing substances in bauxite become tetrahydroxoaluminate ions in aqueous strong base. Passing in excess CO₂ can then convert [Al(OH)₄]⁻ to an Al(OH)₃ precipitate and HCO₃⁻.",
        "Heating Al(OH)₃ removes water and forms Al₂O₃. In aqueous solution, [Al(OH)₄]⁻ is the preferred way to represent the aluminum-containing ion. The older shorthand aluminate ion, AlO₂⁻, is a different simplified formula and requires corresponding changes to the water coefficients; it cannot be substituted directly.",
      ],
      highlights: ["strong base", "excess CO₂", "[Al(OH)₄]⁻"],
      curriculum: { volume: "Compulsory 2", chapter: "From bauxite to aluminum oxide" },
    },
    "b-al-alumina-ionic-ratio": {
      title: "Why Al₂O₃ is not simply a purely ionic crystal",
      summary: "The 2:3 ratio in Al₂O₃ balances formal charges, but its crystal structure has substantial covalent character and is transitional.",
      paragraphs: [
        "Using formal oxidation states, the +6 charge from two Al³⁺ ions balances the −6 charge from three O²⁻ ions. This helps explain the formula Al₂O₃, but it is a model of composition, not proof that the solid contains only purely ionic bonds.",
        "Al₂O₃ lies between typical ionic and covalent crystals and leans toward covalent character, so it is generally treated as a covalent crystal. Do not classify it as purely ionic from the 2:3 formal charge ratio alone, or treat its empirical formula as a discrete molecule.",
      ],
      highlights: ["formal oxidation states", "2:3 ratio", "covalent character"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Transitional crystal types and empirical formulas" },
    },
    "al-alloy-strength": {
      title: "Why are aluminum alloys widely used?",
      summary: "Pure aluminum is not very strong; alloys with elements such as copper and magnesium can combine low weight with greater strength.",
      paragraphs: [
        "Aluminum alloys are used in aircraft and other transport equipment. They show how changing a material's composition can meet different practical needs.",
        "“Aluminum alloy” does not name one pure substance with a fixed chemical formula, and an alloy should not be confused with aluminum oxide.",
      ],
      highlights: ["low weight", "alloy"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: why aluminum alloys are widely used" },
    },
    "b-al-alloy-material": {
      title: "Duralumin is an alloy, not an aluminum compound",
      summary: "Adding small amounts of other elements can improve aluminum's material properties; duralumin is still a mixture of alloyed materials.",
      paragraphs: [
        "Pure aluminum has relatively low hardness and strength. Duralumin contains aluminum with small amounts of copper, magnesium, manganese, and silicon. It has low density and relatively high strength, so it can be used in lightweight structural parts.",
        "An alloy's composition can vary within a range, so it has no fixed molecular formula. Aluminum alloy is a multicomponent material, unlike pure aluminum; the Al₂O₃ film on its surface is not the alloy itself.",
      ],
      highlights: ["Pure aluminum", "Duralumin", "multicomponent material"],
      curriculum: { volume: "Compulsory 1", chapter: "Aluminum alloys and material properties" },
    },
    "c-noble-shell-period": {
      title: "Noble gases and stable outer shells",
      summary: "He has a full two-electron shell, while Ar has eight outer-shell electrons; both are at the end of a period.",
      paragraphs: [
        "A helium atom has only the first shell, which is relatively stable when it contains two electrons. An argon atom has the shell arrangement 2, 8, 8, with eight electrons in its outermost shell.",
        "A stable outer shell helps explain why noble gases are usually less reactive, but it does not mean that they can never form compounds. A shell diagram is also not a picture of the actual paths of electrons.",
      ],
      highlights: ["He: 2", "Ar: 2, 8, 8"],
      curriculum: { volume: "Compulsory 1", chapter: "Atomic structure and the periodic table" },
    },
    "ar-symbol": {
      title: "What does Ar represent?",
      summary: "Ar is the chemical symbol for argon and, in a microscopic context, can also represent one argon atom.",
      paragraphs: [
        "Ar is the chemical symbol for argon. It represents the element, not a particular argon-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Ar", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Ar represent?" },
    },
    "ar-atom-shells": {
      title: "Reading the shell diagram of an argon atom",
      summary: "A neutral argon atom has 18 electrons, arranged by shell as 2, 8, 8.",
      paragraphs: [
        "A neutral argon atom has nuclear charge +18 and 18 electrons, distributed from the inner shell outward as 2, 8, and 8. A neutral atom has the same total number of electrons as protons in its nucleus.",
        "Argon's atomic number is 18, and it has eight electrons in its outermost shell. This shell arrangement describes the neutral atom and should not be applied directly to its ions.",
      ],
      highlights: ["atomic number is 18", "eight electrons in its outermost shell"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of an argon atom" },
    },
    "ar-stable-shell": {
      title: "Argon's outermost shell",
      summary: "An argon atom has the shell arrangement 2, 8, 8, with eight electrons in its outermost shell.",
      paragraphs: [
        "Argon has eight electrons in its outermost shell, a relatively stable arrangement.",
        "A neutral argon atom is usually unreactive, but noble gases should not be described as incapable of reacting under every condition.",
      ],
      highlights: ["2, 8, 8", "relatively stable"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Argon's outermost shell" },
    },
    "ar-protective-atmosphere": {
      title: "Argon as a shielding gas",
      summary: "Argon can provide a protective atmosphere during welding and the production of reactive metals.",
      paragraphs: [
        "A protective atmosphere helps reduce unwanted reactions between materials and components of the surrounding air. Argon is also used to protect filaments in light bulbs.",
        "These uses rely on argon's relatively low reactivity under specific conditions. Argon in a shielding atmosphere is not the same thing as ordinary air.",
      ],
      highlights: ["protective atmosphere"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: argon as a shielding gas" },
    },
    "ba-symbol": {
      title: "What does Ba represent?",
      summary: "Ba is the chemical symbol for barium and, in a microscopic context, can also represent one barium atom.",
      paragraphs: [
        "Ba represents the element barium and, in a microscopic context, one barium atom. It does not represent a particular barium-containing compound. In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Ba", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Ba represent?" },
    },
    "ba-sulfate-precipitation": {
      title: "Barium sulfate precipitate",
      summary: "Aqueous Ba(OH)₂ reacts with H₂SO₄ to form sparingly soluble BaSO₄ and water.",
      paragraphs: [
        "Ba(OH)₂(aq) + H₂SO₄(aq) → BaSO₄(s) + 2H₂O(l). Barium sulfate is sparingly soluble, but this does not mean that all barium compounds are sparingly soluble or have the same contact-safety properties.",
      ],
      highlights: ["BaSO₄(s)", "sparingly soluble"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: barium sulfate precipitate" },
    },
    "b-ba-sulfate-net-ionic": {
      title: "Ba²⁺ and SO₄²⁻ form a white precipitate",
      summary: "Ba²⁺ + SO₄²⁻ → BaSO₄↓; Na⁺ and Cl⁻ are spectator ions in the corresponding solution reaction.",
      paragraphs: [
        "Mixing dilute Na₂SO₄ and dilute BaCl₂ solutions forms a white BaSO₄ precipitate: Na₂SO₄ + BaCl₂ → 2NaCl + BaSO₄↓.",
        "The precipitate forms when Ba²⁺ combines with SO₄²⁻, so the net ionic equation is Ba²⁺ + SO₄²⁻ → BaSO₄↓. Na⁺ and Cl⁻ remain in solution and do not need to appear in the net ionic equation.",
      ],
      highlights: ["BaSO₄↓", "net ionic equation", "spectator ions"],
      curriculum: { volume: "Compulsory 1", chapter: "The ionic reaction of sulfate" },
    },
    "b-ba-sulfate-test-interference": {
      title: "A white barium-salt precipitate is not always BaSO₄",
      summary: "BaCO₃ also forms a white precipitate. Acidify the sample with dilute HCl before adding BaCl₂ to rule out carbonate and other interference when testing for sulfate.",
      paragraphs: [
        "Adding BaCl₂ to a solution containing SO₄²⁻ gives Ba²⁺ + SO₄²⁻ → BaSO₄↓. However, CO₃²⁻ also combines with Ba²⁺ to form white BaCO₃, so a white precipitate alone does not prove that sulfate is present.",
        "BaCO₃ dissolves in dilute hydrochloric acid and releases CO₂, while BaSO₄ does not dissolve in dilute hydrochloric acid. Acidify the sample first, then add BaCl₂; the acid step is important for ruling out interference.",
      ],
      highlights: ["carbonate interference", "acidify first", "BaSO₄ does not dissolve in dilute hydrochloric acid"],
      curriculum: { volume: "Compulsory 2", chapter: "Testing for sulfate ions" },
    },
    "b-ba-sulfate-equilibrium": {
      title: "Sparingly soluble BaSO₄ is not completely insoluble",
      summary: "BaSO₄(s) ⇌ Ba²⁺ + SO₄²⁻ establishes a very small dissolution equilibrium; a common ion suppresses dissolution.",
      paragraphs: [
        "BaSO₄ is a sparingly soluble salt, but “sparingly soluble” does not mean that its solubility is exactly zero. A small amount of solid can reach equilibrium with Ba²⁺ and SO₄²⁻ in water; the solubility product describes this equilibrium.",
        "If the concentration of one of these ions is increased in a nearly saturated system, the equilibrium usually shifts toward the solid and more remains undissolved. This describes barium sulfate's equilibrium and should not be applied directly to every barium salt.",
      ],
      highlights: ["BaSO₄", "solubility product", "common ion"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Dissolution equilibria of sparingly soluble electrolytes" },
    },
    "b-ba-flame-yellow-green": {
      title: "Barium's yellow-green flame",
      summary: "Barium gives a yellow-green flame, which can be compared with the flame colors of lithium, sodium, potassium, and calcium.",
      paragraphs: [
        "Some elements or their compounds show characteristic flame colors when heated. Barium's yellow-green flame provides a qualitative clue for identifying the element.",
        "A flame test only shows an emission color. It does not prove that a sample is metallic barium or that other metal ions are absent. Chemical identity still needs to be assessed using solubility, formulas, and other reactions.",
      ],
      highlights: ["yellow-green", "barium", "qualitative clue"],
      curriculum: { volume: "Compulsory 1", chapter: "The flame test" },
    },
    "c-halogen-displacement": {
      title: "Halogen displacement and oxidizing strength",
      summary: "Chlorine water can oxidize Br⁻ and I⁻; bromine water can oxidize I⁻.",
      paragraphs: [
        "Cl₂ can oxidize Br⁻ to Br₂ and I⁻ to I₂; Br₂ can oxidize I⁻ to I₂. The ionic equations are Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂ and Br₂ + 2I⁻ → 2Br⁻ + I₂.",
        "These reactions show that, under these conditions, the oxidizing strength decreases in the order Cl₂ > Br₂ > I₂, while the halide ions act as reducing agents. K⁺ or Na⁺ remains unchanged in the ionic equation; the reaction is not potassium or sodium taking chlorine away.",
      ],
      highlights: ["Cl₂ > Br₂ > I₂", "redox"],
      curriculum: { volume: "Compulsory 1", chapter: "Periodic trends and the halogens" },
    },
    "br-symbol": {
      title: "What does Br represent?",
      summary: "Br is the chemical symbol for bromine and, in a microscopic context, can also represent one bromine atom.",
      paragraphs: [
        "Br is the chemical symbol for bromine. It represents the element, not a particular bromine-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Br", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Br represent?" },
    },
    "br-liquid-molecule": {
      title: "The physical state of bromine at room temperature",
      summary: "Common elemental bromine consists of Br₂ molecules and is a dark red liquid at room temperature.",
      paragraphs: [
        "A Br₂ molecule contains two bromine atoms. Elemental bromine is a dark red liquid at room temperature.",
        "Elemental bromine is toxic. Bromine compounds and bromide ions should not be confused with pure liquid bromine.",
      ],
      highlights: ["Br₂", "dark red liquid"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: bromine at room temperature" },
    },
    "c-br-i-extraction": {
      title: "Colors of bromine and iodine in an organic phase",
      summary: "Br₂ and I₂ dissolve more readily in nonpolar or weakly polar organic solvents, helping make halogen displacement easier to observe.",
      paragraphs: [
        "Br₂ can appear yellow to reddish brown in a weakly polar organic solvent, while I₂ is often violet in such solvents. When I₂ moves from water into carbon tetrachloride, the organic phase can appear reddish violet.",
        "Solution color depends on the halogen, its concentration, and the solvent. Extraction helps make elemental halogens easier to observe, but one color alone cannot confirm that an original solution contains Br⁻ or I⁻ under every condition.",
      ],
      highlights: ["Br₂ yellow to reddish brown", "I₂ reddish violet"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Molecular structure and like dissolves like" },
    },
    "c-symbol": {
      title: "What does C represent?",
      summary: "C is the chemical symbol for carbon and, in a microscopic context, can also represent one carbon atom.",
      paragraphs: [
        "C is the chemical symbol for carbon and, in a microscopic context, can represent one carbon atom. It is not a chemical formula for a carbon-containing compound.",
        "A one-letter element symbol is uppercase.",
      ],
      highlights: ["C", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does C represent?" },
    },
    "c-atom-shells": {
      title: "Reading the shell diagram of a carbon atom",
      summary: "A neutral carbon atom has 6 electrons, arranged by shell as 2, 4.",
      paragraphs: [
        "In the shell diagram of a carbon atom, the nuclear charge is +6 and the shells contain 2 and 4 electrons from the inside outward. A neutral carbon atom has the same total number of electrons as protons.",
        "Carbon's atomic number is 6, and the outermost shell has 4 electrons in this shell model. If discussing an ion, do not copy the electron count from the neutral atom.",
      ],
      highlights: ["atomic number is 6", "outermost shell", "4 electrons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a carbon atom" },
    },
    "c-allotropes": {
      title: "Why can one element form different substances?",
      summary: "Diamond, graphite, and C₆₀ are all elemental carbon, but their atoms are arranged differently.",
      paragraphs: [
        "Diamond, graphite, and C₆₀ are all elemental carbon. Their microscopic structures differ, so their physical properties can differ markedly as well.",
        "One element can form different substances. Knowing only that something “contains carbon” is not enough to determine its structure or properties.",
      ],
      highlights: ["elemental carbon", "arranged differently"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Why can one element form different substances?" },
    },
    "c-diamond-network": {
      title: "Diamond as a covalent-network crystal",
      summary: "Each carbon atom in diamond is bonded to four neighboring carbon atoms.",
      paragraphs: [
        "In diamond, each carbon atom is connected to four neighboring carbon atoms by covalent single bonds, forming a structure that extends through space. There are no separate “diamond molecules.”",
        "Covalent bonds extend throughout the crystal, helping explain diamond's high hardness. C₆₀ consists of separate molecules; although both are elemental carbon, their microscopic structures and properties differ.",
      ],
      highlights: ["covalent-network crystal", "microscopic structures and properties"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Diamond as a covalent-network crystal" },
    },
    "c-graphite-properties": {
      title: "Properties and uses of graphite",
      summary: "Graphite is gray-black with a metallic luster, is soft, and conducts electricity well.",
      paragraphs: [
        "Graphite is soft and can be used in pencil leads. It also conducts electricity and can be made into electrodes. Electrical conductivity is not a property exclusive to metals.",
        "Graphite is elemental carbon; it is not made of separate “C molecules.”",
      ],
      highlights: ["soft", "conducts electricity"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Properties and uses of graphite" },
    },
    "c-adsorption": {
      title: "Adsorption by activated carbon",
      summary: "The loose, porous structure of charcoal supports adsorption; activated carbon adsorbs more strongly.",
      paragraphs: [
        "Charcoal and activated carbon can be used for decolorization, odor removal, and water treatment. These uses are related to their loose, porous structures and adsorption.",
        "Adsorption has limits. Adsorbing substances from unknown water does not prove that the water is safe to drink, and activated carbon should not be used to treat toxic gases on one's own.",
      ],
      highlights: ["loose, porous structure", "adsorption"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Adsorption by activated carbon" },
    },
    "c-fullerene": {
      title: "What does 60 mean in C₆₀?",
      summary: "One C₆₀ molecule consists of 60 carbon atoms.",
      paragraphs: [
        "The structure of a C₆₀ molecule is often compared to a soccer ball. The subscript 60 means that one molecule contains 60 carbon atoms.",
        "C₆₀ contains only carbon and is an elemental substance. An elemental substance is not necessarily made of individual atoms.",
      ],
      highlights: ["C₆₀", "60 carbon atoms"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does 60 mean in C₆₀?" },
    },
    "c-combustion": {
      title: "Products and conditions of carbon combustion",
      summary: "The textbook distinguishes complete combustion of carbon to carbon dioxide from incomplete combustion to carbon monoxide.",
      paragraphs: [
        "When ignited with sufficient oxygen, carbon can form CO₂: C + O₂ → CO₂. With insufficient oxygen, it can form CO: 2C + O₂ → 2CO.",
        "The product depends on the oxygen supply. Do not assume that carbon and oxygen always produce only CO₂.",
      ],
      highlights: ["complete combustion", "incomplete combustion"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Products and conditions of carbon combustion" },
    },
    "c-carbon-oxides": {
      title: "CO and CO₂ have different properties",
      summary: "CO and CO₂ both contain carbon and oxygen, but their molecular compositions and reaction properties differ.",
      paragraphs: [
        "CO is carbon monoxide, with a carbon-to-oxygen atom ratio of 1:1. CO₂ is carbon dioxide, with a ratio of 1:2. The different numbers of oxygen atoms mean these are different substances.",
        "Only some CO₂ dissolved in water reacts reversibly with water to form carbonic acid. CO₂ can also react with bases to form carbonates, while CO can reduce iron oxides during high-temperature ironmaking.",
      ],
      highlights: ["CO", "CO₂", "different properties"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "CO and CO₂ have different properties" },
    },
    "c-carbon-monoxide-reduction": {
      title: "The reducing property of carbon monoxide",
      summary: "In the high-temperature environment of ironmaking, carbon monoxide can reduce iron oxides.",
      paragraphs: [
        "In a blast furnace, hot coke reacts with CO₂ to form CO. CO acts as the reducing agent, lowering the oxidation state of iron in iron oxide. The carbon and oxygen ratios differ between the two steps.",
      ],
      highlights: ["carbon monoxide", "reducing agent", "high-temperature"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "The reducing property of carbon monoxide" },
    },
    "c-carbon-dioxide-carbonates": {
      title: "How CO₂ is connected to carbonates",
      summary: "The dissolution of carbon dioxide in water and its reaction with bases connect carbonate and hydrogen carbonate ions.",
      paragraphs: [
        "CO₂ dissolves in water, and only some of it reacts with water to form H₂CO₃. The carbonate system can include HCO₃⁻ and CO₃²⁻. These particles are linked to CO₂ through transformations, but they are not the same substance.",
        "CO₂ can react with a base to form a carbonate or a hydrogen carbonate; the product depends on conditions such as the reactant ratio.",
      ],
      highlights: ["carbonate", "hydrogen carbonate", "reactant ratio"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "How CO₂ is connected to carbonates" },
    },
    "b-na-carbonate-conversion": {
      title: "Interconversion of sodium carbonate and sodium hydrogen carbonate",
      summary: "Passing excess CO₂ into sodium carbonate solution can form sodium hydrogen carbonate; heating solid sodium hydrogen carbonate forms sodium carbonate.",
      paragraphs: [
        "Passing excess CO₂ into aqueous Na₂CO₃ links carbonate ions with CO₂ and water through an acid-base transformation, forming NaHCO₃. The relationship between carbonate and hydrogen carbonate depends on the amounts of CO₂ and water in the system.",
        "A common reverse condition is heating solid NaHCO₃, which decomposes to Na₂CO₃, CO₂, and water. Heating solid Na₂CO₃ does not form NaHCO₃ under the same conditions; the two transformations require different conditions.",
      ],
      highlights: ["excess CO₂", "heating NaHCO₃", "different conditions"],
      curriculum: { volume: "Compulsory 1", chapter: "Transformations of sodium carbonate and sodium hydrogen carbonate" },
    },
    "b-ca-hydrogen-carbonate-cycle": {
      title: "How limestone dissolves in CO₂-rich water",
      summary: "In water containing CO₂, CaCO₃ can form dissolved Ca²⁺ and HCO₃⁻; when CO₂ escapes, CaCO₃ may precipitate again.",
      paragraphs: [
        "Water containing CO₂ can convert CaCO₃ into dissolved Ca²⁺ and HCO₃⁻: CaCO₃(s) + CO₂(aq) + H₂O(l) ⇌ Ca²⁺(aq) + 2HCO₃⁻(aq). These ions are often written together as Ca(HCO₃)₂(aq); this does not mean that stable, separable solid crystals of calcium hydrogen carbonate exist.",
        "When CO₂ escapes from the water, the equilibrium can shift toward CaCO₃ deposition. CO₂-rich water and the escape of CO₂ connect the dissolution and precipitation of calcium carbonate.",
      ],
      highlights: ["water containing CO₂", "Ca(HCO₃)₂(aq)", "CO₂ escapes"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Calcium carbonate equilibrium and the carbonate system" },
    },
    "c-carbon-bonding": {
      title: "Carbon's tetravalent bonding",
      summary: "A carbon atom can form four covalent bonds and connect with other carbon atoms in chains and rings.",
      paragraphs: [
        "Carbon atoms in organic compounds usually form four covalent bonds. Carbon atoms can join through single, double, or triple bonds to form chain or ring skeletons.",
        "The carbon skeleton and functional groups affect an organic compound's properties. Methane, CH₄, is the simplest organic compound and helps introduce carbon's tetravalent bonding.",
      ],
      highlights: ["four covalent bonds", "carbon skeleton"],
      curriculum: { volume: "Compulsory 2", chapter: "Carbon's tetravalent bonding" },
    },
    "c-organic-classification": {
      title: "Classifying compounds by carbon skeleton and functional group",
      summary: "Organic compounds can be classified using two clues: their carbon skeleton and their functional groups.",
      paragraphs: [
        "By carbon skeleton, organic compounds can be chain-like or cyclic; aromatic compounds are one group of cyclic compounds. The same number of carbon atoms can form different carbon skeletons.",
        "By functional group, compounds can be identified as alkenes with a carbon-carbon double bond, alcohols with a hydroxyl group, aldehydes with an aldehyde group, carboxylic acids with a carboxyl group, and so on. Functional groups help predict characteristic reactions of a class of compounds.",
      ],
      highlights: ["carbon skeleton", "functional groups"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Classification by carbon skeleton and functional group" },
    },
    "c-alkanes": {
      title: "Alkanes and methane",
      summary: "Alkanes are saturated hydrocarbons containing only carbon-carbon single bonds and carbon-hydrogen bonds.",
      paragraphs: [
        "Methane, CH₄, is the simplest alkane. Carbon atoms in alkanes are connected by single bonds, and the remaining bonds connect to hydrogen. Carbon chains can grow longer or form branches.",
        "Common fuels such as natural gas and liquefied petroleum gas contain alkanes. Alkane combustion and substitution reactions depend on composition and structure; not every carbon-containing fuel is an alkane.",
      ],
      highlights: ["saturated hydrocarbons", "Methane"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Alkanes and methane" },
    },
    "c-ethene-planarity": {
      title: "The planar structure of ethene",
      summary: "The two carbon atoms and four hydrogen atoms in an ethene molecule lie in the same plane.",
      paragraphs: [
        "In ethene, each carbon atom uses sp² hybridization to form σ bonds, and the carbon-carbon double bond also contains one π bond. The bond angles are about 120°, and all the atoms in the molecule lie in one plane.",
        "The carbon-carbon double bond restricts rotation between the carbon atoms, contributing to ethene's planar structure. This structure also helps explain ethene's addition and polymerization reactions.",
      ],
      highlights: ["sp²", "planar structure"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "The planar structure of ethene" },
    },
    "c-ethene-addition": {
      title: "The double bond in ethene and addition reactions",
      summary: "Ethene's carbon-carbon double bond allows it to undergo addition reactions with bromine and other substances.",
      paragraphs: [
        "Ethene, C₂H₄, contains a carbon-carbon double bond and is the simplest alkene. When it is bubbled through bromine in carbon tetrachloride, bromine adds across the double bond to form 1,2-dibromoethane, and the solution loses its color.",
        "Ethene can also be oxidized by acidified potassium permanganate; the cause of that color change differs from bromine addition. Distinguishing the reagent's color change from the reaction type helps identify the functional group correctly.",
      ],
      highlights: ["carbon-carbon double bond", "addition reaction"],
      curriculum: { volume: "Compulsory 2", chapter: "The double bond in ethene and addition reactions" },
    },
    "c-benzene-aromatic": {
      title: "Benzene rings and aromatic hydrocarbons",
      summary: "Benzene reacts differently from ethene and should not be treated as if it had an ordinary double bond.",
      paragraphs: [
        "Benzene, C₆H₆, is the simplest aromatic hydrocarbon. It is not oxidized by acidified potassium permanganate solution and does not undergo addition with bromine water in the same way as ethene.",
        "Benzene can make bromine water look paler because bromine dissolves more readily in benzene and is extracted into it; this does not mean a chemical reaction occurred. Understanding the benzene ring requires comparing structure with experimental observations.",
      ],
      highlights: ["benzene ring", "extracted"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Benzene rings and aromatic hydrocarbons" },
    },
    "c-alcohol-hydroxyl": {
      title: "Ethanol and the hydroxyl group",
      summary: "Ethanol's hydroxyl group affects its solubility and reaction properties.",
      paragraphs: [
        "Ethanol can be written as CH₃CH₂OH, where —OH is called a hydroxyl group. Ethanol mixes with water and can be used as an organic solvent; the hydroxyl group is a structural clue for identifying alcohols.",
        "When ethanol reacts with sodium, the hydrogen in its hydroxyl group is replaced by sodium and hydrogen gas is released. Water also reacts with sodium, but the observations and structural explanations differ.",
      ],
      highlights: ["hydroxyl group", "Ethanol"],
      curriculum: { volume: "Compulsory 2", chapter: "Ethanol and the hydroxyl group" },
    },
    "c-aldehyde-carbonyl": {
      title: "The aldehyde group and acetaldehyde",
      summary: "An aldehyde group is a functional group in which the carbonyl carbon is bonded to a hydrogen atom.",
      paragraphs: [
        "Aldehydes contain the —CHO group. The condensed structural formula for acetaldehyde is CH₃CHO; it helps show how a carbonyl group relates to an aldehyde group. Not every compound containing a carbonyl group is an aldehyde.",
        "Functional groups affect the reactions of organic compounds. Under suitable conditions, the aldehyde group in acetaldehyde can undergo addition and oxidation reactions; these reactions are related to its structure.",
      ],
      highlights: ["aldehyde group", "acetaldehyde"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "The aldehyde group and acetaldehyde" },
    },
    "c-carboxylic-acid": {
      title: "The carboxyl group and acetic acid",
      summary: "Carboxylic acids contain a carboxyl group; acetic acid is a common example.",
      paragraphs: [
        "A carboxyl group is written —COOH. The condensed structural formula for acetic acid is CH₃COOH. Carboxylic acids can be classified by the group attached to the carboxyl group and by the number of carboxyl groups.",
        "Under suitable conditions, acetic acid reacts with ethanol to form an ester, linking the carboxyl group in the acid with the hydroxyl group in the alcohol.",
      ],
      highlights: ["carboxyl group", "acetic acid"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "The carboxyl group and acetic acid" },
    },
    "c-esterification": {
      title: "Esterification of acetic acid and ethanol",
      summary: "Acetic acid and ethanol can form ethyl acetate when heated with concentrated sulfuric acid as a catalyst.",
      paragraphs: [
        "When heated with concentrated sulfuric acid as a catalyst, acetic acid and ethanol undergo esterification: one water molecule is removed from the carboxyl and hydroxyl groups, and the remaining parts form ethyl acetate.",
        "Ethyl acetate contains the —COO— ester group and is not acetic acid. Esterification is reversible; the hydroxyl, carboxyl, and ester groups help identify this transformation.",
      ],
      highlights: ["esterification", "concentrated sulfuric acid", "heated"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Esterification of acetic acid and ethanol" },
    },
    "c-ester-hydrolysis": {
      title: "Hydrolysis of ethyl acetate",
      summary: "Ethyl acetate hydrolyzes in acidic or basic conditions, with different products in each medium.",
      paragraphs: [
        "When heated under acidic conditions, ethyl acetate reacts reversibly with water to form acetic acid and ethanol. This is the reverse of esterification.",
        "When heated under basic conditions, ethyl acetate reacts with NaOH to form sodium acetate and ethanol. Because acetic acid is converted to a salt, this basic hydrolysis should not be written as reversible in the same way as acidic hydrolysis.",
      ],
      highlights: ["hydrolysis", "reversibly", "sodium acetate"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Hydrolysis of ethyl acetate" },
    },
    "c-saccharides": {
      title: "Carbon skeletons in carbohydrates",
      summary: "Carbohydrates are carbon-containing organic compounds; glucose, starch, and cellulose have different uses.",
      paragraphs: [
        "Glucose, sucrose, starch, and cellulose are all carbohydrates and usually contain carbon, hydrogen, and oxygen. “Carbohydrate” does not simply mean “a substance that tastes sweet.”",
        "Starch stores energy in plants, while cellulose is an important component of plant cell walls. Their molecular compositions and properties differ from those of glucose; starch and cellulose also have different linkages and roles.",
      ],
      highlights: ["glucose", "starch", "cellulose"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Carbon skeletons in carbohydrates" },
    },
    "c-polymerization": {
      title: "Carbon chains and addition polymerization",
      summary: "Small molecules with double bonds can join to form long polymer chains.",
      paragraphs: [
        "Monomers such as ethene, which contain carbon-carbon double bonds, can join through addition polymerization to form polymers. The carbon atoms remain, but the molecular size and connections change.",
        "Addition polymerization usually has no small-molecule by-product. In condensation polymerization, monomers with two or more functional groups often react with the release of a small molecule. Distinguish the two by looking at the monomer structures and reaction pathway.",
      ],
      highlights: ["monomers", "addition polymerization", "condensation polymerization"],
      curriculum: { volume: "Selective Compulsory 3", chapter: "Carbon chains and addition polymerization" },
    },
    "ca-symbol": {
      title: "What does Ca represent?",
      summary: "Ca is the chemical symbol for calcium and, in a microscopic context, can also represent one calcium atom.",
      paragraphs: [
        "Ca represents the element calcium and, in a microscopic context, one calcium atom. It does not represent a particular calcium-containing compound. In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Ca", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Ca represent?" },
    },
    "ca-carbonate-materials": {
      title: "The main component of limestone",
      summary: "The main component of eggshells, seashells, and limestone is calcium carbonate, CaCO₃.",
      paragraphs: [
        "Calcium carbonate contains calcium, carbon, and oxygen. A material containing calcium does not necessarily contain metallic calcium.",
        "“Main component” does not mean that the material contains only one substance; natural limestone should not automatically be written as pure CaCO₃.",
      ],
      highlights: ["CaCO₃", "main component"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "The main component of limestone" },
    },
    "ca-carbonate-decomposition": {
      title: "Calcium carbonate and calcium oxide",
      summary: "At high temperature, CaCO₃, the main component of limestone, decomposes to form CaO and CO₂.",
      paragraphs: [
        "At high temperature, CaCO₃ → CaO + CO₂. This equation describes the transformation of pure calcium carbonate. Natural limestone also contains other components, so an entire rock should not be treated as pure CaCO₃.",
      ],
      highlights: ["high temperature", "CaCO₃", "CaO"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: calcium carbonate and calcium oxide" },
    },
    "ca-oxide-hydration": {
      title: "Quicklime and slaked lime",
      summary: "Calcium oxide reacts with water to form calcium hydroxide.",
      paragraphs: [
        "CaO + H₂O → Ca(OH)₂. Calcium oxide and calcium hydroxide have different compositions; containing calcium does not make them the same substance. This reaction can be vigorous.",
      ],
      highlights: ["CaO", "Ca(OH)₂"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: quicklime and slaked lime" },
    },
    "b-ca-carbonate-ions": {
      title: "CaCO₃ precipitation and the ionic product",
      summary: "Although CaCO₃ is sparingly soluble, it remains in equilibrium with small amounts of Ca²⁺ and CO₃²⁻; precipitation depends on the ionic product.",
      paragraphs: [
        "The main component of limestone, CaCO₃, is sparingly soluble. In water, its equilibrium between the solid and trace dissolved ions can be written CaCO₃(s) ⇌ Ca²⁺(aq) + CO₃²⁻(aq).",
        "When solutions of a soluble calcium salt and a carbonate are mixed, CaCO₃ can precipitate if the ionic product exceeds the solubility product under those conditions. Whether a precipitate forms also depends on the ion concentrations after mixing.",
      ],
      highlights: ["CaCO₃", "ionic product", "precipitation"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Dissolution equilibria of sparingly soluble electrolytes" },
    },
    "b-ca-flame-brick": {
      title: "Calcium's brick-red flame",
      summary: "Calcium gives a brick-red flame, distinct from the yellow flame of sodium, violet flame of potassium, and yellow-green flame of barium.",
      paragraphs: [
        "A flame test observes characteristic colors produced by some metal elements or their compounds. Calcium's brick-red flame is a qualitative clue for comparison with other elements.",
        "A flame color is an observation under specific test conditions. Calcium in a mineral or scale does not normally make it visibly brick-red. Identifying a substance also requires other ions and reactions to be considered.",
      ],
      highlights: ["brick-red", "flame color", "qualitative clue"],
      curriculum: { volume: "Compulsory 1", chapter: "The flame test" },
    },
    "b-ca-fluorite-crystal": {
      title: "The 1:2 ratio of calcium to fluorine in CaF₂",
      summary: "The formula CaF₂ shows a 1:2 ratio of Ca²⁺ to F⁻ in the crystal, not the number of discrete molecules.",
      paragraphs: [
        "CaF₂ consists of Ca²⁺ and F⁻ ions. Charge balance requires two F⁻ ions for each Ca²⁺ ion. One model of a calcium fluoride unit cell contains 4 calcium ions and 8 fluoride ions.",
        "The 4:8 count in the unit cell simplifies to 1:2, giving the empirical formula CaF₂. A unit cell helps count particles, but the local cell shown in a diagram is not a complete, separate molecule.",
      ],
      highlights: ["Ca²⁺", "F⁻", "unit-cell count"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Ionic crystals and unit-cell counting" },
    },
    "sodium-chloride-ions": {
      title: "What particles make up table salt?",
      summary: "Sodium chloride is formed from sodium and chloride ions; it is not a mixture of metallic sodium and chlorine gas.",
      paragraphs: [
        "A sodium atom loses one electron to become Na⁺, and a chlorine atom gains one electron to become Cl⁻. Ions and neutral atoms are different particles.",
        "NaCl is made of ions, and its formula shows the ratio of Na⁺ to Cl⁻. A solid does not contain separate NaCl molecules one by one.",
      ],
      highlights: ["Na⁺", "Cl⁻", "ratio"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What particles make up table salt?" },
    },
    "cl-symbol": {
      title: "What does Cl represent?",
      summary: "Cl is the chemical symbol for chlorine and, in a microscopic context, can also represent one chlorine atom.",
      paragraphs: [
        "Cl is the chemical symbol for chlorine. It represents the element, not a particular chlorine-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Cl", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Cl represent?" },
    },
    "cl-atom-shells": {
      title: "Reading the shell diagram of a chlorine atom",
      summary: "A neutral chlorine atom has 17 electrons, arranged by shell as 2, 8, 7.",
      paragraphs: [
        "A neutral chlorine atom has nuclear charge +17 and 17 electrons, distributed from the inner shell outward as 2, 8, and 7. A neutral atom has the same total number of electrons as protons in its nucleus.",
        "Chlorine's atomic number is 17, and its outermost shell has 7 electrons. This shell arrangement describes the neutral atom and should not be applied directly to its ions.",
      ],
      highlights: ["atomic number is 17", "7 electrons in its outermost shell"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a chlorine atom" },
    },
    "h-chlorine-combination": {
      title: "The composition of hydrogen chloride",
      summary: "Hydrogen chloride has the formula HCl and is a compound of hydrogen and chlorine.",
      paragraphs: [
        "One hydrogen chloride molecule contains one hydrogen atom and one chlorine atom. Hydrogen chloride, water, and hydrogen peroxide are all hydrogen-containing compounds.",
        "When hydrogen reacts with chlorine to form hydrogen chloride, the original molecules change and new molecules form.",
      ],
      highlights: ["HCl", "hydrogen and chlorine", "new molecules"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "The composition of hydrogen chloride" },
    },
    "c-cl-hcl-vs-solution": {
      title: "Hydrogen chloride and hydrochloric acid",
      summary: "H₂ and Cl₂ combine to form HCl gas; hydrochloric acid is the solution produced when HCl dissolves in water.",
      paragraphs: [
        "Under ignition, H₂ and Cl₂ combine to form HCl in a 1:1:2 ratio. Hydrogen chloride is a gas; only its aqueous solution is called hydrochloric acid. A substance and its aqueous solution should not be written as if they were the same.",
        "In this reaction, hydrogen changes from oxidation state 0 to +1, while chlorine changes from 0 to −1. This differs from the reversible reaction of chlorine with water that forms HCl and HClO.",
      ],
      highlights: ["HCl gas", "hydrochloric acid"],
      curriculum: { volume: "Compulsory 1", chapter: "Chlorine and its compounds" },
    },
    "c-cl-metals": {
      title: "Chlorine reacts with iron and copper",
      summary: "When heated, chlorine reacts with iron and copper to form their corresponding chlorides.",
      paragraphs: [
        "When heated, iron reacts with chlorine to form FeCl₃, while copper reacts with chlorine to form CuCl₂; their balanced coefficient ratios are 2:3:2 and 1:1:1, respectively. Iron burns in oxygen to form Fe₃O₄, so products cannot be swapped when the reactants differ.",
        "Chlorine changes from oxidation state 0 to −1, while iron changes from 0 to +3 and copper from 0 to +2. Chlorine gains electrons and acts as a strong oxidizing agent.",
      ],
      highlights: ["heated", "FeCl₃", "CuCl₂"],
      curriculum: { volume: "Compulsory 1", chapter: "Chlorine and its compounds" },
    },
    "c-cl-water": {
      title: "The reversible reaction in chlorine water",
      summary: "At room temperature, some Cl₂ reacts with water to form HCl and HClO.",
      paragraphs: [
        "At room temperature, some Cl₂ reacts reversibly with water: Cl₂ + H₂O ⇌ HCl + HClO. Both reactants and products are present in chlorine water, so it should not be treated as a pure HClO solution.",
        "HClO is a strong oxidizing agent and is an important reason chlorine water can disinfect. When discussing chlorine-water properties, distinguish the roles of Cl₂, HCl, HClO, and other particles.",
      ],
      highlights: ["reversibly", "HClO"],
      curriculum: { volume: "Compulsory 1", chapter: "Chlorine and its compounds" },
    },
    "c-cl-hclo-light": {
      title: "Photodecomposition of hypochlorous acid",
      summary: "HClO decomposes readily in light, so the properties of chlorine water change when it is left standing.",
      paragraphs: [
        "In light, 2 mol of HClO can decompose into 2 mol of HCl and 1 mol of O₂. Chlorine in HClO changes from +1 to −1, while some oxygen changes from −2 to 0, so this is a redox reaction.",
        "Chlorine water contains several kinds of particles; changes during storage should not be described simply as “all the chlorine gas evaporated.” When considering disinfection and bleaching, account for whether HClO is still present.",
      ],
      highlights: ["in light", "HClO"],
      curriculum: { volume: "Compulsory 1", chapter: "Properties of hypochlorous acid" },
    },
    "c-cl-mno2-hcl": {
      title: "Manganese dioxide and concentrated hydrochloric acid",
      summary: "When heated, MnO₂ can oxidize Cl⁻ in concentrated hydrochloric acid to Cl₂.",
      paragraphs: [
        "When heated, MnO₂ reacts with concentrated HCl to form MnCl₂, Cl₂, and H₂O in a 1:4:1:1:2 ratio. Mn changes from +4 to +2, while some chlorine changes from −1 to 0.",
        "Concentrated hydrochloric acid and heating are essential conditions for this reaction. It should not be rewritten as “MnO₂ releases chlorine gas with any dilute acid.”",
      ],
      highlights: ["concentrated hydrochloric acid", "heated", "Mn(IV) → Mn(II)"],
      curriculum: { volume: "Compulsory 1", chapter: "Chlorine and redox" },
    },
    "c-fe-oxidant-strength": {
      title: "Iron products depend on the oxidizing agent",
      summary: "Dilute hydrochloric acid or CuSO₄ typically produces Fe²⁺ from iron; Cl₂ can produce Fe³⁺.",
      paragraphs: [
        "Iron typically forms Fe²⁺-containing products when it reacts with dilute hydrochloric acid or CuSO₄ solution. With the stronger oxidizing agent Cl₂, it forms FeCl₃, which contains Fe³⁺.",
        "“Iron loses electrons” alone does not determine how many electrons are lost; consider the oxidizing agent and reaction conditions. Iron reacting with hydrochloric acid releases H₂, while iron displacing copper from Cu²⁺ gives a different observation.",
      ],
      highlights: ["Fe²⁺", "Fe³⁺", "oxidizing agent"],
      curriculum: { volume: "Compulsory 1", chapter: "Iron and its compounds" },
    },
    "c-fe-fe2-fe3-cycle": {
      title: "Condition-dependent conversion between Fe²⁺ and Fe³⁺",
      summary: "Iron can reduce Fe³⁺ to Fe²⁺, while chlorine can oxidize Fe²⁺ to Fe³⁺.",
      paragraphs: [
        "2Fe³⁺ + Fe = 3Fe²⁺ shows that elemental iron can reduce Fe³⁺. 2Fe²⁺ + Cl₂ = 2Fe³⁺ + 2Cl⁻ shows that Cl₂ can oxidize Fe²⁺. Each direction requires a reducing agent or an oxidizing agent.",
        "Converting the same element between oxidation states requires an electron donor or acceptor. Do not write that Fe²⁺ “changes by itself” to Fe³⁺ without identifying an oxidizing agent.",
      ],
      highlights: ["Fe³⁺ → Fe²⁺", "Fe²⁺ → Fe³⁺"],
      curriculum: { volume: "Compulsory 1", chapter: "Conversions of iron ions" },
    },
    "cl-pvc-material": {
      title: "Chlorine-containing materials are not chlorine gas",
      summary: "Chlorine is used to make materials such as PVC, but PVC's uses do not apply to chlorine gas.",
      paragraphs: [
        "PVC can be used in pipes, window frames, and electrical-wire insulation. Chlorine in a compound is not the same as chlorine gas stored in a material.",
        "Chlorine gas is toxic. The uses of a finished material do not imply that chlorine gas can be handled or used directly.",
      ],
      highlights: ["chlorine-containing compound", "Chlorine gas is toxic"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: chlorine-containing materials" },
    },
    "c-cl-alkali-hypochlorite": {
      title: "Chlorine reacts with cold sodium hydroxide solution",
      summary: "At room temperature, Cl₂ reacts with NaOH to form NaCl and NaClO.",
      paragraphs: [
        "At room temperature, Cl₂ + 2NaOH = NaCl + NaClO + H₂O. Chlorine changes both from 0 to −1 and from 0 to +1. A reaction in which the same element is simultaneously oxidized and reduced is called disproportionation.",
        "The hypochlorite ion in NaClO is related to HClO, but the salt and the acid are not the same substance. Products can differ at higher temperatures or with more concentrated base, so this equation should not be applied without its conditions.",
      ],
      highlights: ["NaClO", "room temperature", "disproportionation"],
      curriculum: { volume: "Compulsory 1", chapter: "Chlorine and bases" },
    },
    "c-cl-bleaching-powder": {
      title: "Bleaching powder and its active component",
      summary: "Chlorine reacts with Ca(OH)₂ to produce bleaching powder containing Ca(ClO)₂.",
      paragraphs: [
        "Chlorine reacts with Ca(OH)₂ to form Ca(ClO)₂, CaCl₂, and water in a 2:2:1:1:2 ratio. The active component of bleaching powder is Ca(ClO)₂, but bleaching powder itself is a mixture.",
        "Converting ClO⁻ to HClO helps explain effects related to its oxidizing power, but “bleaching powder” should not be written as one pure compound with the formula Ca(ClO)₂.",
      ],
      highlights: ["Ca(ClO)₂", "mixture"],
      curriculum: { volume: "Compulsory 1", chapter: "Bleaching powder" },
    },
    "c-cu-chloride-complex": {
      title: "Ligands around a copper(II) ion",
      summary: "Molecules or ions can bind around Cu²⁺ in a coordination complex; [CuCl₄]²⁻ is one example.",
      paragraphs: [
        "In [CuCl₄]²⁻, four Cl⁻ ions surround the central Cu²⁺ ion, giving the complex an overall charge of −2. The ligands and central ion form a whole complex; the Cl⁻ inside the brackets should not be treated as completely free chloride ions.",
        "The overall charge can be checked as +2 + 4 × (−1) = −2.",
      ],
      highlights: ["central ion", "ligands"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Formation and structure of coordination complexes" },
    },
    "fe-copper-sulfate-reaction": {
      title: "Iron forms elemental copper from solution",
      summary: "Iron reacts with copper sulfate solution to form copper and iron(II) sulfate.",
      paragraphs: [
        "Fe + CuSO₄ = Cu + FeSO₄. Before the reaction, copper is present in copper sulfate; afterward, it is elemental copper.",
      ],
      highlights: ["elemental copper", "copper sulfate"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Iron forms elemental copper from solution" },
    },
    "cu-symbol": {
      title: "What does Cu represent?",
      summary: "Cu is the chemical symbol for copper and, in a microscopic context, can also represent one copper atom.",
      paragraphs: [
        "Cu is the chemical symbol for copper. It represents the element, not a particular copper-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Cu", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Cu represent?" },
    },
    "cu-conductivity-use": {
      title: "Why is copper commonly used in wires?",
      summary: "Copper conducts electricity and heat well and can be drawn into wire, making it useful for electrical wiring.",
      paragraphs: [
        "Copper is widely used in electrical wires and motors; its ease of drawing into wire is another important reason.",
        "These are properties of copper as a metallic element. They should not be applied directly to copper compounds such as copper sulfate.",
      ],
      highlights: ["conducts electricity", "drawn into wire"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: why copper is used in wires" },
    },
    "c-cu-nitric-dilute-conc": {
      title: "Copper reacts differently with dilute and concentrated nitric acid",
      summary: "Nitric acid oxidizes copper to Cu²⁺; dilute acid mainly releases NO, while concentrated acid mainly releases NO₂.",
      paragraphs: [
        "Copper reacts with dilute nitric acid in a 3:8 ratio to form Cu(NO₃)₂, NO, and H₂O; NO is a colorless gas. With concentrated nitric acid, the ratio is 1:4 and the products include Cu(NO₃)₂, reddish-brown NO₂, and H₂O.",
        "In both representative reactions, nitrogen in nitrate is reduced. Do not apply the rule “a metal plus an acid releases H₂.” The nitrogen oxides formed depend on conditions; this comparison describes typical dilute- and concentrated-acid cases.",
      ],
      highlights: ["dilute: NO", "concentrated: NO₂", "does not release H₂"],
      curriculum: { volume: "Compulsory 2", chapter: "The oxidizing properties of nitric acid" },
    },
    "c-cu-hot-conc-sulfuric": {
      title: "Copper and hot concentrated sulfuric acid",
      summary: "When heated with concentrated sulfuric acid, copper is oxidized and SO₂ is produced.",
      paragraphs: [
        "When heated, 1 mol of Cu reacts with 2 mol of concentrated H₂SO₄ to form 1 mol of CuSO₄, 1 mol of SO₂, and 2 mol of H₂O. Sulfur changes from +6 to +4, and copper from 0 to +2.",
        "Here concentrated H₂SO₄ provides the sulfate environment and acts as an oxidizing agent. This reaction should not be applied to dilute sulfuric acid at room temperature; the products described are for the typical hot, concentrated-acid conditions.",
      ],
      highlights: ["hot concentrated sulfuric acid", "SO₂"],
      curriculum: { volume: "Compulsory 2", chapter: "The oxidizing properties of concentrated sulfuric acid" },
    },
    "c-cu-electrorefining": {
      title: "Electrorefining copper",
      summary: "In copper electrorefining, impure copper is the anode and pure copper is the cathode; Cu²⁺ gains electrons and deposits at the cathode.",
      paragraphs: [
        "In copper electrorefining, impure copper is the anode, pure copper is the cathode, and copper sulfate solution is the electrolyte. The main anode reaction is Cu → Cu²⁺ + 2e⁻, while the cathode reaction is Cu²⁺ + 2e⁻ → Cu.",
        "Impurities in the impure copper do not all become Cu²⁺; some can form anode sludge. Electrorefining aims to increase copper purity; it does not produce copper directly from ore in one step.",
      ],
      highlights: ["impure-copper anode", "pure-copper cathode", "anode sludge"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Applications of electrolytic cells" },
    },
    "c-cu-electroplating": {
      title: "Electrode roles in copper plating",
      summary: "During copper plating, the object being plated is the cathode, and the Cu²⁺-containing plating solution supplies copper ions.",
      paragraphs: [
        "For copper plating, the object is connected to the negative terminal of the power supply and serves as the cathode. Copper ions gain electrons on its surface: Cu²⁺ + 2e⁻ → Cu. Copper is usually used as the anode, and a solution containing Cu²⁺ is used as the plating bath.",
        "Electroplating requires an external direct-current supply. It should not be confused with the spontaneous displacement of silver ions by copper.",
      ],
      highlights: ["cathode", "external direct-current supply"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Applications of electrolytic cells" },
    },
    "c-cu-oxide-hydroxide": {
      title: "CuO and Cu(OH)₂",
      summary: "Copper(II) oxide is a black solid, while copper(II) hydroxide is a blue precipitate; they have different compositions.",
      paragraphs: [
        "When copper wire is heated in air, black CuO can form on its surface. Cu(OH)₂ is a sparingly soluble blue hydroxide. Although both contain copper in the +2 oxidation state, they have different compositions and appearances.",
      ],
      highlights: ["black CuO", "sparingly soluble blue hydroxide"],
      curriculum: { volume: "Compulsory 2", chapter: "Copper compounds" },
    },
    "c-mn-permanganate-fe": {
      title: "Permanganate and iron(II) ions in acidic solution",
      summary: "Under suitable acidic conditions, MnO₄⁻ can oxidize Fe²⁺ to Fe³⁺.",
      paragraphs: [
        "In acidic solution, MnO₄⁻ gains five electrons to become Mn²⁺, while each Fe²⁺ loses one electron to become Fe³⁺. Combining the half-reactions gives MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O.",
        "Do not omit the acidic medium: the reduction product of permanganate changes with the reaction conditions. When balancing, conserve the number of electrons, atoms, and total charge.",
      ],
      highlights: ["acidic solution", "electron conservation"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Redox reactions and electrode equations" },
    },
    "fe-symbol": {
      title: "What does Fe represent?",
      summary: "Fe is the chemical symbol for iron and, in a microscopic context, can also represent one iron atom.",
      paragraphs: [
        "Fe is the chemical symbol for iron. It represents the element, not a particular iron-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["Fe", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does Fe represent?" },
    },
    "fe-versus-oxide": {
      title: "Iron and magnetite are different substances",
      summary: "Iron is an elemental substance; magnetite is a compound containing iron and oxygen.",
      paragraphs: [
        "In the reaction described, iron becomes a new substance; this is not just a change in appearance or color.",
        "Fe₃O₄ shows the composition of magnetite and cannot be used interchangeably with Fe, the formula for elemental iron.",
      ],
      highlights: ["elemental substance", "compound"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Iron and magnetite are different substances" },
    },
    "fe-steel": {
      title: "Steel is not pure iron",
      summary: "Ordinary carbon steel contains iron, carbon, and small amounts of other elements; it is an alloy.",
      paragraphs: [
        "Steels have different compositions and properties. Adding other elements to an iron-based material can produce alloys suited to different uses.",
        "Steel should not be treated as pure elemental iron. Carbon and other elements are components of the alloy, not iron itself.",
      ],
      highlights: ["alloy", "steel"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: steel is not pure iron" },
    },
    "fe-oxygen-reaction": {
      title: "What does iron form in oxygen?",
      summary: "In the textbook reaction, an iron wire burns in oxygen to form black magnetite, Fe₃O₄.",
      paragraphs: [
        "When an iron wire is ignited in oxygen, it forms magnetite, Fe₃O₄.",
        "By conservation of atoms, 3 mol of Fe reacts with 2 mol of O₂ to form 1 mol of Fe₃O₄ when ignited. The product should not be written as Fe₂O₃.",
      ],
      highlights: ["Fe₃O₄"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does iron form in oxygen?" },
    },
    "c-fe-steam": {
      title: "Red-hot iron and steam",
      summary: "Iron shows no obvious reaction with water at room temperature, but at high temperature it can react with steam to form Fe₃O₄ and H₂.",
      paragraphs: [
        "At high temperature, 3 mol of Fe reacts with 4 mol of steam to form 1 mol of Fe₃O₄ and 4 mol of H₂. The reactant is steam; this equation should not be applied directly to liquid water at room temperature.",
        "The average oxidation state of iron in Fe₃O₄ is +8/3, reflecting mixed oxidation states. The product should not be changed to Fe₂O₃ just to obtain a single oxidation state.",
      ],
      highlights: ["high temperature", "H₂O(g)", "Fe₃O₄"],
      curriculum: { volume: "Compulsory 1", chapter: "Iron and steam" },
    },
    "c-fe-three-oxides": {
      title: "Distinguishing FeO, Fe₂O₃, and Fe₃O₄",
      summary: "Three common iron oxides differ in composition, color, and reactions with acids.",
      paragraphs: [
        "FeO is black and contains iron in the +2 oxidation state. Fe₂O₃ is reddish brown and contains iron in the +3 state. Fe₃O₄ is black and magnetic; it can be viewed as FeO·Fe₂O₃ and contains both Fe(II) and Fe(III).",
        "FeO + 2H⁺ = Fe²⁺ + H₂O, while Fe₂O₃ + 6H⁺ = 2Fe³⁺ + 3H₂O. The iron ions formed when these two oxides react with acid differ; do not treat the formulas as interchangeable just because both compounds contain iron.",
      ],
      highlights: ["FeO is black", "Fe₂O₃ is reddish brown", "Fe₃O₄ is magnetic and black"],
      curriculum: { volume: "Compulsory 1", chapter: "Iron oxides" },
    },
    "c-fe-nitric-passivation": {
      title: "How iron reacts with nitric acid depends on conditions",
      summary: "Iron reacts with dilute nitric acid; concentrated nitric acid passivates iron at room temperature.",
      paragraphs: [
        "At room temperature, concentrated nitric acid forms a dense oxide film on iron that prevents the acid from continuing to react. This is called passivation. Iron can still react with concentrated nitric acid when heated, so it is incorrect to say that iron never reacts with concentrated nitric acid.",
        "Nitric acid is an oxidizing acid. Do not apply the observation that iron releases H₂ in dilute hydrochloric acid directly to dilute nitric acid. State the concentration and temperature; a single product should not be assumed for all conditions.",
      ],
      highlights: ["concentrated nitric acid at room temperature", "dense oxide film", "reacts when heated"],
      curriculum: { volume: "Compulsory 2", chapter: "Properties of nitric acid" },
    },
    "c-fe-variable-valence": {
      title: "Iron(II) and iron(III) ions",
      summary: "Fe²⁺ and Fe³⁺ have different charges and can be interconverted through redox reactions.",
      paragraphs: [
        "An iron atom that loses two electrons can be represented as Fe²⁺. If Fe²⁺ loses one more electron, it becomes Fe³⁺. In oxidation-state terms, the change from +2 to +3 is oxidation.",
        "Fe³⁺ can gain electrons from a suitable reducing agent such as iron and become Fe²⁺. Fe²⁺ can be oxidized to Fe³⁺ by an oxidizing agent such as chlorine water. Name the reacting substance when describing a change in oxidation state.",
      ],
      highlights: ["Fe²⁺", "Fe³⁺"],
      curriculum: { volume: "Compulsory 1", chapter: "Redox and common metal ions" },
    },
    "c-fe-thiocyanate": {
      title: "The color reaction of Fe³⁺ with thiocyanate",
      summary: "Fe³⁺ and SCN⁻ form a deep-red complex, which can be used as a qualitative clue.",
      paragraphs: [
        "Fe³⁺ + SCN⁻ ⇌ [FeSCN]²⁺ represents thiocyanate binding to an iron(III) ion and producing a deep-red solution.",
        "Fe²⁺ alone does not produce the same red color with SCN⁻. If Fe²⁺ in a sample is first oxidized to Fe³⁺, the color result can change. Consider interference from other colored components when identifying the sample.",
      ],
      highlights: ["deep-red", "Fe³⁺"],
      curriculum: { volume: "Compulsory 1", chapter: "Testing for iron(III) ions" },
    },
    "c-fe-hydroxide": {
      title: "Iron(III) ions and hydroxide ions",
      summary: "Fe³⁺ combines with OH⁻ to form a reddish-brown iron(III) hydroxide precipitate.",
      paragraphs: [
        "Fe³⁺ + 3OH⁻ → Fe(OH)₃↓ describes the formation of a reddish-brown iron(III) hydroxide precipitate. It is different from metallic iron and magnetite.",
        "A reddish-brown precipitate is a clue for Fe³⁺. For confirmation, consider other evidence, such as the red color produced when Fe³⁺ reacts with SCN⁻.",
      ],
      highlights: ["Fe(OH)₃", "reddish-brown"],
      curriculum: { volume: "Compulsory 1", chapter: "Properties of iron ions" },
    },
    "c-fe-hydroxide2-oxidation": {
      title: "Oxidation of Fe(OH)₂ by air",
      summary: "White Fe(OH)₂ gradually changes into reddish-brown Fe(OH)₃ in air.",
      paragraphs: [
        "Fe(OH)₂ reacts with O₂ and water in air: 4Fe(OH)₂ + O₂ + 2H₂O = 4Fe(OH)₃. The precipitate gradually changes from white through gray-green to reddish brown as Fe(II) is oxidized to Fe(III).",
        "This explains why the appearance of iron(II) hydroxide changes with exposure to air. The final reddish-brown color does not prove that the original sample contained only Fe³⁺.",
      ],
      highlights: ["white → gray-green → reddish brown", "Fe(II) is oxidized"],
      curriculum: { volume: "Compulsory 1", chapter: "Iron hydroxides" },
    },
    "c-fe-rust-electrochem": {
      title: "Electrochemical corrosion of iron and sacrificial-anode protection",
      summary: "Iron can undergo electrochemical corrosion in a damp environment; a zinc layer can change the corrosion pathway.",
      paragraphs: [
        "Different regions on an iron surface can form tiny galvanic cells. Iron loses electrons to form Fe²⁺, and corrosion products form gradually with the participation of water and oxygen. Rusting is therefore not one simple combination reaction.",
        "An intact zinc coating separates iron from the environment. If it is locally damaged, zinc can still be oxidized before iron when it remains electrically connected to the iron and an electrolyte is present. Corrosion depends on the environment and cannot always be represented by one overall equation.",
      ],
      highlights: ["Iron loses electrons", "zinc is oxidized first"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Metal corrosion and protection" },
    },
    "c-zn-sacrificial-anode": {
      title: "Zinc protects iron as a sacrificial anode",
      summary: "Zinc is more reactive than iron and is oxidized first when it forms a galvanic cell with steel.",
      paragraphs: [
        "When a zinc block is electrically connected to steel in an electrolyte, the more reactive zinc acts as the anode and is oxidized first, protecting the steel as the cathode. Zinc is gradually consumed, so the protection needs to be inspected and renewed.",
        "This is electrochemical protection, unlike the environmental barrier provided by an intact coating alone. Without effective electrical contact and an ionic pathway, the sacrificial-anode conclusion cannot be applied directly.",
      ],
      highlights: ["zinc anode", "iron is protected"],
      curriculum: { volume: "Selective Compulsory 1", chapter: "Metal corrosion and protection" },
    },
    "f-symbol": {
      title: "What does F represent?",
      summary: "F is the chemical symbol for fluorine and, in a microscopic context, can also represent one fluorine atom.",
      paragraphs: [
        "F represents the element fluorine and, in a microscopic context, one fluorine atom. It does not represent a particular fluorine-containing compound. A one-letter element symbol is uppercase.",
      ],
      highlights: ["F", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does F represent?" },
    },
    "f-atom-shells": {
      title: "Reading the shell diagram of a fluorine atom",
      summary: "A neutral fluorine atom has 9 electrons, arranged by shell as 2, 7.",
      paragraphs: [
        "A neutral fluorine atom has nuclear charge +9 and 9 electrons, distributed from the inner shell outward as 2 and 7. A neutral atom has the same total number of electrons as protons in its nucleus.",
        "Fluorine's atomic number is 9, and its outermost shell has 7 electrons. This electron count is for a neutral atom; recalculate the electron count when discussing an ion.",
      ],
      highlights: ["atomic number is 9", "7 electrons in its outermost shell"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a fluorine atom" },
    },
    "b-f-halogen-trend": {
      title: "Fluorine is at the top of the halogen group",
      summary: "F, Cl, Br, and I atoms each have 7 outer-shell electrons; F₂ is the strongest oxidizing agent among the common halogens.",
      paragraphs: [
        "Fluorine is in Period 2 and Group 17 (VIIA), alongside chlorine, bromine, and iodine in the halogen group. Each atom has 7 outer-shell electrons and commonly gains an electron to form a halide ion with a −1 charge.",
        "The oxidizing strength of the common elemental halogens follows F₂ > Cl₂ > Br₂ > I₂. This order describes a periodic trend, but it does not mean that F₂ reacts with every substance under the same conditions.",
      ],
      highlights: ["Group 17 (VIIA)", "7 valence electrons", "oxidizing-strength trend"],
      curriculum: { volume: "Compulsory 1", chapter: "Trends among the halogens" },
    },
    "b-f-hf-vs-fluoride": {
      title: "F₂, HF, and F⁻ are different substances or particles",
      summary: "F₂ is elemental fluorine, HF is a hydrogen halide, and F⁻ is a fluoride ion; similar names do not mean identical particles or properties.",
      paragraphs: [
        "Elemental fluorine reacts with hydrogen: H₂ + F₂ → 2HF, forming hydrogen fluoride. On the left, F₂ is a diatomic molecule; on the right, HF is a compound, and fluorine changes from oxidation state 0 to −1.",
        "F⁻ is an ion formed when a fluorine atom gains an electron, and it can occur in fluorides. Keep HF and F⁻ distinct; the strong oxidizing power of elemental fluorine should not be assigned to every fluorine-containing compound.",
      ],
      highlights: ["F₂", "HF", "F⁻"],
      curriculum: { volume: "Compulsory 1", chapter: "Hydrogen halides and fluorides" },
    },
    "b-f-caf2-crystal": {
      title: "Fluoride ions and the CaF₂ unit cell",
      summary: "The CaF₂ crystal model gives a 2:1 count of F⁻ to Ca²⁺, linking the structure to the chemical formula.",
      paragraphs: [
        "In calcium fluoride, fluorine is present as F⁻ ions, not as F₂ molecules. The +2 charge of Ca²⁺ is balanced by the total −2 charge of two F⁻ ions, so the empirical formula is CaF₂.",
        "One unit-cell model of calcium fluoride contains 4 Ca²⁺ and 8 F⁻ ions, which simplifies to 1:2. Unit-cell counting helps explain the formula, but an ionic crystal is not a collection of separate CaF₂ molecules.",
      ],
      highlights: ["F⁻", "CaF₂", "unit-cell ratio"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Structure and composition of ionic crystals" },
    },
    "f-fluoropolymer-material": {
      title: "Fluoropolymers are different from fluorine gas",
      summary: "PTFE is used in nonstick materials and cable insulation; these uses belong to a fluoropolymer.",
      paragraphs: [
        "PTFE is used in a range of materials because of properties such as its nonstick surface, and it can also be used as cable insulation. These properties belong to the polymer material.",
        "Fluorine gas, F₂, is a different substance that is highly reactive and toxic. The uses of PTFE do not mean that fluorine gas can be handled or used directly.",
      ],
      highlights: ["PTFE", "fluorine gas, F₂"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: fluoropolymers are not fluorine gas" },
    },
    "he-symbol": {
      title: "What does He represent?",
      summary: "He is the chemical symbol for helium and, in a microscopic context, can also represent one helium atom.",
      paragraphs: [
        "He is the chemical symbol for helium. It represents the element, not a particular helium-containing compound.",
        "In a two-letter element symbol, the first letter is uppercase and the second is lowercase.",
      ],
      highlights: ["He", "chemical symbol"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What does He represent?" },
    },
    "he-atom-shells": {
      title: "Reading the shell diagram of a helium atom",
      summary: "A neutral helium atom has 2 electrons, both in the first shell.",
      paragraphs: [
        "A neutral helium atom has nuclear charge +2 and 2 electrons, both in the first shell. A neutral atom has the same total number of electrons as protons in its nucleus.",
        "Helium's atomic number is 2, and its outermost shell has 2 electrons. This shell arrangement describes the neutral atom and should not be applied directly to its ions.",
      ],
      highlights: ["atomic number is 2", "2 electrons in its outermost shell"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Reading the shell diagram of a helium atom" },
    },
    "he-stable-shell": {
      title: "Helium's relatively stable electron arrangement",
      summary: "A helium atom has one electron shell; its two electrons form a relatively stable arrangement.",
      paragraphs: [
        "A helium atom has only one electron shell, which holds 2 electrons. The common eight-electron outer-shell pattern of other noble gases should not be applied to helium.",
        "Helium and other noble gases are usually unreactive, but “relatively stable” does not mean incapable of reacting under every condition.",
      ],
      highlights: ["one shell", "two electrons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Helium's relatively stable electron arrangement" },
    },
    "he-low-temperature-use": {
      title: "Uses of helium in low-temperature equipment",
      summary: "Helium can be used as a coolant for large equipment and superconducting magnets.",
      paragraphs: [
        "MRI scanners, nuclear magnetic resonance instruments, and the Large Hadron Collider can all use helium for low-temperature cooling.",
      ],
      highlights: ["coolant", "low-temperature cooling"],
      curriculum: { volume: "Extension", chapter: "Beyond the textbook: helium and low-temperature technology" },
    },
    "h-identity": {
      title: "Atomic number and proton number",
      summary: "Hydrogen has atomic number 1, and a hydrogen atom's nucleus contains one proton.",
      paragraphs: [
        "The atomic number is numerically equal to the nuclear charge. A hydrogen nucleus contains one proton, so hydrogen's atomic number is 1.",
        "Elements are distinguished by the number of protons in their nuclei, not just by the color or state of a substance.",
      ],
      highlights: ["atomic number is 1", "one proton"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Atomic number and proton number" },
    },
    "h-neutral": {
      title: "Electrons in a neutral atom",
      summary: "A neutral hydrogen atom has one proton and one electron outside the nucleus.",
      paragraphs: [
        "The total number of electrons in a neutral atom equals the number of protons in its nucleus, so a neutral hydrogen atom has one electron.",
        "The circular shell diagram represents the shells and electron count; it is not the actual path followed by an electron.",
      ],
      highlights: ["one electron", "total number of electrons equals the number of protons"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Electrons in a neutral atom" },
    },
    "h-isotopes": {
      title: "Isotopes of hydrogen",
      summary: "¹H, ²H, and ³H each have one proton and have 0, 1, and 2 neutrons, respectively.",
      paragraphs: [
        "Protium ¹H, deuterium ²H, and tritium ³H have the same number of protons but different numbers of neutrons, so they are isotopes of hydrogen. Their mass numbers are 1, 2, and 3, respectively.",
        "Mass number is the sum of the numbers of protons and neutrons. ²H can also be written D, and ³H can be written T; tritium is radioactive. Changing the number of neutrons does not change hydrogen into another element.",
      ],
      highlights: ["one proton", "0, 1, and 2", "same number of protons", "different numbers of neutrons"],
      curriculum: { volume: "Extension", chapter: "Isotopes of hydrogen" },
    },
    "h-configuration": {
      title: "Ground-state electron configuration: 1s¹",
      summary: "The ground-state electron configuration of a neutral hydrogen atom is 1s¹; the shell diagram is a simplified model.",
      paragraphs: [
        "The single electron in a ground-state neutral hydrogen atom occupies the 1s orbital. In 1s¹, the first 1 gives the shell number, s names the subshell, and the superscript 1 means that the subshell contains one electron.",
        "The circular shell diagram only represents shells and electron counts; it does not mean that an electron travels along a fixed circle. An atomic orbital describes the probability distribution for finding an electron in space.",
      ],
      highlights: ["1s¹", "simplified model", "probability distribution"],
      curriculum: { volume: "Extension", chapter: "Ground-state electron configuration: 1s¹" },
    },
    "h-molecule": {
      title: "Element symbols and chemical formulas",
      summary: "H is the element symbol for hydrogen; H₂ is the chemical formula for hydrogen gas.",
      paragraphs: [
        "H can represent the element hydrogen and, in a microscopic context, one hydrogen atom. H₂ can represent hydrogen gas or one hydrogen molecule; use the context to determine which meaning applies.",
        "One hydrogen molecule contains two hydrogen atoms. The subscript 2 in H₂ gives the number of hydrogen atoms in the molecule.",
      ],
      highlights: ["element symbol", "one hydrogen molecule contains two hydrogen atoms"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Element symbols and chemical formulas" },
    },
    "h-distinction": {
      title: "The difference between an element and an elemental substance",
      summary: "Containing the element hydrogen does not mean that a substance contains hydrogen gas.",
      paragraphs: [
        "Water and hydrogen gas both contain hydrogen as an element, but water is a compound and hydrogen gas is an elemental substance. They are different substances.",
        "Saying that a substance contains an element describes its composition; it does not show that the elemental substance itself is mixed into it.",
      ],
      highlights: ["does not mean it contains hydrogen gas", "water is a compound", "hydrogen gas is an elemental substance"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "The difference between an element and an elemental substance" },
    },
    "h-gas-properties": {
      title: "Properties of hydrogen gas",
      summary: "Hydrogen gas is colorless and odorless, sparingly soluble in water, and less dense than air.",
      paragraphs: [
        "These properties belong to hydrogen gas and should not be applied to every hydrogen-containing compound.",
        "Hydrogen gas is flammable. It can explode when mixed with a certain proportion of air or oxygen. A property description depends on the substance and the conditions.",
      ],
      highlights: ["sparingly soluble in water", "less dense than air", "flammable"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Properties of hydrogen gas" },
    },
    "h-energy-carrier": {
      title: "Why is hydrogen called an energy carrier?",
      summary: "Hydrogen can store and transport energy supplied from other sources; producing it by water electrolysis requires electrical energy.",
      paragraphs: [
        "Hydrogen is an energy carrier. In water electrolysis, for example, electrical energy is supplied to convert water into hydrogen and oxygen. Hydrogen can then be used later or elsewhere to access that chemical energy.",
        "Assess total emissions by considering both hydrogen production and use. A pure-hydrogen fuel cell produces water during operation, but some production routes, such as natural-gas reforming, can also produce pollutants and carbon dioxide. Looking only at the water produced during use gives an incomplete picture.",
      ],
      highlights: ["water electrolysis requires electrical energy", "energy carrier"],
      curriculum: { volume: "Extension", chapter: "Why is hydrogen called an energy carrier?" },
    },
    "h-water": {
      title: "The composition of water",
      summary: "Water has the formula H₂O; one water molecule contains two hydrogen atoms and one oxygen atom.",
      paragraphs: [
        "At the macroscopic level, water is composed of hydrogen and oxygen. At the microscopic level, water consists of water molecules.",
        "The subscript 2 in H₂O means that one water molecule contains two hydrogen atoms. The omitted subscript 1 after O means that it contains one oxygen atom.",
      ],
      highlights: ["hydrogen and oxygen", "two hydrogen atoms and one oxygen atom"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "The composition of water" },
    },
    "h-peroxide": {
      title: "The composition of hydrogen peroxide",
      summary: "Hydrogen peroxide has the formula H₂O₂, so its molecular composition differs from water.",
      paragraphs: [
        "One hydrogen peroxide molecule contains two hydrogen atoms and two oxygen atoms; one water molecule contains two hydrogen atoms and one oxygen atom.",
        "The two substances contain the same kinds of elements but have different molecular compositions and different chemical properties.",
      ],
      highlights: ["H₂O₂", "different molecular compositions"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "The composition of hydrogen peroxide" },
    },
    "h-comparison": {
      title: "Molecular composition and substance properties",
      summary: "Water and hydrogen peroxide both contain hydrogen and oxygen, but they are not the same substance.",
      paragraphs: [
        "When comparing H₂O and H₂O₂, consider both the kinds of elements and the number of atoms of each element in a molecule.",
        "Knowing which elements a substance contains is not enough to identify the substance or conclude that it has the same properties as another substance.",
      ],
      highlights: ["not the same substance", "number of atoms"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Molecular composition and substance properties" },
    },
    "h-water-vapor": {
      title: "Physical and chemical changes",
      summary: "When water evaporates, the molecules stay the same; when water decomposes by electrolysis, new molecules form.",
      paragraphs: [
        "Liquid water changing into water vapor is a physical change. Water molecules do not turn into hydrogen or oxygen molecules.",
        "The electrolysis of water is a chemical change. Atoms in water molecules rearrange to form hydrogen and oxygen molecules.",
      ],
      highlights: ["molecules stay the same", "new molecules form"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Physical and chemical changes" },
    },
    "h-hydrogen-bond": {
      title: "Hydrogen bonds between water molecules",
      summary: "Hydrogen bonds between water molecules help explain water's relatively high boiling point and affect the structure of ice.",
      paragraphs: [
        "Within a water molecule, hydrogen and oxygen atoms are joined by covalent bonds. Hydrogen bonds can also form between neighboring water molecules. A hydrogen bond is an intermolecular force, different from the O—H covalent bond inside a water molecule.",
        "Hydrogen bonds strengthen attractions between water molecules, contributing to water's relatively high melting and boiling points. In ice, hydrogen bonds hold water molecules in a more open arrangement, which is related to ice being less dense than liquid water.",
      ],
      highlights: ["hydrogen bonds", "intermolecular force"],
      curriculum: { volume: "Selective Compulsory 2", chapter: "Hydrogen bonds between water molecules" },
    },
    "h-combustion": {
      title: "Combustion of hydrogen",
      summary: "When ignited, hydrogen reacts with oxygen to form water.",
      paragraphs: [
        "Balanced equation: 2H₂ + O₂ → 2H₂O. The reaction condition is ignition.",
        "The coefficient ratio 2:1:2 gives the relative numbers of hydrogen molecules, oxygen molecules, and water molecules that react or form; it is not a mass ratio.",
      ],
      highlights: ["ignition", "2:1:2", "not a mass ratio"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Combustion of hydrogen" },
    },
    "h-electrolysis": {
      title: "Electrolysis of water",
      summary: "When electrical current passes through water, it decomposes into hydrogen and oxygen.",
      paragraphs: [
        "Under electrolysis conditions, the balanced overall equation is 2H₂O → 2H₂↑ + O₂↑.",
        "This is a decomposition reaction. The coefficient ratio of hydrogen to oxygen is 2:1, and the elements in the gases come from the water.",
      ],
      highlights: ["electrolysis", "decomposition reaction", "2:1"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Electrolysis of water" },
    },
    "h-peroxide-decomposition": {
      title: "Decomposition of hydrogen peroxide",
      summary: "Hydrogen peroxide decomposes to form water and oxygen; manganese dioxide speeds up the reaction.",
      paragraphs: [
        "With MnO₂ as a catalyst, hydrogen peroxide decomposes according to 2H₂O₂ → 2H₂O + O₂↑.",
        "Hydrogen peroxide decomposes slowly by itself at room temperature. A catalyst changes the reaction rate, while the products remain water and oxygen.",
      ],
      highlights: ["water and oxygen", "MnO₂ as a catalyst", "changes the reaction rate"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Decomposition of hydrogen peroxide" },
    },
    "h-catalyst": {
      title: "What a catalyst does",
      summary: "A catalyst changes the reaction rate and remains unchanged in mass and chemical properties after the reaction.",
      paragraphs: [
        "For the hydrogen peroxide decomposition discussed here, manganese dioxide acts as a catalyst and speeds up the reaction.",
        "A catalyst is written above the reaction arrow as a condition and is not part of the overall stoichiometric relationship. Do not treat manganese dioxide as an oxygen-containing reactant consumed in this reaction.",
      ],
      highlights: ["changes the reaction rate", "unchanged in mass and chemical properties"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "What a catalyst does" },
    },
    "h-conservation": {
      title: "Conservation of atoms and balancing equations",
      summary: "After balancing, the number of atoms of each element is the same on both sides of an equation.",
      paragraphs: [
        "In 2H₂ + O₂ → 2H₂O, each side contains four hydrogen atoms and two oxygen atoms.",
        "To balance an equation, adjust coefficients. Do not change subscripts in a chemical formula, because that changes the composition of the substance.",
      ],
      highlights: ["the number of atoms is the same", "adjust coefficients", "do not change subscripts"],
      curriculum: { volume: "Grade 9 · Volume 1", chapter: "Conservation of atoms and balancing equations" },
    },
    "h-oxidation": {
      title: "Oxidation states of hydrogen",
      summary: "Hydrogen has oxidation state 0 in H₂, +1 in H₂O, and −1 in NaH.",
      paragraphs: [
        "An element in its elemental form has oxidation state 0, so hydrogen in H₂ is 0. By common rules, hydrogen is usually +1 in compounds with nonmetals and −1 in binary hydrides with metals; H₂O and NaH are examples.",
        "Oxidation state is a formal bookkeeping method for analyzing redox behavior. Writing hydrogen as +1 in H₂O does not mean that free H⁺ ions exist in a water molecule. Always identify the substance in which hydrogen occurs.",
      ],
      highlights: ["0 in H₂", "+1 in H₂O", "−1 in NaH", "formal bookkeeping method"],
      curriculum: { volume: "Extension", chapter: "Oxidation states of hydrogen" },
    },
    "h-fuel-cell": {
      title: "How a hydrogen-oxygen reaction produces electricity",
      summary: "The overall reaction in a hydrogen-oxygen fuel cell is 2H₂ + O₂ → 2H₂O, with electrical energy and heat released.",
      paragraphs: [
        "A hydrogen-oxygen fuel cell carries out the reaction between hydrogen and oxygen at electrodes, converting released chemical energy into electrical energy and heat. The overall stoichiometric equation is 2H₂ + O₂ → 2H₂O.",
        "For a proton-exchange-membrane fuel cell, hydrogen at the anode produces protons and electrons. Protons pass through the membrane, while electrons travel through the external circuit. At the cathode, oxygen combines with protons and electrons to form water. The reaction continues only while fuel and oxidant are supplied.",
      ],
      highlights: ["electrical energy and heat", "electrons travel through the external circuit", "protons pass through the membrane"],
      curriculum: { volume: "Extension", chapter: "How a hydrogen-oxygen reaction produces electricity" },
    },
    "h-cuo-reduction": {
      title: "Hydrogen reduces copper(II) oxide",
      summary: "When heated, hydrogen can convert copper(II) oxide to copper while forming water.",
      paragraphs: [
        "When heated, CuO reacts with H₂ in a 1:1 ratio to form Cu and H₂O. Copper in copper(II) oxide changes from +2 to 0, while hydrogen changes from 0 to +1.",
        "Here hydrogen is the reducing agent and copper(II) oxide is the oxidizing agent. Oxidation-state changes and electron transfer describe redox more fully than asking only whether oxygen was gained or lost.",
      ],
      highlights: ["reducing agent", "oxidizing agent"],
      curriculum: { volume: "Compulsory 1", chapter: "Hydrogen reduces copper(II) oxide" },
    },
  },
  gaps: {
    "h:map": "The core cards were checked against a public mirror of the 2024-approved Chinese-language Grade 9, Volume 1 textbook; the printing in the reader's own copy has not been matched. High-school candidate text was read, but the cover match and remote page links remain unverified. Five advanced cards are classified as extensions based on reliable references; they are not claimed to align with the high-school textbook or to cover the topic exhaustively.",
    "i:map": "Some new iodine cards still lack their specified Chinese-language textbook page. Checking a candidate edition does not establish a match to the reader's copy; see coverage.json for element-specific gaps.",
    "k:map": "The reader's textbook printing has not been matched to the local public candidate PDF. Some derivations, reference-supported transformations, and crystal-cell examples lack an exact page match in the specified volume, so their textbookMatch remains pending.",
    "k:permanganate-decomposition": "The catalog has no equation ID for potassium permanganate decomposition or substance ID for potassium manganate; the peroxide-redox ID was not reused.",
    "li:li-battery-alloy-uses": "The catalog has no substance ID for the specific battery materials or lithium-containing alloy in this card. Lithium is linked only as a related substance; no battery composition is inferred.",
    "li:map": "The reader's textbook printing has not been matched to the local public candidate PDF. Some derivations, reference-supported transformations, and crystal-cell examples lack an exact page match in the specified volume, so their textbookMatch remains pending.",
    "mg:map": "The reader's textbook printing has not been matched to the local public candidate PDF. Some derivations, reference-supported transformations, and crystal-cell examples lack an exact page match in the specified volume, so their textbookMatch remains pending.",
    "mg:mg-lightweight-alloys": "The catalog has no substance ID for the specific magnesium-containing alloy in this card. Magnesium is linked only as a related constituent and does not represent the finished alloy.",
    "mn:map": "Some new manganese cards still lack their specified Chinese-language textbook page. Checking a candidate edition does not establish a match to the reader's copy; see coverage.json for element-specific gaps.",
    "n:map": "Specific equations for reactions of concentrated or dilute nitric acid with metals have not yet been independently checked page by page as separate cards.",
    "na:map": "The reader's textbook printing has not been matched to the local public candidate PDF. Some derivations, reference-supported transformations, and crystal-cell examples lack an exact page match in the specified volume, so their textbookMatch remains pending.",
    "o:air-composition": "The catalog has no separate substance ID for air as a mixture. This card links only the oxygen and nitrogen components it discusses; no air ID was invented.",
    "o:map": "The peroxide and electrochemical oxygen-electrode topics could be expanded further; the existing core oxygen cards are reused from the main pack.",
    "p:map": "Direct textbook support for the properties of phosphoric acid and phosphate salts, and for fertilizer uses of phosphorus, was not sufficient in this review. These topics remain gaps rather than being added without evidence.",
    "p:p-oxygen-reaction": "The catalog has no equation ID for phosphorus combustion or substance ID for a phosphorus oxide; no IDs were invented to fill the card.",
    "p:p-phosphate-biomolecules": "The catalog has no substance IDs for DNA, RNA, or ATP. These are explained in the text only; no substance IDs were invented.",
    "s:map": "Tests for sulfate ions and the broader properties of the H₂S system have not yet been developed into sufficiently supported cards.",
    "s:s-oxygen-reaction": "The catalog has no equation ID for sulfur combustion or substance ID for sulfur dioxide. No IDs were invented; the S₈ molecule is presented separately as an extension to distinguish it from the textbook's stoichiometric notation S.",
    "si:map": "Scientific facts for the SiO₂–base and sodium-silicate–acid transformations were checked against a public textbook reference, but the corresponding page in the Chinese-language People's Education Press Compulsory 2 textbook has not been verified. Silica gel is not simplified to a fixed H₂SiO₃ formula.",
    "zn:map": "Some new zinc cards still lack their specified Chinese-language textbook page. Checking a candidate edition does not establish a match to the reader's copy; see coverage.json for element-specific gaps.",
    "zn:zn-galvanised-material": "The catalog has no substance ID for galvanized steel. Zinc and iron are linked only as related coating and substrate materials; they do not represent the complete material as a single pure substance.",
    "ag:ag-surface-tarnish": "The catalog has no silver sulfide substance ID or matching reaction ID for this surface-darkening card, so neither was invented.",
    "ag:ag-halide-light-response": "The catalog includes silver bromide but no silver iodide substance ID; potassium iodide was not substituted.",
    "ag:map": "Some new cards still lack their specified textbook page. A checked candidate edition does not establish a match to a reader's copy; see coverage.json for the element-by-element gaps.",
    "al:al-alloy-strength": "The catalog has no aluminum-alloy substance ID, so only aluminum is linked. The textbook page for the oxide film has not been checked, and this card does not add that mechanism.",
    "al:map": "The printing of the reader's textbook has not been matched to the local public candidate PDF. Some derivations, reference-supported conversions, and crystal-cell examples lack an exact page match in the specified volume, so their textbookMatch remains pending.",
    "br:br-liquid-molecule": "Room-temperature state and molecular form are included only as a reliable-reference extension. The matching body text in the specified high-school textbook has not been verified, so this is not presented as core textbook alignment.",
    "br:map": "Some new cards still lack their specified textbook page. A checked candidate edition does not establish a match to a reader's copy; see coverage.json for the element-by-element gaps.",
    "ba:map": "The printing of the reader's textbook has not been matched to the local public candidate PDF. Some derivations, reference-supported conversions, and crystal-cell examples lack an exact page match in the specified volume, so their textbookMatch remains pending.",
    "c:c-allotropes": "The catalog has no diamond substance ID; graphite is linked where applicable, and no diamond ID was invented.",
    "c:c-fullerene": "The catalog has no C₆₀ substance ID, so the substanceIds field is left empty.",
    "c:c-adsorption": "The catalog has no charcoal or activated-carbon substance ID, so no other carbon form was substituted.",
    "c:c-combustion": "The catalog has no IDs for the two carbon-combustion equations or for carbon monoxide, so IDs from other carbon reactions were not substituted.",
    "c:map": "The new CO/CO₂ and carbonate-system cards use OpenStax to verify scientific facts, but the exact Grade 9 textbook pages have not been checked; their textbookMatch remains pending. The esterification and hydrolysis cards were checked against Selective Compulsory 3, pp. 76 and 78. Isomerism, spectroscopy, and quantitative problem types have not been fully covered.",
    "ca:map": "The printing of the reader's textbook has not been matched to the local public candidate PDF. Some derivations, reference-supported conversions, and crystal-cell examples lack an exact page match in the specified volume, so their textbookMatch remains pending.",
    "cl:cl-pvc-material": "The catalog has no PVC substance ID, so the substanceIds field is left empty.",
    "cl:map": "Some new cards still lack their specified textbook page. A checked candidate edition does not establish a match to a reader's copy; see coverage.json for the element-by-element gaps.",
    "cu:fe-copper-sulfate-reaction": "The catalog has no ID for the Fe + CuSO₄ reaction or for iron(II) sulfate; equationIds is left empty rather than reusing the zinc-copper-sulfate reaction ID.",
    "cu:map": "Some new cards still lack their specified textbook page. A checked candidate edition does not establish a match to a reader's copy; see coverage.json for the element-by-element gaps.",
    "fe:fe-steel": "The catalog has no steel-alloy substance ID. Iron is linked only as a related matrix material and does not represent the whole piece of steel.",
    "fe:map": "Some new cards still lack their specified textbook page. A checked candidate edition does not establish a match to a reader's copy; see coverage.json for the element-by-element gaps.",
    "f:f-fluoropolymer-material": "The catalog has no PTFE substance ID, so the substanceIds field is left empty rather than substituting sodium fluoride.",
    "f:map": "The printing of the reader's textbook has not been matched to the local public candidate PDF. Some derivations, reference-supported conversions, and crystal-cell examples lack an exact page match in the specified volume, so their textbookMatch remains pending.",
    "h:h-chlorine-combination": "The Grade 9, Volume 1 reaction facts were checked on p. 59. The project equation catalog has no ID for H₂ + Cl₂ forming HCl, so equationIds is left empty and no ID was invented.",
    "h:h-electrolysis": "The existing water-electrolysis catalog note includes a gas-volume ratio and additives. This card uses only the reaction facts read on p. 94 and an independently balanced equation; it does not present the blank investigation table on p. 92 as an answer for the volume ratio.",
    "h:map:0": "The core cards were checked against the public mirror of the 2024-approved Grade 9, Volume 1 textbook; the exact printing in the reader's copy has not been matched. High-school candidate text has been read, but the cover match and remote page links remain unverified. Five advanced cards are currently classified as extensions based on reliable references; they are not claimed to align with the high-school textbook or exhaust the topic.",
    "h:map:1": "The existing 20 cards remain unchanged; this pack adds only the high-school hydrogen-bond and copper(II)-oxide reduction cards. Independent verification of the original cards against the reader's printing is still pending.",
  },
};

const volumeEnglish: Record<string, string> = {
  九年级上册: "Grade 9 · Volume 1",
  必修第一册: "Compulsory 1",
  必修第二册: "Compulsory 2",
  选择性必修第一册: "Selective Compulsory 1",
  选择性必修第二册: "Selective Compulsory 2",
  选择性必修第三册: "Selective Compulsory 3",
  适龄拓展: "Extension",
};

const hasCjk = (value: string | null | undefined) =>
  !!value && /[\u3400-\u9fff]/.test(value);

function englishVolume(value: string | null) {
  if (!value) return value;
  if (volumeEnglish[value]) return volumeEnglish[value];
  return hasCjk(value) ? "Chinese-language original" : value;
}

function textbookTitle(source: KnowledgeSource) {
  const volume = source.volume ?? "";
  const titlePage = Number(source.title.match(/(?:p\.|印刷p\.?)(\d+)/i)?.[1]) || null;
  const page = source.pages[0]?.printedPage ?? titlePage;
  const book = volume === "九年级上册"
    ? "Compulsory Education Chemistry Textbook, Grade 9 · Volume 1"
    : `Ordinary High School Chemistry Textbook · ${englishVolume(volume)}`;
  const editionHint = source.title.includes("2024审核通过版")
    ? " · 2024-approved public mirror"
    : source.title.includes("候选PDF") || source.title.includes("候选")
      ? " · public candidate PDF"
      : "";
  return `Chinese-language original · ${book}${editionHint}${page ? ` · p. ${page}` : ""}`;
}

function textbookPublisher(value: string) {
  if (value.includes("人民教育出版社")) {
    const host = value.includes("华南师范大学")
      ? "; publicly hosted by South China Normal University's course site"
      : "";
    return `People's Education Press${host}`;
  }
  return hasCjk(value) ? "Chinese-language publisher" : value;
}

function textbookEdition(source: KnowledgeSource) {
  const edition = source.edition ?? "";
  if (!hasCjk(edition)) return edition;
  if (edition.includes("2024"))
    return "The cover states approval by the National Textbook Committee's Expert Committee in 2024; the exact publication date, edition, printing, and ISBN are not shown.";
  if (edition.includes("2019"))
    return "2019 approval is shown; the exact printing has not been verified.";
  if (edition.includes("用户持有印次匹配待核"))
    return "The edition and its match to the user's copy have not been verified.";
  return "Exact edition and printing details have not been verified.";
}

function textbookNote(source: KnowledgeSource) {
  const note = source.note;
  if (!hasCjk(note)) return note;
  if (note.includes("FlipHTML5"))
    return "The cited textbook text was read in a public mirror. The reader page number starts at 1 and is not the PDF page number; the page link opens the corresponding printed-page image. Only the 2024-approved Grade 9, Volume 1 mirror was checked, so the printing in a reader's own copy may differ.";
  if (note.includes("逐页抽取并阅读正文"))
    return "The cited text was extracted page by page from a local PDF and read on October 16, 2026. The remote page link was not rechecked in this round, and a match to the reader's own printing has not been verified.";
  if (note.includes("直接抽取并阅读本地PDF正文"))
    return "The cited text was extracted and read directly from a local PDF on October 16, 2026. The candidate edition, match to the reader's copy, and remote page link have not been verified.";
  if (note.includes("本地下载PDF"))
    return "The cited text was read directly from the corresponding page of a downloaded PDF; PDF page numbering starts at 1. The file is a public mirror hosted by South China Normal University, and a match to the reader's own printing has not been verified.";
  if (note.includes("用户持书印次"))
    return "The cited textbook text was checked against a public candidate edition. The exact printing in the reader's copy has not been verified.";
  return "This source note describes the Chinese-language textbook evidence and its edition limits. The English wording is a navigation translation, not an English edition of the cited textbook.";
}

function referenceNote(note: string) {
  if (!hasCjk(note)) return note;
  const date = note.match(/2026-10-(\d{2})/)?.[1];
  const dateLabel = date === "15" ? "October 15, 2026" : date === "16" ? "October 16, 2026" : null;
  if (note.includes("不作为人教版") || note.includes("不作人教版"))
    return `This reference was opened and read${dateLabel ? ` on ${dateLabel}` : ""}. It supports extracurricular material only and does not establish alignment with the Chinese-language People's Education Press textbook.`;
  if (note.includes("并非人教教材对齐证据"))
    return `This reference was opened and read${dateLabel ? ` on ${dateLabel}` : ""}. It supports scientific facts, not alignment with the Chinese-language People's Education Press textbook.`;
  return `This reference was read${dateLabel ? ` on ${dateLabel}` : ""}. It supports the scientific facts described in the card; it is not evidence of alignment with the Chinese-language textbook.`;
}

function localizeSource(source: KnowledgeSource): KnowledgeSource {
  if (source.kind === "textbook")
    return {
      ...source,
      title: textbookTitle(source),
      publisher: textbookPublisher(source.publisher),
      edition: textbookEdition(source),
      volume: englishVolume(source.volume),
      note: textbookNote(source),
    };
  return {
    ...source,
    title: hasCjk(source.title) ? "Reference source" : source.title,
    publisher: hasCjk(source.publisher) ? "Reference publisher" : source.publisher,
    edition: hasCjk(source.edition) ? "Edition details in the original source" : source.edition,
    volume: englishVolume(source.volume),
    note: referenceNote(source.note),
  };
}

export function localizeKnowledgePack(
  pack: KnowledgePack,
  translations: KnowledgeEnglish,
): KnowledgePack {
  const mapGapIndexes = new Map<string, number>();
  return {
    ...pack,
    branches: pack.branches.map((branch) => {
      const title = translations.branches[branch.id];
      if (!title) throw new Error(`Missing English branch: ${branch.id}`);
      return { ...branch, title };
    }),
    cards: pack.cards.map((card) => {
      const translated = translations.cards[card.id];
      if (!translated) throw new Error(`Missing English knowledge card: ${card.id}`);
      return {
        ...card,
        ...translated,
        curriculum: card.curriculum
          ? { ...card.curriculum, ...translated.curriculum }
          : undefined,
      };
    }),
    sources: pack.sources.map(localizeSource),
    gaps: pack.gaps.map((gap) => {
      let key: string;
      if (gap.cardId) {
        key = `${gap.elementId}:${gap.cardId}`;
      } else {
        const index = mapGapIndexes.get(gap.elementId) ?? 0;
        mapGapIndexes.set(gap.elementId, index + 1);
        key = `${gap.elementId}:map:${index}`;
      }
      const reason =
        translations.gaps[key] ??
        (gap.cardId ? undefined : translations.gaps[`${gap.elementId}:map`]);
      if (!reason) throw new Error(`Missing English knowledge gap: ${key}`);
      return { ...gap, reason };
    }),
  };
}
