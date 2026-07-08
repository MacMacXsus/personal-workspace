export type SessionUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type AuthSuccessResponse = {
  user: SessionUser;
};

type AuthErrorResponse = {
  error?: string;
};

type CurrentUserResponse =
  | {
      user: SessionUser;
    }
  | {
      user: null;
    };

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${apiBaseUrl}${normalizedPath}`;
}

export function startGoogleAuth() {
  window.location.assign(buildApiUrl("/auth/google"));
}

async function requestJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data: T | AuthErrorResponse | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as T | AuthErrorResponse;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.error === "string" && data.error
        ? data.error
        : "Authentication request failed";

    throw new Error(message);
  }

  return data as T;
}

export async function loginWithPassword(email: string, password: string) {
  const data = await requestJson<AuthSuccessResponse>("/auth/login", {
    email,
    password,
  });

  return data.user;
}

export async function signupWithPassword(
  name: string,
  email: string,
  password: string,
) {
  const data = await requestJson<AuthSuccessResponse>("/auth/signup", {
    name,
    email,
    password,
  });

  return data.user;
}

export async function fetchCurrentUser(): Promise<SessionUser> {
  const response = await fetch(buildApiUrl("/auth/me"), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Not authenticated");
  }

  const data = (await response.json()) as CurrentUserResponse;

  if (!data.user) {
    throw new Error("Not authenticated");
  }

  return data.user;
}

export async function logout() {
  await fetch(buildApiUrl("/auth/logout"), {
    method: "POST",
    credentials: "include",
  });
}
