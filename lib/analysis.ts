export const themeDictionary = [
  { name: "Hands-free assistance", words: ["hands-free", "both hands", "hands occupied", "gloves", "voice", "spoken"] },
  { name: "Information access", words: ["manual", "information", "search", "documentation", "instructions", "knowledge"] },
  { name: "Training and expertise", words: ["training", "beginner", "expert", "experienced", "learn", "colleague", "guidance"] },
  { name: "Safety and errors", words: ["safety", "unsafe", "risk", "error", "mistake", "warning", "danger", "incorrect"] },
  { name: "Interruptions and productivity", words: ["interrupt", "delay", "slow", "time-consuming", "rework", "productivity", "stop work"] },
  { name: "Privacy and trust", words: ["privacy", "recording", "camera", "consent", "trust", "data access", "surveillance"] },
  { name: "Wearable usability", words: ["comfort", "weight", "battery", "distracting", "smart glasses", "wearable"] },
  { name: "Integration and connectivity", words: ["integration", "connectivity", "offline", "network", "system", "database"] },
];

export function analyseText(text: string) {
  const lower = text.toLowerCase();
  return themeDictionary.map(t => ({
    name: t.name,
    matches: t.words.filter(w => lower.includes(w)),
    count: t.words.filter(w => lower.includes(w)).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);
}
