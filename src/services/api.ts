const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const apiKey = import.meta.env.VITE_API_KEY;
const isDevelopment = import.meta.env.DEV;

export class ApiError extends Error {
  status: number;
  responseBody?: string;

  constructor(status: number, message: string, responseBody?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

function getApiConfig() {
  if (!apiBaseUrl) {
    throw new ApiError(500, "API base URL is not configured.");
  }

  if (!apiKey || apiKey === "YOUR_PUBLIC_API_KEY" || apiKey === "replace_with_production_api_key") {
    throw new ApiError(401, "API key is not configured.");
  }

  return {
    apiKey,
    baseUrl: apiBaseUrl.replace(/\/$/, ""),
  };
}

export function getPublicApiConfig() {
  return getApiConfig();
}

export async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  try {
    const config = getApiConfig();
    const method = "POST";
    const apiUrl = `${config.baseUrl}${path}`;

    if (isDevelopment) {
      console.log("API URL:", apiUrl);
      console.log("HTTP Method:", method);
      console.log("Request:", body);
    }

    const response = await fetch(apiUrl, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify(body),
      redirect: "manual",
    });

    const responseBody = await response.text();

    if (isDevelopment) {
      console.log("Response Status:", response.status);
      console.log("Response:", responseBody);
    }

    if (response.status >= 300 && response.status < 400) {
      throw new ApiError(401, "Request was redirected to authentication.", responseBody);
    }

    let data: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json") && responseBody) {
      data = JSON.parse(responseBody);
    }

    if (!response.ok) {
      throw new ApiError(response.status, "Request failed.", responseBody);
    }

    return data as TResponse;
  } catch (error) {
    if (isDevelopment) {
      console.log("API Exception:", error);
    }

    throw error;
  }
}

export async function getJson<TResponse>(path: string): Promise<TResponse> {
  try {
    const config = getApiConfig();
    const method = "GET";
    const apiUrl = `${config.baseUrl}${path}`;

    if (isDevelopment) {
      console.log("API URL:", apiUrl);
      console.log("HTTP Method:", method);
    }

    const response = await fetch(apiUrl, {
      method,
      headers: {
        Accept: "application/json",
        "x-api-key": config.apiKey,
      },
      redirect: "manual",
    });

    const responseBody = await response.text();

    if (isDevelopment) {
      console.log("Response Status:", response.status);
      console.log("Response:", responseBody);
    }

    if (response.status >= 300 && response.status < 400) {
      throw new ApiError(401, "Request was redirected to authentication.", responseBody);
    }

    let data: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json") && responseBody) {
      data = JSON.parse(responseBody);
    }

    if (!response.ok) {
      throw new ApiError(response.status, "Request failed.", responseBody);
    }

    return data as TResponse;
  } catch (error) {
    if (isDevelopment) {
      console.log("API Exception:", error);
    }

    throw error;
  }
}

export async function getSameOriginJson<TResponse>(path: string): Promise<TResponse> {
  try {
    if (isDevelopment) {
      console.log("API URL:", path);
      console.log("HTTP Method: GET");
    }

    const response = await fetch(path, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      redirect: "manual",
    });

    const responseBody = await response.text();

    if (isDevelopment) {
      console.log("Response Status:", response.status);
      console.log("Response:", responseBody);
    }

    if (response.status >= 300 && response.status < 400) {
      throw new ApiError(401, "Request was redirected to authentication.", responseBody);
    }

    let data: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json") && responseBody) {
      data = JSON.parse(responseBody);
    }

    if (!response.ok) {
      throw new ApiError(response.status, "Request failed.", responseBody);
    }

    return data as TResponse;
  } catch (error) {
    if (isDevelopment) {
      console.log("API Exception:", error);
    }

    throw error;
  }
}
