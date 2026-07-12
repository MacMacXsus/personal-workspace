export function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>(
    (cookies, pair) => {
      const separatorIndex = pair.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const name = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();

      if (name) {
        cookies[name] = decodeURIComponent(value);
      }

      return cookies;
    },
    {},
  );
}

export function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  return parseCookies(cookieHeader)[name];
}
