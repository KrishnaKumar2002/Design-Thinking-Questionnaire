export const roles = [
  { value: "Worker", label: "Frontline worker / end user" },
  { value: "Manager", label: "Supervisor / operations manager" },
  { value: "Safety", label: "Safety / quality / training" },
  { value: "Technical", label: "IT / AI / technical expert" },
  { value: "Business", label: "Business / procurement / buyer" },
  { value: "Other", label: "Other stakeholder" },
] as const;

export const commonQuestions = [
  "Describe your role and main tasks.",
  "Walk me through one typical task from beginning to end.",
  "At which point do you need help or additional information?",
  "Describe a recent situation when something did not go as expected.",
  "What is the most frustrating part of the current workflow?",
  "How do you solve this problem today?",
  "What information or guidance would help?",
  "What concerns would you have about a camera- or voice-enabled wearable?",
  "What would make you trust or reject an AI-assisted tool?",
  "What measurable improvement would make a new solution worthwhile?",
];

export const roleQuestions: Record<string, string[]> = {
  Worker: [
    "Which task is hardest while your hands are occupied?",
    "When do you stop work to find information?",
    "What guidance format would help most?",
    "What would make a wearable uncomfortable or distracting?",
  ],
  Manager: [
    "Where do delays, errors, or rework occur?",
    "Which tasks depend on experienced employees?",
    "How do you measure productivity and quality?",
    "What evidence would justify a pilot?",
  ],
  Safety: [
    "Which tasks have the highest safety risks?",
    "What must happen if an AI recommendation is wrong?",
    "Which decisions require human approval?",
    "What privacy and compliance controls are necessary?",
  ],
  Technical: [
    "Where are manuals and work instructions stored?",
    "What connectivity and integration constraints exist?",
    "What security and data-access controls are required?",
    "How should the system handle uncertainty or failure?",
  ],
  Business: [
    "What business problem deserves investment?",
    "How does the problem affect cost or productivity?",
    "Who approves and pays for a solution?",
    "What pilot results would justify purchasing it?",
  ],
  Other: [
    "What problem do you see in the current workflow?",
    "Who experiences the problem most?",
    "What would a successful solution achieve?",
    "What might prevent adoption?",
  ],
};

export const checklistItems = [
  "Task requires both hands",
  "Frequent interruptions",
  "Information hard to find",
  "Repeated questions or training needs",
  "Potential safety risk",
  "Current tools are inadequate",
];
