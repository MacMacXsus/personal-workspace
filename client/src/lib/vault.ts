import { buildApiUrl } from "./auth";

export type VaultSecretCategory =
  | "API Key"
  | "Token"
  | "Password"
  | "Secret"
  | "Note"
  | "Config";

export type VaultSecretRecord = {
  id: number;
  label: string;
  category: VaultSecretCategory;
  value: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type VaultSecretsResponse = {
  secrets: VaultSecretRecord[];
  categories: VaultSecretCategory[];
  total: number;
};

type VaultSecretResponse = {
  secret: VaultSecretRecord;
};

type VaultErrorResponse = {
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function requestVaultJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    ...options,
    headers,
  });

  const text = await response.text();
  let data: T | VaultErrorResponse | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as T | VaultErrorResponse;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.error === "string" && data.error
        ? data.error
        : "Vault request failed";

    throw new Error(message);
  }

  if (data === null) {
    throw new Error("Vault returned an invalid response.");
  }

  return data as T;
}

export async function fetchVaultSecrets(): Promise<VaultSecretsResponse> {
  return requestVaultJson<VaultSecretsResponse>("/vault/secrets");
}

export async function createVaultSecret(input: {
  label: string;
  category: VaultSecretCategory;
  value: string;
  notes?: string | null;
}): Promise<VaultSecretRecord> {
  const data = await requestVaultJson<VaultSecretResponse>("/vault/secrets", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.secret;
}

export async function updateVaultSecret(
  secretId: number,
  input: {
    label?: string;
    category?: VaultSecretCategory;
    value?: string;
    notes?: string | null;
  },
): Promise<VaultSecretRecord> {
  const data = await requestVaultJson<VaultSecretResponse>(
    `/vault/secrets/${secretId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );

  return data.secret;
}

export async function deleteVaultSecret(secretId: number) {
  await requestVaultJson<{ ok: true }>(`/vault/secrets/${secretId}`, {
    method: "DELETE",
  });
}
