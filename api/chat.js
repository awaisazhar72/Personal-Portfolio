export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Forwarded-Host, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  console.log("📨 API Request received");

  if (!apiKey) {
    return res.status(500).json({ error: "Missing GROQ_API_KEY" });
  }

  try {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const formattedMessages = [
      ...(systemMessage ? [systemMessage] : []),
      ...userMessages,
    ];

    console.log("🔄 Sending to Groq API");

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: formattedMessages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1024,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Groq API Error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Groq API failed",
      });
    }

    console.log("✅ Response from Groq received");

    return res.status(200).json({
      choices: [
        {
          message: {
            content: data.choices?.[0]?.message?.content || "No response",
          },
        },
      ],
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
