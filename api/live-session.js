export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { sdp } = req.body;

    if (!sdp) {
      return res.status(400).json({
        error: "SDP offer is required"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/live/sessions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session: {
            model: "gpt-live-1"
          },
          transport: {
            type: "webrtc",
            sdp: sdp
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Live session error:", error);

    return res.status(500).json({
      error: "Failed to create Live session"
    });
  }
}
