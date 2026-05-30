#!/usr/bin/env python3
"""Add interactive demos to Class 8 biology & physics chapters."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "data" / "classes" / "8" / "chapters"

DEMOS = {
    "cell-structure": [
        {
            "id": "plant-cell-tour",
            "title": "Plant Cell — Organelle Tour",
            "description": "Zoom into a plant cell and watch each organelle appear as you learn its job.",
            "scene": "cell",
            "steps": [
                {"label": "Cell wall & cytoplasm", "description": "Rigid cell wall gives shape; jelly-like cytoplasm fills the interior.", "visual": "mix"},
                {"label": "Nucleus & mitochondria", "description": "Nucleus holds DNA; mitochondria produce ATP energy.", "visual": "react"},
                {"label": "Chloroplasts & vacuole", "description": "Green chloroplasts capture sunlight; large vacuole stores water.", "visual": "product"}
            ]
        },
        {
            "id": "protein-synthesis-demo",
            "title": "From DNA to Protein",
            "description": "Follow mRNA leaving the nucleus to a ribosome where a protein is built.",
            "scene": "protein-synthesis",
            "steps": [
                {"label": "Transcription", "description": "DNA in the nucleus is copied into messenger RNA (mRNA).", "visual": "mix"},
                {"label": "mRNA travels", "description": "mRNA exits the nucleus and moves into the cytoplasm.", "visual": "react"},
                {"label": "Translation", "description": "Ribosome reads mRNA and links amino acids into a protein.", "visual": "product"}
            ]
        }
    ],
    "microorganisms": [
        {
            "id": "curd-formation",
            "title": "Curd Formation by Lactobacillus",
            "description": "Warm milk + bacteria → lactic acid → milk proteins clump into curd.",
            "scene": "fermentation",
            "steps": [
                {"label": "Add starter", "description": "A spoon of curd (Lactobacillus) is mixed into warm milk.", "visual": "mix"},
                {"label": "Bacteria multiply", "description": "Bacteria ferment lactose sugar into lactic acid.", "visual": "react"},
                {"label": "Curd sets", "description": "Acid lowers pH — milk proteins coagulate into soft curd.", "visual": "product"}
            ]
        }
    ],
    "crop-production": [
        {
            "id": "irrigation-growth",
            "title": "Irrigation & Crop Growth",
            "description": "Water reaches the field through channels; seeds germinate and shoots grow.",
            "scene": "agriculture",
            "steps": [
                {"label": "Water released", "description": "Canal water flows into furrows between crop rows.", "visual": "mix"},
                {"label": "Soil absorbs water", "description": "Moisture reaches seed coats — imbibition begins.", "visual": "react"},
                {"label": "Germination", "description": "Roots anchor and green shoots rise above the soil.", "visual": "product"}
            ]
        }
    ],
    "conservation-plants-animals": [
        {
            "id": "deforestation-impact",
            "title": "Deforestation Chain Reaction",
            "description": "Cutting forests triggers soil erosion and rising CO₂ in the atmosphere.",
            "scene": "ecosystem",
            "steps": [
                {"label": "Healthy forest", "description": "Tree roots hold soil; leaves absorb CO₂ during photosynthesis.", "visual": "mix"},
                {"label": "Trees cleared", "description": "Logging removes cover — rain washes topsoil away.", "visual": "react"},
                {"label": "Erosion & CO₂ rise", "description": "Bare land erodes; less CO₂ absorbed → greenhouse effect worsens.", "visual": "product"}
            ]
        }
    ],
    "reproduction-animals": [
        {
            "id": "fertilization-demo",
            "title": "Internal Fertilisation — Fallopian Tube",
            "description": "Watch an egg release from the ovary, sperm swim through the fallopian tube, and fusion form a zygote.",
            "scene": "reproduction",
            "steps": [
                {"label": "Egg released", "description": "Ovary releases a mature egg into the fallopian tube (oviduct).", "visual": "mix"},
                {"label": "Sperm reach egg", "description": "Sperm swim up the tube; one penetrates the egg membrane.", "visual": "react"},
                {"label": "Zygote forms", "description": "Sperm and egg nuclei fuse — a single-celled zygote begins dividing.", "visual": "product"}
            ]
        }
    ],
    "adolescence": [
        {
            "id": "hormone-signal",
            "title": "Endocrine Hormone Signal",
            "description": "A gland releases a hormone that travels in blood to a target organ.",
            "scene": "hormone",
            "steps": [
                {"label": "Gland activated", "description": "Brain signal triggers hormone release from endocrine gland.", "visual": "mix"},
                {"label": "Hormone in blood", "description": "Hormone travels through bloodstream to distant organs.", "visual": "react"},
                {"label": "Target responds", "description": "Target organ cells receive signal — growth or change begins.", "visual": "product"}
            ]
        }
    ],
    "force-pressure": [
        {
            "id": "nail-pressure-demo",
            "title": "Nail vs Finger — Same Force, Different Pressure",
            "description": "P = F/A — a nail's tiny tip creates huge pressure and pierces wood.",
            "scene": "pressure",
            "steps": [
                {"label": "Apply 50 N", "description": "You push downward with the same force on finger and nail.", "visual": "mix"},
                {"label": "Compare areas", "description": "Finger ≈ 2 cm² (low P) vs nail tip ≈ 0.01 cm² (high P).", "visual": "react"},
                {"label": "Nail pierces", "description": "High pressure at nail point breaks wood fibres apart.", "visual": "product"}
            ]
        },
        {
            "id": "camel-sand-foot",
            "title": "Camel Foot on Sand",
            "description": "Wide padded feet spread weight — low pressure prevents sinking.",
            "scene": "camel-pressure",
            "steps": [
                {"label": "Camel steps", "description": "Full body weight rests on four wide feet.", "visual": "mix"},
                {"label": "Weight spreads", "description": "Large contact area divides force — pressure stays low.", "visual": "react"},
                {"label": "Walks on sand", "description": "Low pressure means sand doesn't collapse — camel stays on top.", "visual": "product"}
            ]
        }
    ],
    "friction": [
        {
            "id": "walking-friction",
            "title": "Walking — Push Back, Friction Forward",
            "description": "You push ground backward; friction pushes you forward.",
            "scene": "friction",
            "steps": [
                {"label": "Foot pushes ground", "description": "Muscles apply backward force on the ground.", "visual": "mix"},
                {"label": "Friction reacts", "description": "Ground friction pushes foot forward — you move ahead.", "visual": "react"},
                {"label": "Braking", "description": "Brake pads use friction to convert motion into heat and stop.", "visual": "product"}
            ]
        }
    ],
    "sound": [
        {
            "id": "sound-wave-demo",
            "title": "Sound — Vibration to Wave",
            "description": "A vibrating bell creates compressions that travel through air as sound.",
            "scene": "sound",
            "steps": [
                {"label": "Bell struck", "description": "Hammer hits bell — metal vibrates rapidly.", "visual": "mix"},
                {"label": "Air compresses", "description": "Vibrations push air molecules together (compressions) and apart (rarefactions).", "visual": "react"},
                {"label": "Wave reaches ear", "description": "Sound waves travel through air to your eardrum.", "visual": "product"}
            ]
        }
    ],
    "natural-phenomena": [
        {
            "id": "lightning-thunder",
            "title": "Lightning & Thunder",
            "description": "Charge builds in clouds → lightning discharges → thunder follows.",
            "scene": "lightning",
            "steps": [
                {"label": "Charge separation", "description": "Ice particles in clouds separate positive and negative charges.", "visual": "mix"},
                {"label": "Lightning strike", "description": "Huge voltage jumps — bright flash heats air to ~30,000°C.", "visual": "react"},
                {"label": "Thunder", "description": "Heated air expands explosively — sound arrives seconds later.", "visual": "product"}
            ]
        }
    ],
    "light": [
        {
            "id": "prism-dispersion",
            "title": "Prism — White Light to Rainbow",
            "description": "A glass prism bends each colour differently, splitting white light into VIBGYOR.",
            "scene": "light",
            "steps": [
                {"label": "White ray enters", "description": "A narrow beam of white sunlight hits the prism.", "visual": "mix"},
                {"label": "Refraction splits", "description": "Different wavelengths bend by different amounts at the glass.", "visual": "react"},
                {"label": "Spectrum forms", "description": "Seven colours spread out — violet bends most, red least.", "visual": "product"}
            ]
        }
    ],
    "stars-solar-system": [
        {
            "id": "moon-phases-demo",
            "title": "Moon Phases — Sunlit Half Always",
            "description": "As the Moon orbits Earth, we see different fractions of its sunlit side.",
            "scene": "moon-phases",
            "steps": [
                {"label": "New moon", "description": "Moon between Earth and Sun — dark side faces us.", "visual": "mix"},
                {"label": "Waxing phases", "description": "Moon moves — we see a growing crescent then half-moon.", "visual": "react"},
                {"label": "Full moon", "description": "Earth between Sun and Moon — entire sunlit face visible.", "visual": "product"}
            ]
        }
    ],
}


def main():
    for chapter_id, demos in DEMOS.items():
        path = ROOT / f"{chapter_id}.json"
        if not path.exists():
            print(f"SKIP missing: {path}")
            continue
        data = json.loads(path.read_text())
        data["demos"] = demos
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        print(f"Updated {chapter_id} ({len(demos)} demos)")


if __name__ == "__main__":
    main()
