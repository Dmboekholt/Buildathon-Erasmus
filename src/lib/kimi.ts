const KIMI_API_URL = "https://api.moonshot.ai/v1/chat/completions";
const KIMI_MODEL = "kimi-k2.6";

export async function kimiChatJson(params: {
  system: string;
  user: string;
}): Promise<string> {
  const apiKey = process.env.KIMI_2_6_API_KEY;
  if (!apiKey) {
    throw new Error("KIMI_2_6_API_KEY is not configured");
  }

  const res = await fetch(KIMI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
    }),
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
