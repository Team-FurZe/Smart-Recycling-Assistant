export const GENERAL_TIPS = [
  "Crush plastic bottles before placing them in the bin.",
  "Fold cardboard boxes to reduce volume.",
  "Rinse glass bottles when possible.",
  "Empty metal cans before recycling.",
  "Greasy pizza boxes are not suitable for paper recycling.",
];

const CLASS_TIPS = {
  BIODEGRADABLE: {
    title: "Biodegradable",
    recyclable: true,
    tips: [
      "Keep food waste separate from dry recyclables.",
      "Use compost bins where available.",
      "Avoid mixing biodegradable waste with plastic bags.",
    ],
  },
  CARDBOARD: {
    title: "Cardboard",
    recyclable: true,
    tips: [
      "Flatten boxes to save space.",
      "Remove tape or plastic packaging when possible.",
      "Keep cardboard dry and clean.",
    ],
  },
  GLASS: {
    title: "Glass",
    recyclable: true,
    tips: [
      "Try to recycle glass bottles without breaking them.",
      "Rinse bottles before recycling.",
      "Remove leftover liquids.",
    ],
  },
  METAL: {
    title: "Metal",
    recyclable: true,
    tips: [
      "Rinse cans to make recycling easier.",
      "Empty aerosol cans fully before disposal.",
      "Do not place sharp metal pieces loosely in the bin.",
    ],
  },
  PAPER: {
    title: "Paper",
    recyclable: true,
    tips: [
      "Wet or greasy paper cannot be recycled.",
      "Keep paper dry and separate from food waste.",
      "Remove plastic covers or bindings when possible.",
    ],
  },
  PLASTIC: {
    title: "Plastic",
    recyclable: true,
    tips: [
      "Rinse before recycling.",
      "Remove leftover liquids.",
      "Crush bottles to save space.",
      "Some municipalities recommend collecting bottle caps separately.",
    ],
  },
  BATTERY: {
    title: "Battery",
    recyclable: false,
    tips: [
      "Do not throw batteries into regular trash.",
      "Use battery collection boxes.",
      "Tape battery terminals when storing many used batteries together.",
    ],
  },
};

export function normalizeLabel(label) {
  return String(label || "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

export function getClassTip(label) {
  const key = normalizeLabel(label);
  const fallbackTitle = String(label || "Unknown").trim() || "Unknown";

  return {
    key,
    ...(CLASS_TIPS[key] || {
      title: fallbackTitle,
      recyclable: true,
      tips: ["Check your local recycling rules for this material."],
    }),
  };
}
