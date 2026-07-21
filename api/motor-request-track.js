function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function getTrackingNumber(request) {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const trackingNumber = requestUrl.searchParams.get("trackingNumber")?.trim();

  return trackingNumber || null;
}

function normalizeTrackingPayload(payload, requestType) {
  return {
    ...payload,
    requestType,
    subject: payload.subject ?? payload.vehicle ?? payload.projectName ?? payload.project?.name,
  };
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Method not allowed." });
    return;
  }

  const apiBaseUrl = process.env.MOTOR_API_BASE_URL ?? process.env.VITE_API_BASE_URL;
  const apiKey = process.env.MOTOR_API_KEY ?? process.env.VITE_API_KEY;
  const trackingNumber = getTrackingNumber(request);

  if (!trackingNumber) {
    sendJson(response, 400, { message: "Tracking number is required." });
    return;
  }

  if (!apiBaseUrl || !apiKey || apiKey === "YOUR_PUBLIC_API_KEY" || apiKey === "replace_with_production_api_key") {
    sendJson(response, 500, { message: "Tracking API is not configured." });
    return;
  }

  const baseUrl = apiBaseUrl.replace(/\/$/, "");
  const encodedTrackingNumber = encodeURIComponent(trackingNumber);
  const upstreamTargets = [
    {
      type: "motor",
      url: `${baseUrl}/api/public/motor-requests/track/${encodedTrackingNumber}`,
    },
    {
      type: "engineering",
      url: `${baseUrl}/api/v1/public/engineering-requests/track/${encodedTrackingNumber}`,
    },
    {
      type: "engineering",
      url: `${baseUrl}/api/v1/public/engineering-requests/${encodedTrackingNumber}`,
    },
  ];

  let lastResponseBody = "";
  let lastStatus = 404;
  let lastContentType = "application/json; charset=utf-8";

  for (const target of upstreamTargets) {
    const upstreamResponse = await fetch(target.url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      redirect: "manual",
    });

    const responseBody = await upstreamResponse.text();
    lastResponseBody = responseBody;
    lastStatus = upstreamResponse.status;
    lastContentType = upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8";

    if (upstreamResponse.status === 404) {
      continue;
    }

    if (upstreamResponse.ok && lastContentType.includes("application/json") && responseBody) {
      sendJson(response, upstreamResponse.status, normalizeTrackingPayload(JSON.parse(responseBody), target.type));
      return;
    }

    response.statusCode = upstreamResponse.status;
    response.setHeader("Content-Type", lastContentType);
    response.end(responseBody || "{}");
    return;
  }

  response.statusCode = lastStatus;
  response.setHeader("Content-Type", lastContentType);
  response.end(lastResponseBody || JSON.stringify({ message: "Request was not found." }));
}
