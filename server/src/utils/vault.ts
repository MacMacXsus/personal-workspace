export const VAULT_SECRET_CATEGORIES = [
  "API Key",
  "Token",
  "Password",
  "Secret",
  "Note",
  "Config",
] as const;

export type VaultSecretCategory = (typeof VAULT_SECRET_CATEGORIES)[number];

export function normalizeVaultSecretLabel(value: string): string {
  const label = value.trim().replace(/\s+/g, " ");

  if (!label) {
    throw new Error("Please enter a label for this secret.");
  }

  return label;
}

export function normalizeVaultSecretValue(value: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error("Please enter the secret text.");
  }

  return value;
}

export function normalizeVaultSecretNotes(
  value: string | undefined,
): string | null {
  const notes = value?.trim().replace(/\s+/g, " ");

  return notes ? notes : null;
}

export function normalizeVaultSecretCategory(
  value: string,
): VaultSecretCategory {
  const normalized = value.trim();

  if (!VAULT_SECRET_CATEGORIES.includes(normalized as VaultSecretCategory)) {
    throw new Error("Please choose a valid secret category.");
  }

  return normalized as VaultSecretCategory;
}
