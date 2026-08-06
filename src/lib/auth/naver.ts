const AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";
const TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
const PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

export const NAVER_STATE_COOKIE = "naver_oauth_state";

export function getNaverAuthorizeUrl(state: string, redirectUri: string) {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) throw new Error("NAVER_CLIENT_ID is not set.");

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeNaverCode(code: string, state: string, redirectUri: string) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET is not set.");
  }

  const url = new URL(TOKEN_URL);
  url.searchParams.set("grant_type", "authorization_code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("code", code);
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to exchange Naver authorization code.");

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(data.error ?? "Naver did not return an access token.");
  return data.access_token;
}

export type NaverProfile = {
  id: string;
  email?: string;
  name?: string;
  nickname?: string;
};

export async function getNaverProfile(accessToken: string): Promise<NaverProfile> {
  const res = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Naver profile.");

  const data = (await res.json()) as {
    resultcode: string;
    message: string;
    response?: NaverProfile;
  };
  if (data.resultcode !== "00" || !data.response) {
    throw new Error(data.message || "Failed to fetch Naver profile.");
  }
  return data.response;
}
