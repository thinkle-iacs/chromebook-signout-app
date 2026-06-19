import netlifyIdentity from "netlify-identity-widget";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = netlifyIdentity.currentUser() as any;
  if (!user) return {};
  // jwt() refreshes the token if it has expired, unlike reading token.access_token directly
  const token: string = await user.jwt();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  // Normalise caller-supplied headers to a plain object so we can spread them
  const callerHeaders: Record<string, string> =
    options.headers instanceof Headers
      ? Object.fromEntries((options.headers as Headers).entries())
      : (options.headers as Record<string, string>) || {};
  return fetch(url, {
    ...options,
    headers: { ...authHeaders, ...callerHeaders },
  });
}
