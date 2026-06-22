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
    if (!t || typeof t !== "object") return null;

    const title = t.title;
    const description = t.description;
    const priority = t.priority;
    const estimatedMinutes = safeNumber(t.estimatedMinutes);
    const suggestedDeadline =
      t.suggestedDeadline === undefined ? null : t.suggestedDeadline;
    const subtasks = t.subtasks;
    const tags = t.tags;

    if (typeof title !== "string" || title.trim() === "") return null;
    if (typeof description !== "string") return null;
    if (!REQUIRED_PRIORITIES.has(priority)) return null;
    if (estimatedMinutes === null || estimatedMinutes < 0) return null;

    if (
      suggestedDeadline !== null &&
      typeof suggestedDeadline !== "string"
    ) {
      return null;
    }

    if (!Array.isArray(subtasks)) return null;
    for (const st of subtasks) {
      if (!st || typeof st !== "object") return null;
      if (typeof st.title !== "string" || st.title.trim() === "") return null;
      if (st.done !== false && st.done !== true) return null;
    }

    if (!Array.isArray(tags)) return null;
    for (const tag of tags) {
      if (typeof tag !== "string") return null;
    }

    normalized.push({
      title,
      description,
      priority,
      estimatedMinutes,
      suggestedDeadline,
      subtasks: subtasks.map((st) => ({
        title: st.title,
        done: false,
      })),
      tags,
    });
  }

  return normalized;
};

const getBrainDumpTasks = async ({ input }) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  // Note: groq-sdk may not be installed yet; this file expects it.
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

  const userPrompt =
    `Brain dump:\n${input}\n\nReturn: ${JSON.stringify(schema)}`;

  const completion = await client.chat.completions.create({
    model: "llama-3.1-70b-versatile",
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
  if (!normalizedTasks) {
    throw new Error("AI response did not match schema");
  }

  return normalizedTasks;
};

module.exports = { getBrainDumpTasks };

