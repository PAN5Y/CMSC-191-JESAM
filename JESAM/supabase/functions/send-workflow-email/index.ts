const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-user-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EmailPayload = {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename?: string;
    contentType?: string;
    contentBase64?: string;
  }>;
};

type GmailTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type SupabaseUserResponse = {
  id?: string;
  email?: string;
  role?: string;
  error?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function bearerToken(req: Request) {
  const userToken = req.headers.get("x-supabase-user-token")?.trim();
  if (userToken) return userToken;

  const header = req.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function requireAuthenticatedCaller(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return { ok: false as const, response: json({ error: "Missing Supabase user token." }, 401) };
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  const result = (await response.json().catch(() => ({}))) as SupabaseUserResponse;

  if (!response.ok || !result.id) {
    console.error("Supabase user token verification failed", {
      status: response.status,
      result,
    });
    return { ok: false as const, response: json({ error: "Invalid or expired Supabase user token." }, 401) };
  }

  console.log("Supabase caller verified", {
    userId: result.id,
    email: result.email,
  });
  return { ok: true as const, user: result };
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function base64Encode(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

function encodeMimeHeader(value: string) {
  return /^[\x00-\x7F]*$/.test(value)
    ? sanitizeHeader(value)
    : `=?UTF-8?B?${base64Encode(new TextEncoder().encode(value))}?=`;
}

function base64UrlEncode(bytes: Uint8Array) {
  return base64Encode(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function wrapBase64(value: string) {
  return value.replace(/\s+/g, "").replace(/(.{76})/g, "$1\r\n");
}

function buildMimeMessage(input: {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    contentBase64: string;
  }>;
}) {
  const mixedBoundary = `jesam-mixed-${crypto.randomUUID()}`;
  const alternativeBoundary = `jesam-alt-${crypto.randomUUID()}`;
  const hasAttachments = (input.attachments?.length ?? 0) > 0;
  const headers = [
    `From: ${encodeMimeHeader(input.fromName)} <${sanitizeHeader(input.from)}>`,
    `To: ${sanitizeHeader(input.to)}`,
    `Subject: ${encodeMimeHeader(input.subject)}`,
    input.replyTo ? `Reply-To: ${sanitizeHeader(input.replyTo)}` : undefined,
    "MIME-Version: 1.0",
    hasAttachments
      ? `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`
      : `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
  ].filter(Boolean);

  const text = input.text ?? input.html?.replace(/<[^>]*>/g, " ") ?? "";
  const alternativeParts = [
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
  ];

  if (input.html) {
    alternativeParts.push(
      `--${alternativeBoundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      input.html
    );
  }

  alternativeParts.push(`--${alternativeBoundary}--`);

  if (!hasAttachments) {
    return [...headers, "", ...alternativeParts].join("\r\n");
  }

  const parts = [
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    ...alternativeParts,
  ];

  for (const attachment of input.attachments ?? []) {
    const filename = sanitizeHeader(attachment.filename);
    parts.push(
      `--${mixedBoundary}`,
      `Content-Type: ${sanitizeHeader(attachment.contentType)}; name="${filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${filename}"`,
      "",
      wrapBase64(attachment.contentBase64)
    );
  }

  parts.push(`--${mixedBoundary}--`);
  return [...headers, "", ...parts].join("\r\n");
}

async function getGmailAccessToken() {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = requireEnv("GOOGLE_REFRESH_TOKEN");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const result = (await response.json().catch(() => ({}))) as GmailTokenResponse;
  if (!response.ok || !result.access_token) {
    console.error("Gmail token request failed", {
      status: response.status,
      error: result.error,
      error_description: result.error_description,
    });
    if (result.error === "unauthorized_client") {
      throw new Error(
        "Gmail OAuth client is unauthorized. Regenerate GOOGLE_REFRESH_TOKEN using the exact GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET stored in Supabase, and confirm the Gmail API is enabled for that Google Cloud project."
      );
    }
    throw new Error(
      result.error_description || result.error || "Could not get Gmail access token."
    );
  }

  console.log("Gmail access token acquired");
  return result.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let caller;
  try {
    caller = await requireAuthenticatedCaller(req);
  } catch (error) {
    console.error("Supabase token verification setup failed", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not verify workflow email caller.",
      },
      500
    );
  }
  if (!caller.ok) return caller.response;

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON payload." }, 400);
  }

  const to = payload.to?.trim();
  const subject = payload.subject?.trim();
  const html = payload.html?.trim();
  const text = payload.text?.trim();
  const attachments = (payload.attachments ?? [])
    .map((attachment) => ({
      filename: attachment.filename?.trim() ?? "",
      contentType: attachment.contentType?.trim() || "application/octet-stream",
      contentBase64: attachment.contentBase64?.trim() ?? "",
    }))
    .filter((attachment) => attachment.filename && attachment.contentBase64);

  if (!to || !subject || (!html && !text)) {
    return json({ error: "Missing required email fields: to, subject, and html or text." }, 400);
  }

  try {
    const from = requireEnv("GMAIL_SENDER_EMAIL");
    const fromName = Deno.env.get("GMAIL_SENDER_NAME")?.trim() || "JESAM Editorial Office";
    console.log("Preparing Gmail workflow email", {
      from,
      to,
      subject,
      callerEmail: caller.user.email,
    });
    const accessToken = await getGmailAccessToken();
    const raw = base64UrlEncode(
      new TextEncoder().encode(
        buildMimeMessage({
          from,
          fromName,
          to,
          subject,
          text,
          html,
          replyTo: payload.replyTo,
          attachments,
        })
      )
    );

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Gmail send request failed", {
        status: response.status,
        result,
      });
      return json({ error: "Gmail send request failed.", details: result }, response.status);
    }

    console.log("Gmail workflow email sent", {
      to,
      messageId: (result as { id?: string }).id,
    });
    return json({ ok: true, provider: "gmail", result });
  } catch (error) {
    console.error("send-workflow-email failed", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Gmail email request failed.",
      },
      500
    );
  }
});
