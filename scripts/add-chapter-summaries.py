#!/usr/bin/env python3
"""Add comprehensive chapterSummary to all Class 8 chapters."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "data" / "classes" / "8" / "chapters"

SUMMARIES = {
    "cell-structure": {
        "overview": "This chapter introduces the cell as the fundamental unit of life. You learn that all living organisms — from bacteria to humans — are built from one or more cells, and that cells contain specialised structures called organelles, each with a distinct function.",
        "keyPoints": [
            "Prokaryotic cells (bacteria) lack a true nucleus; eukaryotic cells (plants, animals, fungi) have a membrane-bound nucleus.",
            "Plant cells have a rigid cell wall, chloroplasts for photosynthesis, and a large central vacuole; animal cells lack these.",
            "The nucleus controls cell activities and stores DNA; mitochondria release energy through respiration.",
            "Ribosomes synthesise proteins; ER and Golgi body process and transport them.",
            "The cell membrane is selectively permeable — it controls entry and exit of substances."
        ],
        "examFocus": "Be able to draw and label plant and animal cells. Compare organelles and their functions. Explain why plant cells look box-shaped while animal cells are irregular."
    },
    "microorganisms": {
        "overview": "Microorganisms are tiny living things invisible to the naked eye — bacteria, fungi, protozoa, algae, and viruses. This chapter covers their types, useful roles (food, medicine, cleaning), harmful effects (diseases), and how to prevent them through hygiene and preservation.",
        "keyPoints": [
            "Microorganisms are classified as bacteria, fungi, protozoa, algae, and viruses.",
            "Friendly microbes: Lactobacillus makes curd; yeast ferments bread and alcohol; Rhizobium fixes nitrogen.",
            "Harmful microbes cause diseases like cholera, tuberculosis, malaria, and food poisoning.",
            "Preservation methods — pasteurisation, refrigeration, salting, and chemical preservatives — slow microbial growth.",
            "Vaccines train the immune system; antibiotics kill bacteria but not viruses."
        ],
        "examFocus": "Give examples of useful vs harmful microorganisms. Explain how curd forms and how Louis Pasteur discovered pasteurisation."
    },
    "crop-production": {
        "overview": "Agriculture feeds the nation. This chapter explains how farmers prepare soil, select seeds, sow crops, add manure and fertilisers, irrigate fields, protect crops from weeds and pests, and harvest and store grain — the complete crop production cycle.",
        "keyPoints": [
            "Good soil preparation (ploughing, levelling, manuring) gives roots air, water, and nutrients.",
            "Quality seeds with high germination rate are sown by broadcasting, drilling, or transplantation.",
            "Manure improves soil structure; fertilisers (NPK) give quick nutrients but overuse harms soil.",
            "Irrigation methods include wells, canals, rivers, tanks, and modern drip/sprinkler systems.",
            "Weeding removes unwanted plants; pesticides control insects, fungi, and rodents."
        ],
        "examFocus": "Compare manure vs fertilisers. Name irrigation methods. Explain why crop rotation and mixed cropping improve yield."
    },
    "conservation-plants-animals": {
        "overview": "Earth's biodiversity is under threat from deforestation, poaching, and pollution. This chapter explains why we must conserve forests and wildlife, how national parks and biosphere reserves protect species, and what individuals can do to reduce their ecological footprint.",
        "keyPoints": [
            "Deforestation causes soil erosion, floods, loss of habitat, and increased CO₂ (global warming).",
            "Wildlife conservation prevents extinction and maintains food chains and ecological balance.",
            "Protected areas: wildlife sanctuaries, national parks, and biosphere reserves.",
            "Endemic, endangered, and extinct species — Red Data Book lists threatened organisms.",
            "Reforestation replants trees; we can reduce paper use, avoid products from endangered animals."
        ],
        "examFocus": "Explain consequences of deforestation. Differentiate sanctuary vs national park. List steps for conservation."
    },
    "reproduction-animals": {
        "overview": "Reproduction creates new individuals and continues the species. This chapter covers sexual reproduction (fusion of sperm and egg), asexual reproduction (budding, fission), internal vs external fertilisation, embryo development, metamorphosis, and the difference between egg-laying and live-bearing animals.",
        "keyPoints": [
            "Sexual reproduction involves two parents and gametes (sperm + egg) → zygote → embryo.",
            "Asexual reproduction: one parent, no gametes — budding (Hydra), binary fission (Amoeba).",
            "Internal fertilisation (humans, birds) vs external fertilisation (frogs, fish in water).",
            "Oviparous animals lay eggs; viviparous animals give birth to live young.",
            "Metamorphosis: larva transforms into adult (tadpole → frog, caterpillar → butterfly)."
        ],
        "examFocus": "Compare sexual vs asexual reproduction. Draw the path of sperm to egg. Explain metamorphosis with examples."
    },
    "adolescence": {
        "overview": "Adolescence is the transition from childhood to adulthood (roughly 11–19 years), marked by puberty. This chapter covers physical and emotional changes, the role of hormones, reproductive health, personal hygiene, and balanced nutrition during this critical growth phase.",
        "keyPoints": [
            "Puberty brings secondary sexual characters — voice change, height spurt, acne, body hair.",
            "Hormones (testosterone, estrogen) from endocrine glands control these changes.",
            "Reproductive health: awareness of AIDS (HIV), personal hygiene, and responsible behaviour.",
            "Balanced diet with iron, calcium, and protein supports rapid growth.",
            "Adolescents need exercise, adequate sleep, and emotional support from family."
        ],
        "examFocus": "List changes during puberty. Explain how hormones work. Discuss hygiene and health tips for adolescents."
    },
    "combustion-flame": {
        "overview": "Combustion is a chemical reaction in which a substance burns in oxygen, releasing heat and light. This chapter covers the fire triangle, types of combustion (complete vs incomplete), flame structure, fuel efficiency, and fire safety including how fire extinguishers work.",
        "keyPoints": [
            "Fire needs fuel + oxygen + ignition temperature — remove any one to extinguish fire.",
            "Complete combustion (plenty of O₂) → blue flame, CO₂ + H₂O, maximum energy.",
            "Incomplete combustion (limited O₂) → yellow sooty flame, CO (poisonous) + carbon soot.",
            "Candle flame has three zones: dark inner, luminous yellow, non-luminous blue outer.",
            "Different fuels have different calorific values; LPG and CNG are cleaner than coal or wood."
        ],
        "examFocus": "Draw and label flame zones. Compare complete vs incomplete combustion. Explain why CO is dangerous."
    },
    "materials-metals-nonmetals": {
        "overview": "Elements are broadly classified as metals or non-metals based on physical and chemical properties. This chapter explores lustre, conductivity, malleability, reactions with oxygen, water, and acids, displacement reactions, and everyday uses of metals and non-metals.",
        "keyPoints": [
            "Metals: lustrous, malleable, ductile, good conductors of heat and electricity.",
            "Non-metals: dull, brittle, poor conductors (except graphite), form acidic oxides.",
            "Metal + oxygen → metal oxide; reactive metals react with water and dilute acids producing H₂.",
            "Displacement reaction: more reactive metal displaces less reactive metal from its salt solution.",
            "Uses: iron (construction), aluminium (foil), copper (wires), sulphur and nitrogen in industry."
        ],
        "examFocus": "Compare metal vs non-metal properties. Write reaction of zinc with HCl. Explain displacement with an example."
    },
    "coal-petroleum": {
        "overview": "Coal and petroleum are fossil fuels formed over millions of years from dead organisms. This chapter explains their formation, types of coal, refining of petroleum into useful fractions, natural gas, and why we must use these resources judiciously.",
        "keyPoints": [
            "Coal forms from buried plant matter under heat and pressure over 300 million years.",
            "Types: peat → lignite → bituminous → anthracite (increasing carbon content).",
            "Petroleum is refined by fractional distillation into LPG, petrol, kerosene, diesel, lubricants.",
            "Coal tar gives dyes, drugs, explosives; coke is used in steel manufacture.",
            "Fossil fuels are non-renewable; burning them causes air pollution and global warming."
        ],
        "examFocus": "Describe formation of coal and petroleum. List petroleum fractions and uses. Explain why fossil fuels must be conserved."
    },
    "synthetic-fibres-plastics": {
        "overview": "Synthetic fibres (nylon, polyester, acrylic, rayon) and plastics are man-made polymers. This chapter covers how they are made, their properties, advantages over natural fibres, types of plastics (thermoplastics vs thermosetting), and environmental concerns including biodegradability.",
        "keyPoints": [
            "Synthetic fibres are made from petrochemicals through polymerisation.",
            "Nylon: strong, elastic — ropes, parachutes; Polyester: wrinkle-free fabrics.",
            "Rayon (artificial silk) from wood pulp; Acrylic resembles wool.",
            "Thermoplastics can be remoulded (polythene, PVC); thermosetting cannot (bakelite).",
            "Plastics are non-biodegradable — cause pollution; the 4 R's: Reduce, Reuse, Recycle, Recover."
        ],
        "examFocus": "Compare natural vs synthetic fibres. Differentiate thermoplastics vs thermosetting. Discuss plastic disposal problems."
    },
    "chemical-effects-electric-current": {
        "overview": "Electric current can cause chemical changes — this is the basis of electroplating, extraction of metals, and electrolysis of water. This chapter covers conductors vs insulators, circuits, heating and magnetic effects of current, and practical applications like water purification.",
        "keyPoints": [
            "Liquids conduct if they contain ions — acids, bases, salts; distilled water is a poor conductor.",
            "Electrolysis: passing current through a liquid decomposes it (water → H₂ + O₂).",
            "Electroplating coats one metal with another using electric current (chromium on taps).",
            "LED glows in one direction only — detects current direction in a circuit.",
            "Fuses and MCBs protect against overloading; short circuits cause fires."
        ],
        "examFocus": "Explain electroplating process. Draw electrolysis of water. List good vs poor conductors."
    },
    "pollution-air-water": {
        "overview": "Pollution contaminates air and water, harming health and ecosystems. This chapter identifies sources (vehicles, factories, sewage), effects (acid rain, eutrophication, diseases), the greenhouse effect, ozone depletion, and measures to control pollution at individual and government levels.",
        "keyPoints": [
            "Air pollutants: CO, CO₂, SO₂, NO₂, particulate matter, CFCs.",
            "Greenhouse effect: CO₂ and methane trap heat → global warming and climate change.",
            "Water pollutants: sewage, industrial waste, fertilisers — cause eutrophication and diseases.",
            "Acid rain from SO₂ and NO₂ damages buildings, soil, and aquatic life.",
            "Prevention: CNG vehicles, catalytic converters, STPs, rainwater harvesting, reduce-plastic use."
        ],
        "examFocus": "Explain greenhouse effect and acid rain. List water purification steps. Suggest pollution control measures."
    },
    "force-pressure": {
        "overview": "A force is a push or pull that can change an object's motion or shape. Pressure is force per unit area (P = F/A). This chapter explains types of forces, atmospheric pressure, pressure in fluids, and everyday applications like sharp knives, camel feet, and syringes.",
        "keyPoints": [
            "Force is a vector quantity measured in newtons (N); it has both magnitude and direction.",
            "Pressure = Force / Area — same force on smaller area gives higher pressure.",
            "Atmospheric pressure ≈ 101,325 Pa; we don't feel it due to internal body pressure.",
            "Liquids and gases exert pressure equally in all directions; pressure increases with depth.",
            "Applications: wide straps on bags, pointed nails, hydraulic brakes, suction cups."
        ],
        "examFocus": "Calculate pressure given force and area. Explain why sharp knives cut better. Describe atmospheric pressure experiments."
    },
    "friction": {
        "overview": "Friction opposes relative motion between surfaces in contact. This chapter covers types of friction (static, sliding, rolling), factors affecting it, advantages (walking, writing, gripping) and disadvantages (wear, heat loss), and methods to increase or reduce friction.",
        "keyPoints": [
            "Static friction prevents motion; sliding friction acts during motion; rolling friction is smallest.",
            "Friction depends on nature of surfaces and how hard they are pressed together.",
            "Useful: walking, brakes, holding objects; Harmful: wear, energy wasted as heat.",
            "Reduce friction: lubricants, ball bearings, polishing, streamlining.",
            "Increase friction: treaded tyres, brake pads, kabaddi players rubbing hands with soil."
        ],
        "examFocus": "Give examples where friction is useful vs harmful. Explain how lubricants work. Compare static, sliding, rolling friction."
    },
    "sound": {
        "overview": "Sound is a form of energy produced by vibrating objects and travels as longitudinal waves through a medium. This chapter covers production and propagation of sound, characteristics (amplitude, frequency, pitch, loudness), speed in different media, reflection (echo), and the human ear.",
        "keyPoints": [
            "Sound needs a medium — cannot travel through vacuum; fastest in solids, slowest in gases.",
            "Vibration → compression and rarefaction → sound wave travels to the ear.",
            "Amplitude → loudness; frequency → pitch; higher frequency = higher pitch.",
            "Human hearing range: 20 Hz to 20,000 Hz; ultrasound above 20,000 Hz.",
            "Echo: reflected sound heard after original; used in SONAR and medical imaging."
        ],
        "examFocus": "Explain how sound is produced and travels. Differentiate pitch vs loudness. Calculate echo distance using speed of sound."
    },
    "natural-phenomena": {
        "overview": "This chapter explains natural events involving static electricity (charging by rubbing, types of charges, lightning) and earthquakes (causes, measurement on Richter scale, safety measures). It connects physics concepts to real-world phenomena we observe in nature.",
        "keyPoints": [
            "Like charges repel; unlike charges attract; charge transfers by rubbing (e.g. comb and hair).",
            "Lightning: charge separation in clouds → discharge → thunder from heated air expanding.",
            "Lightning conductor protects buildings by providing a safe path to ground.",
            "Earthquakes caused by movement of tectonic plates; measured on Richter scale.",
            "Seismic zones in India; safety: take cover under sturdy furniture, stay away from windows."
        ],
        "examFocus": "Explain lightning formation. Draw a lightning conductor. List earthquake safety rules."
    },
    "light": {
        "overview": "Light enables us to see objects. This chapter covers laws of reflection, plane and curved mirrors, kaleidoscopes, sunlight dispersion through a prism (VIBGYOR spectrum), the human eye, vision defects, and care of eyes.",
        "keyPoints": [
            "Light travels in straight lines; reflection follows angle of incidence = angle of reflection.",
            "Plane mirror: virtual, erect, same-size image; lateral inversion.",
            "White light splits into seven colours through a prism — violet bends most, red least.",
            "Eye: cornea, iris, lens, retina; image formed on retina, signal sent to brain via optic nerve.",
            "Vision defects: myopia (near-sighted), hypermetropia (far-sighted) corrected with lenses."
        ],
        "examFocus": "Draw ray diagrams for plane mirror. Explain dispersion of light. Label parts of the human eye."
    },
    "stars-solar-system": {
        "overview": "The night sky holds stars, constellations, planets, moons, and other celestial bodies. This chapter covers the solar system, phases of the moon, eclipses, meteors and comets, artificial satellites, and how ancient and modern astronomers studied the heavens.",
        "keyPoints": [
            "Solar system: Sun + 8 planets, dwarf planets, asteroids, comets, meteors.",
            "Planets revolve around the Sun; moons revolve around planets; all held by gravity.",
            "Moon phases caused by how much of the sunlit half we see as it orbits Earth.",
            "Solar eclipse: Moon blocks Sun; Lunar eclipse: Earth blocks sunlight to Moon.",
            "Pole Star indicates north; constellations like Orion and Ursa Major help navigation."
        ],
        "examFocus": "Explain moon phases with diagrams. Differentiate solar vs lunar eclipse. Name planets in order from the Sun."
    },
}


def main():
    for chapter_id, summary in SUMMARIES.items():
        path = ROOT / f"{chapter_id}.json"
        if not path.exists():
            print(f"SKIP {chapter_id}")
            continue
        data = json.loads(path.read_text())
        data["chapterSummary"] = summary
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        print(f"Updated {chapter_id}")


if __name__ == "__main__":
    main()
