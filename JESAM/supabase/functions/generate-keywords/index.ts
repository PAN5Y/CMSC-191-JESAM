
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
    const { abstractText } = await req.json();
    const apiKey = Deno.env.get("EDEN_AI_SANDBOX_API_KEY");

    if (!apiKey) {
      throw new Error("EDEN_AI_SANDBOX_API_KEY not set");
    }

    const response = await fetch("https://api.edenai.run/v3/universal-ai", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text/topic_extraction/openai",
        input: {
          text: abstractText,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Eden AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Eden AI response:", data);
    
    // Extract the list of keywords from the provider's response
    // Eden AI returns: { output: { items: [{ category: string, importance: float }] } }
    const keywords = data.output?.items?.map((item: any) => item.category) || [];

    return new Response(JSON.stringify({ keywords }), {
      headers: defaultHeaders
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: defaultHeaders,
    });
  }
});