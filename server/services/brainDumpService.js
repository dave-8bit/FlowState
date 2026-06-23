const { Groq } = require("groq-sdk");

const REQUIRED_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const safeNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const normalizeResponse = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const tasks = raw.tasks;
  if (!Array.isArray(tasks)) return null;

  const normalized = [];

  for (const t of tasks) {
    if (!t || typeof t !== "object") continue;

    const title = typeof t.title === "string" ? t.title : "";
    const descriptionRaw = t.description;
    const description = typeof descriptionRaw === "string" ? descriptionRaw : "";

    const priorityRaw = t.priority;
    const priority = typeof priorityRaw === "string" ? priorityRaw.toUpperCase() : "";

    // accept string or number; coerce to number
    const estimatedMinutes = safeNumber(t.estimatedMinutes);

    const suggestedDeadline =
      t.suggestedDeadline === undefined || t.suggestedDeadline === null
        ? null
        : typeof t.suggestedDeadline === "string"
          ? t.suggestedDeadline
          : null;

    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const tags = Array.isArray(t.tags) ? t.tags : [];

    if (title.trim().length === 0) continue;
    if (!REQUIRED_PRIORITIES.has(priority)) continue;
    if (estimatedMinutes === null || estimatedMinutes < 0) continue;

    // subtasks: best-effort; skip invalid subtasks
    const normalizedSubtasks = [];
    for (const st of subtasks) {
      if (!st || typeof st !== "object") continue;
      const stTitle = typeof st.title === "string" ? st.title : "";
      if (stTitle.trim().length === 0) continue;
      normalizedSubtasks.push({ title: stTitle, done: false });
    }

    // tags: best-effort
    const normalizedTags = [];
    for (const tag of tags) {
      if (typeof tag === "string" && tag.trim() !== "") {
        normalizedTags.push(tag);
      }
    }

    normalized.push({
      title,
      description,
      priority,
      estimatedMinutes,
      suggestedDeadline,
      subtasks: normalizedSubtasks,
      tags: normalizedTags,
    });
  }

  return normalized.length > 0 ? normalized : null;
};

const fallbackTasks = (input) => [
  {
    title: "Brain dump task",
    description: typeof input === "string" ? input.slice(0, 500) : "",
    priority: "MEDIUM",
    estimatedMinutes: 25,
    suggestedDeadline: null,
    subtasks: [],
    tags: [],
  },
];

const validateAndNormalize = (parsed) => {
  const normalized = normalizeResponse(parsed);
  if (!normalized || normalized.length === 0) return null;
  return normalized;
};


const getBrainDumpTasks = async ({ input }) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const client = new Groq({ apiKey: groqApiKey });

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            },
            estimatedMinutes: { type: "number" },
            suggestedDeadline: { anyOf: [{ type: "string" }, { type: "null" }] },
            subtasks: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  done: { type: "boolean", enum: [false] },
                },
                required: ["title", "done"],
              },
            },
            tags: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "title",
            "description",
            "priority",
            "estimatedMinutes",
            "suggestedDeadline",
            "subtasks",
            "tags",
          ],
        },
      },
    },
    required: ["tasks"],
  };

  const systemPrompt =
    "You are a task extraction engine. Convert the user's brain dump into structured tasks. Return STRICT JSON that matches the provided JSON schema. Do not include any other text.";

  const userPrompt = `Brain dump:\n${input}\n\nReturn: ${JSON.stringify(schema)}`;

  const completion = await client.chat.completions.create({
    model: "llama3-8b-8192", 
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content;

  let parsed;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const normalizedTasks = normalizeResponse(parsed);

  // Never hard-fail on slightly malformed-but-usable AI output
  if (!normalizedTasks || normalizedTasks.length === 0) {
    return fallbackTasks(input);
  }

  return normalizedTasks;
};

module.exports = { getBrainDumpTasks };


