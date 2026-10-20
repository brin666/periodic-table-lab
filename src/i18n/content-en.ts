import type { ElementStory, Equation, Source, Substance } from "../data/types";
import type { Language } from "../i18n";

// Independent presentation copy: identities, composition, equations and citations
// always come from the original records, rather than a parallel chemistry database.
const storyCopy: Record<
  string,
  [string, string, string, string, string, string]
> = {
  h: [
    "Start with the simplest atom.\nExplore the world around you.",
    "One proton, one electron. Hydrogen has the lowest atomic number—and it is part of the water you use every day.",
    "An element ≠ an elemental substance",
    "Hydrogen names a type of atom. Hydrogen gas is an elemental substance made from those atoms. Water contains hydrogen, but it is not hydrogen gas.",
    "What changes with one more oxygen?",
    "Water and hydrogen peroxide both contain hydrogen and oxygen. Their molecular compositions differ, and so do their properties.",
  ],
  he: [
    "A quiet gas with plenty to do",
    "Helium is a relatively unreactive monatomic gas at room temperature. It is used in low-temperature technology and protective atmospheres.",
    "Observe its properties",
    "Helium is colorless and odorless. It normally consists of separate He atoms, not He₂ molecules.",
    "Tell substances apart",
    "He is an element symbol. Helium gas is an elemental substance formed from that element.",
  ],
  li: [
    "Light lithium—and lithium in batteries",
    "Lithium metal is light and reactive. Compounds such as lithium carbonate are different substances from the metal.",
    "Observe its properties",
    "Elemental lithium is a soft, low-density, silvery metal.",
    "Tell substances apart",
    "Lithium carbonate is an ionic compound containing several elements. A lithium-bearing mineral is not elemental lithium.",
  ],
  c: [
    "One element, very different solids",
    "Graphite and diamond contain only carbon. Their different structures give them very different properties. CO₂ is a carbon compound.",
    "Observe its properties",
    "Graphite is dark, lustrous and soft; diamond is transparent and hard. Both are elemental forms of carbon.",
    "Tell substances apart",
    "C is the element symbol. CO₂ contains carbon and oxygen, so it is not elemental carbon.",
  ],
  n: [
    "From nitrogen in air to ammonia",
    "Nitrogen gas, N₂, may seem unremarkable at room temperature, but industry converts it into ammonia, a nitrogen compound.",
    "Observe its properties",
    "At room temperature, nitrogen is a colorless, odorless gas made of diatomic N₂ molecules.",
    "Tell substances apart",
    "Ammonia synthesis incorporates nitrogen atoms into a new substance. The nitrogen element has not disappeared.",
  ],
  o: [
    "Oxygen gas and oxygen in water",
    "Oxygen can form an elemental gas or become part of water and oxides. These are different substances.",
    "Observe its properties",
    "O₂ is a colorless gas at room temperature and accounts for about 21% of air by volume.",
    "Tell substances apart",
    "A water molecule contains oxygen atoms, but water is not oxygen gas. Air is a mixture of gases.",
  ],
  f: [
    "Reactive fluorine, different fluorides",
    "Fluorine gas is highly reactive. Most familiar examples of fluorine are compounds; the fluorine in a fluoride is not fluorine gas.",
    "Observe its properties",
    "Elemental fluorine is a pale yellow-green, highly reactive diatomic gas at room temperature.",
    "Tell substances apart",
    "Sodium fluoride consists of sodium and fluoride ions. It contains no F₂ molecules.",
  ],
  na: [
    "Sodium changes identity in a salt",
    "Sodium metal reacts vigorously with water. In table salt, sodium is present as ions, and the substance has different properties.",
    "Observe its properties",
    "Sodium is a soft, silvery, reactive metal.",
    "Tell substances apart",
    "NaCl is a salt made of sodium and chloride ions, not a mixture of sodium metal and chlorine gas.",
  ],
  mg: [
    "Bright-burning magnesium, a new product",
    "Magnesium is a light metal. It reacts with oxygen to form white magnesium oxide, a different substance.",
    "Observe its properties",
    "Magnesium is a silvery-white elemental metal.",
    "Tell substances apart",
    "MgO contains magnesium and oxygen. It is an ionic compound, not simply magnesium metal with a different appearance.",
  ],
  al: [
    "A thin oxide layer protects aluminium",
    "Aluminium is light and malleable. A compact surface oxide layer slows corrosion; aluminium alloys are mixtures.",
    "Observe its properties",
    "Aluminium is ductile and is used in foil, containers and alloys.",
    "Tell substances apart",
    "Al₂O₃ is an aluminium compound. A thin surface film does not mean the whole object is aluminium oxide.",
  ],
  si: [
    "Silicon in a chip is not sand",
    "High-purity silicon is an elemental semiconductor. Sand, rock and glass are materials whose compositions may be complex.",
    "Observe its properties",
    "High-purity silicon is a blue-gray crystalline solid with semiconductor properties.",
    "Tell substances apart",
    "Quartz can be approximated as SiO₂. Natural sand and glass may contain other components or additives.",
  ],
  p: [
    "Red and white phosphorus: one element",
    "Phosphorus has several elemental forms. Red and white phosphorus contain the same element but differ in structure and properties.",
    "Observe its properties",
    "Red phosphorus is a dark-red amorphous or polymeric solid. White phosphorus has a different structure and different properties.",
    "Tell substances apart",
    "Phosphorus in fertilizers is usually present in compounds such as phosphates, not as red phosphorus powder.",
  ],
  s: [
    "Yellow sulfur crystals, often S₈",
    "Common elemental sulfur consists of S₈ molecules. Sulfuric acid and sulfates are sulfur compounds.",
    "Observe its properties",
    "S₈ means that one molecule contains eight sulfur atoms; it is not a single S atom.",
    "Tell substances apart",
    "Sulfuric acid contains sulfur, but it is not elemental sulfur.",
  ],
  cl: [
    "Chlorine gas is not chloride",
    "Toxic chlorine gas has different properties from the chloride ions in table salt. Those ions are part of an ionic compound.",
    "Observe its properties",
    "At room temperature, chlorine consists of Cl₂ molecules and is toxic.",
    "Tell substances apart",
    "Chlorine is present as Cl⁻ in NaCl. An ionic salt is not a mixture of chlorine gas and sodium metal.",
  ],
  ar: [
    "Unreactive argon makes a useful shield",
    "Argon is a noble gas found in air. It consists of individual atoms at room temperature and is very unreactive.",
    "Observe its properties",
    "Argon gas consists of Ar atoms, not diatomic molecules.",
    "Tell substances apart",
    "Air contains nitrogen, oxygen, argon and other gases. It is a mixture.",
  ],
  k: [
    "Reactive potassium and its ionic salts",
    "Potassium metal, potassium chloride and potassium iodide are different substances. Potassium salts have many uses.",
    "Observe its properties",
    "Potassium is a soft, silvery metal that readily tarnishes in air.",
    "Tell substances apart",
    "KCl and KI are ionic compounds. Their formulas give the ion ratios in the crystals.",
  ],
  ca: [
    "From limestone to slaked lime",
    "Limestone is commonly rich in calcium carbonate. Heating produces calcium oxide, which reacts with water to form calcium hydroxide.",
    "Observe its properties",
    "CaCO₃, CaO and Ca(OH)₂ are calcium compounds with different compositions and properties.",
    "Tell substances apart",
    "Limestone is a rock, usually rich in CaCO₃, and may also contain other minerals.",
  ],
  mn: [
    "Manganese dioxide is not manganese metal",
    "Manganese is a transition metal. MnO₂ is a compound that catalyzes the decomposition of hydrogen peroxide.",
    "Observe its properties",
    "Elemental Mn is a hard, brittle, silvery metal.",
    "Tell substances apart",
    "A catalyst changes the reaction rate. It is not a reactant consumed to make the oxygen.",
  ],
  fe: [
    "Iron, steel and rust have different compositions",
    "Iron is an element. Steel is an iron-based alloy containing carbon and other components. Rust should not simply be described as pure Fe₂O₃.",
    "Observe its properties",
    "Pure iron is a gray metal that gradually rusts in moist conditions.",
    "Tell substances apart",
    "Iron can catalyze ammonia synthesis without becoming an element in ammonia.",
  ],
  cu: [
    "Conductive copper forms new substances",
    "Elemental copper is widely used in electrical equipment. Copper oxide and copper sulfate are compounds with different properties.",
    "Observe its properties",
    "Copper is reddish-gold, easy to work and a good electrical conductor.",
    "Tell substances apart",
    "When copper reacts with silver nitrate, copper enters solution as ions while silver ions become silver metal.",
  ],
  zn: [
    "Zinc protects iron and displaces copper",
    "A zinc coating can slow corrosion of iron-based materials. Zinc reacts with copper sulfate to form copper and zinc sulfate.",
    "Observe its properties",
    "Zinc is a silvery-white metal with a bluish tint, often used to protect iron surfaces.",
    "Tell substances apart",
    "In the displacement reaction, zinc enters solution and copper ions become copper metal.",
  ],
  br: [
    "Bromine: a liquid nonmetal",
    "Bromine is one of the few nonmetals that is liquid at room temperature. Br⁻ in a bromide is not liquid Br₂.",
    "Observe its properties",
    "Br₂ is a dark reddish-brown, toxic liquid at room temperature.",
    "Tell substances apart",
    "NaBr and AgBr both contain bromine, but have different compositions and properties.",
  ],
  ag: [
    "Silver tarnishes; silver salts precipitate",
    "Silver is a lustrous elemental metal. Silver ions can combine with chloride ions to form poorly soluble silver chloride.",
    "Observe its properties",
    "Silver is soft and lustrous. Tarnishing often involves reaction with sulfur-containing substances to form silver sulfide.",
    "Tell substances apart",
    "AgCl is an ionic compound. Its precipitate forms from silver and chloride ions in solution.",
  ],
  i: [
    "Dark iodine crystals, violet vapor",
    "Elemental iodine commonly forms dark, lustrous crystals. In potassium iodide, iodine is present as iodide ions.",
    "Observe its properties",
    "Iodine consists of I₂ molecules and can sublime to violet vapor when heated.",
    "Tell substances apart",
    "KI is an ionic compound of potassium and iodine, not a collection of KI molecules.",
  ],
  ba: [
    "Barium compounds differ in solubility",
    "Barium is commonly found in compounds. BaSO₄ is poorly soluble, but that does not mean all barium salts are.",
    "Observe its properties",
    "Barium is a reactive, soft, silvery metal that reacts with water.",
    "Tell substances apart",
    "BaSO₄ is a poorly soluble ionic compound. Soluble barium salts have different properties; this page gives no handling or use advice.",
  ],
};

