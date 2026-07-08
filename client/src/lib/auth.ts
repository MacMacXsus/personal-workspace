export type SessionUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type CurrentUserResponse =
  | {
      user: SessionUser;
    }
  | {
      user: null;
    };

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${apiBaseUrl}${normalizedPath}`;
}

export function startGoogleAuth() {
  window.location.assign(buildApiUrl("/auth/google"));
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
