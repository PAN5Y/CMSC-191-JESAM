Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '*';
  const defaultHeaders = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: defaultHeaders,
    });
  }

  try {
    const { title, abstractText } = await req.json();
    const apiKey = Deno.env.get('AI_API_KEY');

    if (!apiKey) {
      throw new Error('AI_API_KEY not set');
    }

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanAbstract = typeof abstractText === 'string' ? abstractText.trim() : '';

    if (!cleanTitle || !cleanAbstract) {
      return new Response(JSON.stringify({ error: 'Both title and abstract are required.' }), {
        status: 400,
        headers: defaultHeaders,
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        max_tokens: 160,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You generate concise academic manuscript keywords. Return only valid JSON with a key named keywords containing 3 to 6 short keyword strings. Do not include explanations.',
          },
          {
            role: 'user',
            content: `Title: ${cleanTitle}\n\nAbstract: ${cleanAbstract}\n\nGenerate keywords that are specific, non-duplicative, and suitable for journal indexing.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq API error: ${response.status} ${response.statusText} ${detail}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: { keywords?: unknown } = {};

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .map((k) => String(k).trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];

    return new Response(JSON.stringify({ keywords }), {
      headers: defaultHeaders,
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: defaultHeaders,
    });
  }
});
