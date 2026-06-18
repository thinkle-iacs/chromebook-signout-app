import netlifyIdentity from "netlify-identity-widget";

function getAuthHeaders(): Record<string, string> {
  const token = (netlifyIdentity.currentUser() as any)?.token?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> || {}),
    },
  });
}