export const substanceCopy: Record<string, [string, string, string]> = {
  water: [
    "A glass of water connects to the atomic world.",
    "Each water molecule has two hydrogen atoms and one oxygen atom. These elements are chemically combined, giving water different properties from hydrogen and oxygen gases.",
    "The illustration shows liquid water. Natural and drinking water usually contain other dissolved substances and are mixtures; this entry describes pure water.",
  ],
  "hydrogen-peroxide": [
    "One extra oxygen, very different properties.",
    "A hydrogen peroxide molecule has two hydrogen atoms and two oxygen atoms. It decomposes into water and oxygen; manganese dioxide speeds up this process.",
    "The bottle represents an aqueous hydrogen peroxide product. Such a solution is a mixture and is not the same as pure hydrogen peroxide.",
  ],
  hydrogen: [
    "A container of colorless gas",
    "Under ordinary conditions, elemental hydrogen is a gas of diatomic molecules. The element, an atom and hydrogen gas are distinct concepts.",
    "The pale tint locates the gas in the illustration; it is not its actual color.",
  ],
  oxygen: [
    "A container of colorless gas",
    "Under ordinary conditions, each oxygen molecule contains two oxygen atoms. Oxygen supports the burning of many substances; it is not itself a fuel.",
    "The pale tint locates the gas in the illustration; it is not its actual color.",
  ],
  "manganese-dioxide": [
    "A black solid",
    "Here, manganese dioxide acts as a catalyst in hydrogen peroxide decomposition, changing the reaction rate.",
    "The catalyst is omitted from the overall stoichiometry. The illustration shows the solid at a visible scale.",
  ],
  "potassium-permanganate": [
    "Dark purple crystals",
    "A salt of potassium and permanganate ions. In acidic solution, it oxidizes hydrogen peroxide.",
    "The formula gives an ion ratio, not a discrete potassium permanganate molecule.",
  ],
  "sulfuric-acid": [
    "A container of colorless liquid",
    "In the reaction shown, aqueous sulfuric acid provides an acidic medium and hydrogen ions are consumed.",
    "The label aq means aqueous solution. Concentrated and dilute sulfuric acid have different properties. No experimental procedure is provided.",
  ],
  "potassium-sulfate": [
    "White crystals",
    "A salt of potassium and sulfate ions, included here to write the full molecular equation.",
    "In the aqueous reaction shown, it is present mainly as ions.",
  ],
  "manganese-sulfate": [
    "A container of aqueous solution",
    "In the acidic redox reaction shown, manganese changes oxidation state from +7 to +2.",
    "The aq label means aqueous solution. The formula describes overall stoichiometry, not discrete salt molecules in solution.",
  ],
  helium: [
    "A sealed container of colorless gas",
    "At room temperature, helium consists of separate atoms rather than diatomic molecules.",
    "The container marks the gas location. Air and other helium-containing gas systems may be mixtures.",
  ],
  lithium: [
    "A light, silvery-gray metal strip",
    "Lithium is an elemental metal, with a different composition and properties from lithium salts.",
    "Lithium metal is reactive. This illustration shows its visible form, not a handling procedure.",
  ],
  "lithium-carbonate": [
    "A white, powdery ionic solid",
    "Lithium carbonate contains lithium, carbon and oxygen. It is an ionic compound, not lithium metal.",
    "Li₂CO₃ gives the ion ratio in a lattice, not a discrete molecule. Lithium-bearing ores are usually complex mineral materials.",
  ],
  graphite: [
    "A dark, layered block of graphite",
    "Graphite is an elemental form containing only carbon. Diamond is another elemental form of carbon.",
    "Atoms are bonded within layers, with weaker interactions between layers. The picture shows a bulk solid, not a molecule.",
  ],
  carbon: [
    "A dark amorphous carbon deposit",
    "This is the solid-carbon term in the equation for magnesium reducing carbon dioxide. The specific allotrope is not identified.",
    "Amorphous carbon illustrates the solid product without calling it graphite. The actual deposit depends on the conditions.",
  ],
  "carbon-dioxide": [
    "A container of colorless gas",
    "Each carbon dioxide molecule contains one carbon atom and two oxygen atoms.",
    "Pure CO₂ is a compound. Air, drinks and flue gases that contain CO₂ may be mixtures.",
  ],
  nitrogen: [
    "A container of colorless gas",
    "At room temperature, elemental nitrogen is mainly present as diatomic N₂ molecules.",
    "The pale tint is a visual guide, not the gas's true color. Air is a mixture of gases.",
  ],
  ammonia: [
    "A container of colorless gas",
    "Ammonia molecules contain nitrogen and hydrogen atoms. Ammonia is a compound, distinct from nitrogen gas.",
    "Ammonia is used to produce nitrogen fertilizers. The illustration shows the gas at a visible scale.",
  ],
  "sodium-fluoride": [
    "White ionic crystals",
    "Sodium fluoride is an ionic compound of sodium and fluorine. It is not fluorine gas.",
    "NaF gives an ion ratio rather than a discrete molecule. No handling or use advice is provided.",
  ],
  sodium: [
    "A small piece of silvery metal",
    "Sodium is an elemental metal. Sodium ions in salts are not metallic sodium.",
    "Sodium reacts vigorously with water. Only the visible form of the metal is illustrated, with no experimental procedure.",
  ],
  "sodium-chloride": [
    "Fine white salt crystals",
    "Sodium chloride consists of sodium and chloride ions. It is not a mixture of sodium metal and chlorine gas.",
    "For solid NaCl, the formula gives an ion ratio in the lattice, not a NaCl molecule.",
  ],
  "sodium-hydroxide": [
    "White pieces of an ionic solid",
    "Sodium hydroxide consists of sodium and hydroxide ions, not discrete NaOH molecules.",
    "In equations, aq means aqueous solution. The pictured solid is an illustration of the pure substance.",
  ],
  "sodium-carbonate": [
    "White ionic crystals",
    "Sodium carbonate consists of sodium and carbonate ions. It can form when CO₂ reacts with an alkali.",
    "Na₂CO₃ is a stoichiometric formula. In aqueous solution, hydrated ions predominate.",
  ],
  magnesium: [
    "A silvery-white metal strip",
    "Magnesium is a light elemental metal. The magnesium oxide produced by burning is a different substance.",
    "The illustration does not show burning or an experimental procedure.",
  ],
  "magnesium-oxide": [
    "A white refractory mineral solid",
    "Magnesium oxide is an ionic compound of magnesium and oxygen, used in heat-resistant materials.",
    "MgO gives a ratio in a solid ionic lattice, not a discrete molecule.",
  ],
  "magnesium-hydroxide": [
    "A deposit of fine white crystals",
    "Magnesium hydroxide is an ionic compound containing magnesium and hydroxide ions.",
    "Solid Mg(OH)₂ is poorly soluble and is written as a solid in the equation, not as discrete molecules.",
  ],
  "magnesium-chloride": [
    "White salt crystals",
    "Magnesium chloride is an ionic compound containing magnesium and chlorine.",
    "MgCl₂ gives an ion ratio. In aqueous solution, ions predominate.",
  ],
  aluminium: [
    "A light, silvery-white metal sheet",
    "Aluminium is an elemental metal. Its oxide surface layer can protect the metal; aluminium alloys contain other elements.",
    "Foil, cans and other real products may include coatings or alloy components and are not necessarily pure aluminium.",
  ],
  "aluminium-oxide": [
    "A pale mineral crystal",
    "Aluminium oxide contains aluminium and oxygen. A compact oxide layer on aluminium slows further corrosion.",
    "Al₂O₃ is a crystal composition formula, not a molecule. Natural aluminium ores often contain several minerals.",
  ],
  silicon: [
    "Blue-gray, lustrous crystals",
    "High-purity silicon is an elemental semiconductor, not silicon dioxide.",
    "The illustration represents high-purity crystalline silicon. Chips are processed materials; natural ores may contain several components.",
  ],
  "silicon-dioxide": [
    "A pale quartz crystal",
    "Silicon dioxide is a network solid of silicon and oxygen. Quartz can be approximated as relatively pure SiO₂.",
    "Sand is usually a mixture of mineral grains, and glass has variable composition. Neither is necessarily pure SiO₂.",
  ],
  "red-phosphorus": [
    "A small pile of dark-red powder",
    "Red phosphorus is an elemental form of phosphorus, with different structure and properties from white phosphorus.",
    "Red phosphorus is an amorphous or polymeric solid, not P molecules. No ignition or handling procedure is shown.",
  ],
  sulfur: [
    "Pale yellow S₈ crystals",
    "Common elemental sulfur consists of ring-shaped S₈ molecules. Other elemental forms also exist.",
    "This illustration specifically represents a common S₈ molecular crystal, not individual S atoms or a covalent network.",
  ],
  chlorine: [
    "A container of yellow-green gas",
    "Elemental chlorine is normally present as Cl₂ molecules. Chloride ions in compounds are chemically combined.",
    "Chlorine gas is toxic. The illustration shows its visible form, not preparation, handling or use instructions.",
  ],
  argon: [
    "A container of colorless gas",
    "Elemental argon consists of individual atoms at room temperature, not diatomic molecules.",
    "The pale tint is a location guide. In air, argon forms a mixture with nitrogen, oxygen and other gases.",
  ],
  potassium: [
    "A soft, silvery-white metal strip",
    "Potassium is a reactive elemental metal. In potassium salts, it is chemically combined as ions.",
    "The illustration does not describe storage or handling.",
  ],
  "potassium-chloride": [
    "Fine white salt crystals",
    "Potassium chloride consists of potassium and chloride ions and is distinct from potassium metal.",
    "KCl gives the simplest ion ratio in the lattice, not a discrete molecule.",
  ],
  "potassium-iodide": [
    "A small pile of white ionic crystals",
    "Potassium iodide consists of potassium and iodide ions. Its iodine is not present as I₂ molecules.",
    "KI is an ion-ratio formula for the solid, not a potassium iodide molecule.",
  ],
  "potassium-chlorate": [
    "White ionic crystals",
    "Potassium chlorate is an ionic compound of potassium, chlorine and oxygen that decomposes on heating.",
    "Only the reaction relationship is shown, with no heating or experimental procedure.",
  ],
  "calcium-carbonate": [
    "A pale gray-white limestone fragment",
    "Calcium carbonate is a major component of limestone, calcite and related materials.",
    "Natural limestone is a rock and may contain several minerals. Pure CaCO₃ represents its main component here.",
  ],
  "calcium-oxide": [
    "Pale pieces of quicklime",
    "Calcium oxide forms when calcium carbonate decomposes on heating. It also reacts with water to form calcium hydroxide.",
    "CaO is an ionic-crystal composition formula. The transformation is shown without an experimental procedure.",
  ],
  "calcium-hydroxide": [
    "A pale solid representing slaked lime",
    "Calcium hydroxide is an ionic compound formed when calcium oxide reacts with water.",
    "Clear limewater is a dilute aqueous solution, not pure Ca(OH)₂. Real materials may contain other substances.",
  ],
  "calcium-chloride": [
    "White salt crystals",
    "Calcium chloride is a salt composed of calcium and chloride ions.",
    "CaCl₂ gives an ion ratio. In equations, aq refers to a solution containing mainly hydrated ions.",
  ],
  "calcium-nitrate": [
    "Pale ionic crystals",
    "Calcium nitrate consists of calcium and nitrate ions and is present as ions in aqueous solution.",
    "Ca(NO₃)₂ gives an ion-number ratio, not a discrete molecule.",
  ],
  manganese: [
    "A hard, silvery-gray metal piece",
    "Manganese is a metallic element. Elemental manganese and manganese dioxide are different substances.",
    "The picture does not imply that manganese occurs abundantly as free metal in nature.",
  ],
  iron: [
    "A dark-gray metal strip",
    "Iron is an elemental metal. Steel is an iron-based alloy containing carbon and other components.",
    "Rust is usually a complex mixture of iron corrosion products; it cannot always be written as pure Fe₂O₃.",
  ],
  "iron-ii-iii-oxide": [
    "A black oxide solid",
    "The Grade 9 Chinese textbook describes iron burning in oxygen to produce black iron(II,III) oxide, a compound of iron and oxygen.",
    "Fe₃O₄ gives a composition ratio in the solid, not a discrete molecule. It is distinct from iron, rust and iron(III) oxide, Fe₂O₃.",
  ],
  copper: [
    "A reddish-gold metal sheet",
    "Copper is a ductile elemental metal and a good electrical conductor.",
    "Products such as copper wire may include alloys, insulation or coatings. This record describes pure copper.",
  ],
  "copper-ii-oxide": [
    "Black oxide crystals",
    "Copper(II) oxide contains copper and oxygen and is a different substance from reddish-gold copper metal.",
    "CuO gives the stoichiometry of an ionic solid, not a discrete molecule.",
  ],
  "copper-ii-sulfate": [
    "Blue crystals",
    "Copper(II) sulfate is a salt containing copper ions, distinct from copper metal.",
    "Common solid forms may contain water of crystallization. This record uses the anhydrous formula; aq denotes aqueous solution.",
  ],
  "copper-ii-nitrate": [
    "A container of blue aqueous solution",
    "Copper(II) nitrate represents a copper-containing compound in solution. Copper enters solution during the displacement reaction.",
    "The aqueous solution mainly contains hydrated copper and nitrate ions, not discrete copper nitrate molecules.",
  ],
  zinc: [
    "A silvery-white metal with a bluish tint",
    "Zinc is an elemental metal. Zinc coatings can protect iron-based materials; zinc salts are compounds.",
    "Galvanized steel is an iron-based material coated with zinc, not a solid piece of pure zinc.",
  ],
  "zinc-chloride": [
    "White ionic salt crystals",
    "Zinc chloride is a salt of zinc and chlorine and can form in solution when zinc reacts with hydrochloric acid.",
    "In aqueous solution, ZnCl₂ is mainly present as ions. Its formula gives overall stoichiometry.",
  ],
  "zinc-sulfate": [
    "Pale salt crystals",
    "Zinc sulfate consists of zinc and sulfate ions.",
    "The solid may crystallize as a hydrate. ZnSO₄ gives the overall composition here; aq denotes solution.",
  ],
  bromine: [
    "Dark reddish-brown liquid in a sealed bottle",
    "At room temperature, elemental bromine is a liquid consisting of Br₂ molecules.",
    "Bromine and its vapor are toxic. Only a sealed container is illustrated; no handling advice is provided.",
  ],
  "sodium-bromide": [
    "Pale ionic crystal grains",
    "Sodium bromide consists of sodium and bromide ions. It contains bromine but is not elemental bromine.",
    "NaBr gives an ion ratio. In aqueous solution, hydrated ions predominate.",
  ],
  "silver-bromide": [
    "Pale yellow, light-sensitive crystals",
    "Silver bromide is a light-sensitive ionic compound of silver and bromine.",
    "AgBr gives an ion ratio in a solid lattice, not a discrete molecule.",
  ],
  silver: [
    "A bright silver metal sheet",
    "Silver is an elemental metal. Silver ions form silver salts when combined with halide ions.",
    "Tarnishing often involves sulfur-containing surface compounds. Silver objects may have different purities.",
  ],
  "silver-chloride": [
    "A fine white precipitate",
    "Silver chloride is a poorly soluble ionic compound that forms from silver and chloride ions in solution.",
    "Solid AgCl consists of ions. The ↓ symbol marks precipitation from solution.",
  ],
  "silver-nitrate": [
    "A container of colorless solution",
    "Silver nitrate is a soluble salt containing silver ions, which form an AgCl precipitate with chloride ions.",
    "Hydrated ions predominate in the aqueous solution, rather than discrete AgNO₃ molecules.",
  ],
  iodine: [
    "Dark, lustrous crystals and violet vapor",
    "Elemental iodine consists of I₂ molecules and can sublime to violet vapor when heated.",
    "No heating procedure is shown. In KI, iodine is present as iodide ions.",
  ],
  barium: [
    "A silvery-gray metal piece",
    "Barium is a reactive metal. In nature and common materials, it is usually found in compounds.",
    "The illustration shows its visible form, not handling or experimental methods.",
  ],
  "barium-sulfate": [
    "Fine white crystals or a precipitate",
    "Barium sulfate is a poorly soluble ionic compound. This does not mean that every barium salt is poorly soluble.",
    "Solid BaSO₄ consists of ions, not discrete molecules. No ingestion or use advice is provided.",
  ],
  "barium-hydroxide": [
    "Pale ionic crystals",
    "Barium hydroxide contains barium and hydroxide ions and reacts with sulfuric acid to form barium sulfate precipitate.",
    "The aq label in equations denotes aqueous solution. No handling or use advice is provided.",
  ],
  "hydrogen-chloride": [
    "A container of colorless gas or solution",
    "A hydrogen chloride molecule contains hydrogen and chlorine atoms. Its aqueous solution is called hydrochloric acid.",
    "HCl(aq) denotes an acidic aqueous solution whose main solute particles are hydrated hydrogen and chloride ions.",
  ],
};

