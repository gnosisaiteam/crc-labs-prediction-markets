import type { Item } from "./types"

export const mockItems: Item[] = [
  {
    id: 1,
    name: "Quantum Processor",
    category: "Computing",
    rarity: "Legendary",
    powerLevel: 95,
    created: "2025-03-15",
    description:
      "A revolutionary quantum processor capable of performing calculations across multiple dimensions simultaneously.",
    properties: {
      Qubits: 512,
      "Error Rate": "0.0001%",
      "Power Draw": "15W",
      Material: "Synthetic Diamond",
      Cooling: "Superconducting",
      Dimensions: "2.5 x 2.5 cm",
    },
  },
  {
    id: 2,
    name: "Neural Interface",
    category: "Biotechnology",
    rarity: "Epic",
    powerLevel: 87,
    created: "2025-01-22",
    description:
      "A non-invasive neural interface that allows direct communication between the human brain and digital systems.",
    properties: {
      Channels: 1024,
      Resolution: "10nm",
      Latency: "1.2ms",
      Biocompatibility: "99.8%",
      "Battery Life": "72 hours",
      Weight: "12g",
    },
  },
  {
    id: 3,
    name: "Graviton Stabilizer",
    category: "Physics",
    rarity: "Rare",
    powerLevel: 78,
    created: "2024-11-05",
    description:
      "A device capable of manipulating local gravitational fields for various applications in construction and transportation.",
    properties: {
      Range: "50m",
      "Max Force": "500kN",
      Precision: "0.01G",
      "Power Source": "Fusion Cell",
      "Operational Time": "8 hours",
      "Safety Rating": "A+",
    },
  },
  {
    id: 4,
    name: "Molecular Assembler",
    category: "Manufacturing",
    rarity: "Uncommon",
    powerLevel: 65,
    created: "2024-09-18",
    description: "A desktop-sized device capable of assembling complex molecular structures atom by atom.",
    properties: {
      Resolution: "0.1nm",
      Speed: "10^6 atoms/sec",
      Materials: "62 elements",
      Interface: "Holographic",
      Size: "45 x 30 x 30 cm",
      Certification: "ISO 9001",
    },
  },
  {
    id: 5,
    name: "Photonic Memory Crystal",
    category: "Storage",
    rarity: "Common",
    powerLevel: 52,
    created: "2024-07-30",
    description:
      "A crystal storage medium that uses light to store and retrieve vast amounts of data with perfect fidelity.",
    properties: {
      Capacity: "1 Petabyte",
      "Read Speed": "10 TB/s",
      "Write Speed": "5 TB/s",
      Lifespan: "500 years",
      Dimensions: "5 x 5 x 5 cm",
      Durability: "Military Grade",
    },
  },
]
