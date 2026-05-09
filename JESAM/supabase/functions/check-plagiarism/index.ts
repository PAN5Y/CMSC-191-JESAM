
Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "*";
  const defaultHeaders = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: defaultHeaders,
    });
  }

  try {
    // Get the text from the frontend
    const { text } = await req.json();
    const apiKey = Deno.env.get("EDEN_AI_SANDBOX_API_KEY");

    if (!apiKey) {
      throw new Error("EDEN_AI_SANDBOX_API_KEY not set");
    }

    // Call Eden AI
    const response = await fetch("https://api.edenai.run/v3/universal-ai", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text/plagia_detection/winstonai",
        input: {
          text: text,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Eden AI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Send back the score (0-100)
    const score = (result.result?.plagiarism_score || 0) * 100;

    return new Response(JSON.stringify({ score }), {
      headers: defaultHeaders,
    });

    // MOCK RESPONSE (fallback if Eden AI fails)
    /*
    const score = Math.floor(Math.random() * 35) + 5; // Random score 5-40
    console.log(`Mock plagiarism check for text length ${text.length}: score ${score}`);
    return new Response(JSON.stringify({ score }), {
      headers: defaultHeaders,
    });
    */
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: defaultHeaders,
    });
  }
});