const equationCopy: Record<string, [string, string, string]> = {
  "hydrogen-combustion": [
    "Hydrogen burns to form water",
    "Ignition",
    "Balancing and ignition conditions were checked against Grade 9, Volume 1, p. 118. The original has no state labels. Water formed in the flame is labeled g here and can condense on cooling. Since a reactant is already gaseous, no ↑ is added to the product.",
  ],
  "water-electrolysis": [
    "Electrolysis of water",
    "Electric current",
    "Balanced from the reaction described in Grade 9, Volume 1, pp. 91–94. At equal temperature and pressure, the hydrogen-to-oxygen volume ratio is about 2:1. Page 92 notes that a little sodium sulfate or sodium hydroxide solution improves conductivity. State labels were added by this site.",
  ],
  "peroxide-decomposition": [
    "Decomposition of hydrogen peroxide",
    "MnO₂ catalyst",
    "Balanced from the word equation on pp. 45–46 of Grade 9, Volume 1. Manganese dioxide changes the rate; its mass and chemical properties are unchanged overall. It does not supply the oxygen product. State labels were added by this site.",
  ],
  "peroxide-redox": [
    "Redox reaction in acidic solution",
    "Dilute sulfuric acid",
    "Beyond the textbook: hydrogen peroxide acts as a reducing agent. Potassium and sulfate spectator ions were restored to the source's net ionic equation. Only the reaction relationship is shown, not a procedure.",
  ],
  "haber-synthesis": [
    "Ammonia synthesis from nitrogen and hydrogen",
    "Iron catalyst; industrial compromise at about 400–500 °C and 150–250 atm",
    "This reversible reaction illustrates the compromise between rate and yield. Iron is a catalyst, not a constituent of ammonia.",
  ],
  "calcium-carbonate-decomposition": [
    "Thermal decomposition of calcium carbonate",
    "High temperature",
    "Limestone is usually rich in CaCO₃, but natural rock may contain other minerals. This equation represents the transformation of the pure substance.",
  ],
  "calcium-oxide-hydration": [
    "Calcium oxide reacts with water",
    "Room temperature",
    "The reaction of quicklime with water is exothermic. The equation shows solid slaked lime forming. Ca(OH)₂ is poorly soluble; (s) does not mean completely insoluble. Distinguish the small dissolved fraction from the solid rather than labeling the whole slurry aq. This is a reference-based extension.",
  ],
  "carbon-dioxide-sodium-hydroxide": [
    "Carbon dioxide reacts with sodium hydroxide",
    "Aqueous solution; sufficient NaOH",
    "CO₂(aq) denotes dissolved carbon dioxide. Excess CO₂ can produce sodium hydrogen carbonate, so this equation would no longer describe the final overall reaction.",
  ],
  "sodium-chloride-electrolysis": [
    "Overall electrolysis of saturated brine",
    "Saturated brine; electric current",
    "This equation assumes suitable electrodes and separated products. Without separation, chlorine may react further with the alkali. No apparatus or procedure is shown.",
  ],
  "sodium-water": [
    "Sodium reacts with water",
    "Room temperature",
    "Only the stoichiometry of the known reaction is shown. This is not a suggestion for a home experiment.",
  ],
  "sodium-chlorine": [
    "Sodium and chlorine form sodium chloride",
    "Heat (Δ)",
    "Atoms are rearranged into ionic NaCl crystals, not a physical mixture of sodium and chlorine.",
  ],
  "magnesium-oxygen": [
    "Magnesium and oxygen form magnesium oxide",
    "Ignition",
    "MgO is an ionic solid formed from magnesium and oxygen. No burning procedure is shown.",
  ],
  "magnesium-steam": [
    "Magnesium reacts with steam",
    "Steam at high temperature",
    "Steam and liquid water have different physical states. Only the chemical relationship is shown.",
  ],
  "magnesium-carbon-dioxide": [
    "Magnesium reacts with carbon dioxide",
    "Ignition",
    "Magnesium removes oxygen from CO₂ to form MgO, leaving solid carbon. The equation does not identify a carbon allotrope.",
  ],
  "iron-oxygen": [
    "Iron burns in oxygen",
    "Ignition",
    "Balanced from the reaction described on p. 40 of Grade 9, Volume 1, producing black iron(II,III) oxide. State labels were added by this site. This oxide is not the complete composition of everyday rust.",
  ],
  "magnesium-hydrochloric-acid": [
    "Magnesium reacts with hydrochloric acid",
    "Aqueous solution",
    "Balanced from the source description. Magnesium chloride is mainly present as ions in aqueous solution.",
  ],
  "zinc-hydrochloric-acid": [
    "Zinc reacts with hydrochloric acid",
    "Aqueous solution",
    "Balanced from the source description. In aqueous solution, ZnCl₂ is mainly present as ions rather than discrete molecules.",
  ],
  "zinc-copper-sulfate": [
    "Zinc displaces copper from copper sulfate",
    "Aqueous solution",
    "This is a displacement reaction. The salts are mainly present as ions in solution; the formulas describe the overall reaction.",
  ],
  "copper-silver-nitrate": [
    "Copper displaces silver from silver nitrate",
    "Aqueous solution",
    "Balanced from the source description. Copper becomes copper ions and silver ions are reduced to silver metal. The aqueous salts are mainly ionic.",
  ],
  "silver-chloride-precipitation": [
    "Silver chloride precipitates",
    "Mixing two aqueous solutions",
    "AgCl precipitates from solution. Aqueous salts are present as ions; the molecular equation gives the overall stoichiometry.",
  ],
  "barium-sulfate-precipitation": [
    "Barium sulfate precipitates",
    "Aqueous solution",
    "Poorly soluble BaSO₄ precipitates. Strong electrolytes are mainly present as ions in aqueous solution.",
  ],
  "magnesium-hydroxide-neutralization": [
    "Magnesium hydroxide reacts with hydrochloric acid",
    "Aqueous solution",
    "The equation gives the overall stoichiometry for acid neutralizing solid magnesium hydroxide, without a procedure.",
  ],
  "chlorine-sodium-bromide": [
    "Chlorine displaces bromine from a bromide",
    "Dilute aqueous solution",
    "Chlorine reacts with bromide ions. The bromine produced remains dissolved and is labeled aq, not as a separate layer of pure liquid bromine.",
  ],
  "potassium-chlorate-decomposition": [
    "Thermal decomposition of potassium chlorate",
    "Sufficient heating; net reaction for complete decomposition",
    "A reference-based extension showing only the overall stoichiometry of complete thermal decomposition, not intermediate steps. This is not the checked Grade 9 oxygen-preparation example. Catalytic decomposition with MnO₂ uses different conditions.",
  ],
  "aluminium-oxygen": [
    "Aluminium and oxygen form aluminium oxide",
    "Air at room temperature",
    "This represents the overall composition change during oxidation. The actual surface layer is thin; the whole aluminium object does not become pure Al₂O₃.",
  ],
};

