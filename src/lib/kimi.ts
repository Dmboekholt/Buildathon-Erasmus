const KIMI_API_URL = "https://api.moonshot.ai/v1/chat/completions";
const KIMI_MODEL = "kimi-k2.6";

export type KimiChatOptions = {
  /** Override model (e.g. moonshot-v1-8k for shorter/faster curriculum grading). */
  model?: string;
  /** Cap completion length — lowers latency for structured JSON responses. */
  maxCompletionTokens?: number;
  temperature?: number;
};

export async function kimiChatJson(params: {
  system: string;
  user: string;
  options?: KimiChatOptions;
}): Promise<string> {
  const apiKey = process.env.KIMI_2_6_API_KEY;
  if (!apiKey) {
    throw new Error("KIMI_2_6_API_KEY is not configured");
  }

  const model =
    params.options?.model ?? process.env.KIMI_MODEL ?? KIMI_MODEL;
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
    thinking: { type: "disabled" },
    response_format: { type: "json_object" },
    temperature: params.options?.temperature ?? 0,
  };
  if (params.options?.maxCompletionTokens != null) {
    body.max_completion_tokens = params.options.maxCompletionTokens;
  }

  const res = await fetch(KIMI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
      throw new Error("Kimi rate limit reached. Please try again shortly.");
    }
    throw new Error(`Kimi API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "{}";
}
