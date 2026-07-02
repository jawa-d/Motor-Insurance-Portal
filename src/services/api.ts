const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const apiKey = import.meta.env.VITE_API_KEY;
const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function postMultipart<TResponse>(path: string, body: FormData): Promise<TResponse> {
  if (!apiBaseUrl) {
    throw new ApiError(500, "API base URL is not configured.");
  }

  if (!apiKey || apiKey === "YOUR_PUBLIC_API_KEY") {
    throw new ApiError(401, "API key is not configured.");
  }

  const baseUrl = isLocalDev ? "" : apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
    body,
    redirect: "manual",
  });

  if (response.status >= 300 && response.status < 400) {
    throw new ApiError(401, "Request was redirected to authentication.");
  }

  let data: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    throw new ApiError(response.status, "Request failed.");
  }

  return data as TResponse;
}