export function localizeStory(
  story: ElementStory | undefined,
  language: Language,
) {
  if (!story || language === "zh") return story;
  const c = storyCopy[story.elementId];
  return c
    ? {
        ...story,
        headline: c[0],
        summary: c[1],
        facts: [
          { title: c[2], text: c[3] },
          { title: c[4], text: c[5] },
        ],
      }
    : story;
}
export function localizeSubstance(
  substance: Substance,
  language: Language,
): Substance {
  if (language === "zh") return substance;
  const c = substanceCopy[substance.id];
  return {
    ...substance,
    name: substance.englishName,
    ...(c ? { appearance: c[0], summary: c[1], note: c[2] } : {}),
  };
}
export function localizeEquation(
  equation: Equation,
  language: Language,
): Equation {
  if (language === "zh") return equation;
  const c = equationCopy[equation.id];
  return c
    ? { ...equation, title: c[0], condition: c[1], note: c[2] }
    : equation;
}
export function localizeSource(source: Source, language: Language): Source {
  if (language === "zh") return source;
  const note = rscSourceNotes[source.id];
  return {
    ...source,
    ...sourceCopy[source.id],
    ...(note
      ? { note: `Element page text and properties reviewed: ${note}` }
      : {}),
  };
}
const rscSourceNotes: Record<string, string> = {
  "rsc-helium":
    "At room temperature, helium is a colorless, unreactive monatomic gas.",
  "rsc-lithium":
    "Lithium is a soft, low-density, silvery metal. Lithium metal and lithium salts are different substances.",
  "rsc-carbon":
    "Graphite, diamond and other forms are different elemental forms of carbon. Graphite is dark, lustrous and soft.",
  "rsc-nitrogen":
    "Nitrogen is a colorless gas and can react with hydrogen to synthesize ammonia.",
  "rsc-oxygen":
    "Oxygen gas is colorless and makes up about 21% of air by volume. The oxygen element is also found in compounds.",
  "rsc-fluorine":
    "Fluorine gas is highly reactive. In fluorides, fluorine is chemically combined.",
  "rsc-sodium":
    "Sodium is a soft, reactive metal. Sodium chloride is a sodium-containing compound.",
  "rsc-magnesium":
    "Magnesium is a light, silvery-white metal that burns with a bright light. MgO is a different compound.",
  "rsc-aluminium":
    "Aluminium is light and ductile. A surface oxide layer can protect the metal; aluminium alloys are mixtures.",
  "rsc-silicon":
    "High-purity silicon is an elemental semiconductor. Natural sand, rock and glass are not necessarily pure SiO₂.",
  "rsc-phosphorus":
    "Red and white phosphorus are different elemental forms. Phosphates are phosphorus-containing compounds.",
  "rsc-sulfur":
    "Sulfur has several allotropes. Common sulfur is a yellow solid; sulfuric acid and sulfates are compounds.",
  "rsc-chlorine":
    "Chlorine is a toxic gas. Chloride ions in salts differ from chlorine gas.",
  "rsc-argon":
    "Argon is a colorless, unreactive monatomic gas and makes up about 0.94% of air by volume.",
  "rsc-potassium":
    "Potassium is a soft, reactive, silvery metal. Potassium salts such as KCl are ionic compounds.",
  "rsc-calcium":
    "Limestone is usually rich in calcium carbonate. Calcination and slaking involve different calcium compounds.",
  "rsc-manganese":
    "Elemental manganese is a hard, brittle, silvery metal. MnO₂ is a manganese compound that can act as a catalyst.",
  "rsc-iron":
    "Iron is a metallic element. Steel is an iron-based alloy, and iron can also catalyze ammonia synthesis.",
  "rsc-copper":
    "Copper is a reddish-gold, ductile, conductive metal. Copper salts are different substances.",
  "rsc-zinc":
    "Zinc is a silvery-white metal often used to coat iron surfaces. Zinc salts are distinct from zinc metal.",
  "rsc-bromine":
    "Bromine is a dark reddish-brown liquid at room temperature. In bromides, bromine is chemically combined.",
  "rsc-silver":
    "Silver is a soft, lustrous metal. Silver halides are ionic compounds with different properties.",
  "rsc-iodine":
    "Elemental iodine forms dark, lustrous crystals and sublimes to violet vapor when heated. Iodides contain iodide ions.",
  "rsc-barium":
    "Elemental barium is reactive. Barium sulfate is poorly soluble, but that does not imply that all barium salts are poorly soluble.",
};
const juniorEdition =
  "Cover marked as reviewed in 2024; exact edition and printing not shown";
