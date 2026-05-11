const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA_DATA_BASE_URL = "https://analyticsdata.googleapis.com/v1beta";

function getDateRange(range) {
  if (range === "30d") return "30daysAgo";
  if (range === "90d") return "90daysAgo";
  if (range === "1y") return "365daysAgo";
  return "2020-01-01";
}

async function getAccessToken(env) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
    refresh_token: env.GOOGLE_REFRESH_TOKEN ?? "",
    grant_type: "refresh_token",
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Unable to refresh Google access token");
  }

  return data.access_token;
}

async function runReport(accessToken, propertyId, body) {
  const response = await fetch(`${GA_DATA_BASE_URL}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Unable to read Google Analytics report");
  }

  return data;
}

function metricValue(report, index) {
  return Number(report.rows?.[0]?.metricValues?.[index]?.value ?? 0);
}

function formatGaDate(value) {
  if (!value || value.length !== 8) return value;
  return `${value.slice(4, 6)}/${value.slice(6, 8)}`;
}

export async function getGaSummary(range, env = process.env) {
  const propertyId = env.GA_PROPERTY_ID;
  const hasConfig =
    propertyId &&
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_REFRESH_TOKEN;

  if (!hasConfig) {
    throw new Error("Google Analytics reporting is not configured on the server.");
  }

  const dateRange = { startDate: getDateRange(range), endDate: "today" };
  const accessToken = await getAccessToken(env);

  const [overview, paperViews, topPapers, trend, devices, sources, countries] = await Promise.all([
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      metrics: [
        { name: "screenPageViews" },
        { name: "activeUsers" },
        { name: "eventCount" },
        { name: "engagementRate" },
        { name: "averageSessionDuration" },
      ],
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "paper_view" },
        },
      },
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "BEGINS_WITH", value: "/article/public/" },
        },
      },
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 8,
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 8,
    }),
  ]);

  return {
    range,
    totals: {
      pageViews: metricValue(overview, 0),
        activeUsers: metricValue(overview, 1),
        events: metricValue(overview, 2),
        paperViews: metricValue(paperViews, 0),
        engagementRate: metricValue(overview, 3),
        averageSessionDuration: metricValue(overview, 4),
      },
      topPapers:
        topPapers.rows?.map((row) => ({
        path: row.dimensionValues?.[0]?.value ?? "",
        title: row.dimensionValues?.[1]?.value ?? "Untitled article",
          views: Number(row.metricValues?.[0]?.value ?? 0),
        })) ?? [],
      trend:
        trend.rows?.map((row) => ({
          date: formatGaDate(row.dimensionValues?.[0]?.value ?? ""),
          pageViews: Number(row.metricValues?.[0]?.value ?? 0),
          activeUsers: Number(row.metricValues?.[1]?.value ?? 0),
        })) ?? [],
      devices:
        devices.rows?.map((row) => ({
          name: row.dimensionValues?.[0]?.value ?? "Unknown",
          value: Number(row.metricValues?.[0]?.value ?? 0),
        })) ?? [],
      sources:
        sources.rows?.map((row) => ({
          name: row.dimensionValues?.[0]?.value ?? "Unassigned",
          value: Number(row.metricValues?.[0]?.value ?? 0),
        })) ?? [],
      countries:
        countries.rows?.map((row) => ({
          name: row.dimensionValues?.[0]?.value ?? "Unknown",
          value: Number(row.metricValues?.[0]?.value ?? 0),
        })) ?? [],
  };
}