const seniorEdition =
  "Cover marked as reviewed in 2019; exact edition and printing not shown";
const juniorPublisher =
  "People's Education Press · FlipHTML5 public mirror (luyiese)";
const seniorPublisher =
  "People's Education Press · South China Normal University public course PDF";
const sourceCopy: Record<string, Partial<Source>> = {
  "pubchem-periodic-table": {
    title: "PubChem periodic table: official machine-readable data",
    publisher: "NIH / NCBI PubChem",
    note: "The 118-row CSV was downloaded and parsed for atomic numbers, symbols, English names, categories and electron configurations. Noble-gas cores were recursively expanded to calculate shell populations by principal quantum number. The Lr configuration was corrected using RSC. The CSV AtomicMass column was not used as standard atomic weight.",
  },
  "ciaaw-atomic-weights-2024": {
    publisher:
      "IUPAC Commission on Isotopic Abundances and Atomic Weights (CIAAW)",
    note: "The official table was parsed entry by entry, retaining abridged standard atomic weights and ± uncertainties. A dash means no standard atomic weight is available; no individual isotope mass is substituted. Values are dimensionless. Includes the 2024 zirconium, gadolinium and lutetium revisions.",
  },
  "ccs-chinese-periodic-table": {
    title: "Chinese Chemical Society: periodic table (Chinese)",
    publisher: "Chinese Chemical Society",
    note: "The release page was read and the official Chinese table downloaded and rendered to check Chinese names and table positions. Uncommon characters use simplified forms. This source supports names and layout only; atomic weights come from CIAAW 2024.",
  },
  "rsc-lawrencium": {
    publisher: "Royal Society of Chemistry (RSC)",
    note: "The fact box and discussion of relativistic calculations were read. Its [Rn] 5f¹⁴ 7s² 7p¹ configuration replaces the older 6d¹ configuration in the PubChem CSV.",
  },
  "uw-electrolysis": {
    note: "Text reviewed for the overall electrolysis reaction and half-reactions. The source's experimental procedure is not included on this site.",
  },
  "uw-peroxide": {
    note: "Text reviewed for manganese-dioxide-catalyzed hydrogen peroxide decomposition. The source gives an unbalanced shorthand equation; this site balances it by atom conservation.",
  },
  "rsc-peroxide-redox": {
    pages: "Supplementary material, pp. 2–3",
    note: "The source gives a net ionic equation in acidic sulfuric-acid medium. Spectator ions were restored to write a molecular equation, presented as an extension beyond the textbook.",
  },
  "ung-chemical-reactions": {
    note: "Pages 4–6, 12–14 and 20–21 reviewed for state symbols, equation balancing and ions in aqueous solution. Some entries are exercises only; balancing done by this site is identified rather than presented as a worked answer from the source.",
  },
  "uw-magnesium-fires": {
    note: "Equations for magnesium reacting with steam and carbon dioxide were read. Only chemical relationships are used, not demonstration procedures.",
  },
  "purdue-brine": {
    note: "Text reviewed on concentrated-brine electrolysis and product separation by a membrane. Without separation, chlorine can react further with hydroxide. Only conditions relevant to the overall reaction are cited.",
  },
  "nist-chlorate": {
    note: "The overall decomposition equation and thermal-decomposition study were read. Only the net reaction for complete thermal decomposition is included; this is not claimed to be the Chinese textbook oxygen-preparation experiment.",
  },
  "pearson-halogen": {
    pages: "PDF p. 6",
    note: "The answer on PDF p. 6 was checked: Cl₂(aq) + 2NaBr(aq) → 2NaCl(aq) + Br₂(aq). States refer to dilute aqueous solution. Exercise layout and procedures are not reproduced.",
  },
  "uw-metals-acid": {
    note: "Text reviewed: magnesium and zinc release hydrogen with hydrochloric acid; copper showed no visible hydrogen during the observation period. The source does not give a full molecular equation, so this site completes it by atom conservation.",
  },
  "uw-zinc-copper-sulfate": {
    note: "The displacement reaction Zn + CuSO₄ → Cu + ZnSO₄ was read.",
  },
  "uw-silver-copper": {
    note: "Text reviewed on copper reacting with silver nitrate to form silver and copper nitrate in solution. This site writes and balances the molecular equation from that description.",
  },
  "uw-silver-chloride": {
    note: "Text reviewed on the white precipitate from aqueous silver nitrate and sodium chloride. Balancing was also checked against university-level ionic-reaction examples.",
  },
  "uw-barium-sulfate": {
    note: "The equation Ba(OH)₂ + H₂SO₄ → BaSO₄(s) + 2H₂O and the low solubility of barium sulfate were reviewed.",
  },
  "wisc-calcium-hydration": {
    note: "The text directly supports an exothermic reaction between CaO and water, with steam. It does not give a product formula or state. The Ca(OH)₂ composition and solid context use NHMRC and Davidson sources separately. Experimental procedures are omitted.",
  },
  "nhmrc-calcium-oxide": {
    note: "The Chemistry section gives the complete equation for CaO reacting with water to form Ca(OH)₂, and describes solutions and slurries of slaked lime. Individual state labels are not given; the solid context also requires solubility evidence.",
  },
  "davidson-calcium-hydroxide": {
    note: "The introduction and dissolution reaction were read: slaked lime forms from CaO and water; Ca(OH)₂ has low water solubility. The text distinguishes Ca(OH)₂(s) from dissolved ions. Only reaction and state information is used, not procedures.",
  },
  "ucalgary-haber": {
    note: "The equation N₂ + 3H₂ ⇌ 2NH₃, its exothermic character and the industrial compromise at about 400–500 °C and 150–250 atm were reviewed. The iron catalyst is supported separately by RSC's iron page.",
  },
  "ucalgary-ionic": {
    note: "Ionic-equation examples reviewed: strong electrolytes are present as ions in aqueous solution, whereas solid AgCl is not written as free ions. The source also includes the CO₂–NaOH reaction.",
  },
  "ucalgary-chemical-formula": {
    note: "Text reviewed on common elemental sulfur consisting of eight-atom S₈ molecules, and on the difference between formula subscripts and equation coefficients.",
  },
  "pep-j9-iron-oxygen": {
    title: "Grade 9 Chemistry, Volume 1 · Iron burning in oxygen (Chinese)",
    publisher: juniorPublisher,
    edition: juniorEdition,
    volume: "Grade 9, Volume 1",
    pages: "Printed p. 40; reader p. 47 (not a PDF page number)",
    note: "Text and page image checked: ignited iron wire forms black Fe₃O₄ in oxygen. The page prints the ignition condition and a word equation. This site's balanced equation and state labels are derived from the described reaction.",
  },
  "pep-j9-peroxide": {
    title:
      "Grade 9 Chemistry, Volume 1 · Oxygen preparation and catalysts (Chinese)",
    publisher: juniorPublisher,
    edition: juniorEdition,
    volume: "Grade 9, Volume 1",
    pages: "Printed pp. 45–46; reader pp. 52–53 (not PDF page numbers)",
    note: "Page images checked for decomposition at room temperature, MnO₂ catalysis and the catalyst definition. The source uses a word equation; this site balances the reaction and adds state labels.",
  },
  "pep-j9-water": {
    title: "Grade 9 Chemistry, Volume 1 · Composition of water (Chinese)",
    publisher: juniorPublisher,
    edition: juniorEdition,
    volume: "Grade 9, Volume 1",
    pages: "Printed pp. 91–94; reader pp. 98–101 (not PDF page numbers)",
    note: "Hydrogen, water electrolysis and molecular composition were checked. The p. 92 note specifies a little sodium sulfate or sodium hydroxide solution to improve conductivity. This site's overall equation is derived from the text, not claimed to be printed there.",
  },
  "pep-j9-equations": {
    title: "Grade 9 Chemistry, Volume 1 · Chemical equations (Chinese)",
    publisher: juniorPublisher,
    edition: juniorEdition,
    volume: "Grade 9, Volume 1",
    pages: "Printed pp. 118–120; reader pp. 125–127 (not PDF page numbers)",
    note: "Hydrogen-combustion balancing, ignition conditions and gas/precipitate symbols checked. The peroxide equation on p. 120 is an unfinished exercise. The original does not label every state; this site adds states with context.",
  },
  "pep-high1-metals": {
    title:
      "Upper Secondary Chemistry, Compulsory 1 · Sodium and its compounds (Chinese)",
    publisher: seniorPublisher,
    edition: seniorEdition,
    volume: "Compulsory 1",
    pages: "Printed p. 37; PDF p. 42",
    note: "Sodium with water, and sodium peroxide with water or CO₂, were checked. The filename's 2023 is not evidence of publication year. Matching the exact cover and printing remains pending.",
  },
  "pep-high1-chlorine": {
    title:
      "Upper Secondary Chemistry, Compulsory 1 · Chlorine and its compounds (Chinese)",
    publisher: seniorPublisher,
    edition: seniorEdition,
    volume: "Compulsory 1",
    pages: "Printed pp. 45–46; PDF pp. 50–51",
    note: "Hydrogen and metals with chlorine, and chlorine with water, were checked. Page 46 explicitly uses a reversible arrow, retained here. Exact cover matching remains pending.",
  },
  "pep-high1-atom": {
    title:
      "Upper Secondary Chemistry, Compulsory 1 · Atomic structure (Chinese)",
    publisher: seniorPublisher,
    edition: seniorEdition,
    volume: "Compulsory 1",
    pages: "Printed p. 92; PDF p. 97",
    note: "Atomic structure and the shell model were checked. Configurations for all 118 elements and modern atomic weights use separate PubChem, RSC and CIAAW references, not deductions from this textbook page. Exact cover matching remains pending.",
  },
  "pep-high1-brine": {
    title:
      "Upper Secondary Chemistry, Compulsory 1 · Alkali production by brine electrolysis (Chinese)",
    publisher: seniorPublisher,
    edition: seniorEdition,
    volume: "Compulsory 1",
    pages: "Printed p. 12; PDF p. 17",
    note: "PDF text and image checked: industrial NaOH production mainly uses saturated-brine electrolysis. This page prints no full overall equation or electrode/product-separation conditions and cannot alone support those details. Exact cover matching remains pending.",
  },
  "pep-high1-halogen-displacement": {
    title:
      "Upper Secondary Chemistry, Compulsory 1 · Halogen displacement (Chinese)",
    publisher: seniorPublisher,
    edition: seniorEdition,
    volume: "Compulsory 1",
    pages: "Printed p. 104; PDF p. 109",
    note: "Text and image checked: experiment 4-1 adds chlorine water to KBr and KI solutions, and bromine water to KI, comparing colors and oxidizing power. Students are asked to write equations; no balanced answers are printed. The aq labels are added from context. Exact cover matching remains pending.",
  },
  "pep-high1-halogen-activity": {
    title:
      "Upper Secondary Chemistry, Compulsory 1 · Experiments on a main group (Chinese)",
    publisher: seniorPublisher,
    edition: seniorEdition,
    volume: "Compulsory 1",
    pages: "Printed p. 122; PDF p. 127",
    note: "Text and image checked: activity 3 uses NaBr/NaI solutions with fresh chlorine water, and NaI with bromine water. This supports the aqueous context of the NaBr displacement reaction. Balancing and aq labels are added by this site; no balanced answer is printed. Exact cover matching remains pending.",
  },
  "pep-j9-lower-pending": {
    title: "Grade 9 Chemistry, Volume 2 · Official reader (Chinese)",
    publisher: "People's Education Press",
    edition: "2024 reviewed edition specified by the user",
    volume: "Grade 9, Volume 2",
    note: "The official contents page was located, but the book's text has not been checked directly. Acids, bases, salts and metals currently use other references; page-by-page alignment with this volume is not claimed.",
  },
};
