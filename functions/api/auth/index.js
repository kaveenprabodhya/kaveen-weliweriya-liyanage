const securityHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};
export function fail(message, status = 400) {
  return new Response(message, { status, headers: securityHeaders });
}
export function settings(env, request) {
  if (!env.SITE_URL || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return null;
  const origin = new URL(env.SITE_URL).origin;
  if (!origin.startsWith('https://') || new URL(request.url).origin !== origin) return null;
  return { origin, repo: 'kaveenprabodhya/kaveen-weliweriya-liyanage' };
}
export function cookie(name, value, maxAge = 600) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function randomValue() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
}
export async function onRequestGet({ request, env }) {
  const config = settings(env, request);
  if (!config) return fail('Publishing sign-in is not configured for this site. See docs/PUBLISHING.md.', 503);
  const state = randomValue();
  const verifier = randomValue();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const target = new URL('https://github.com/login/oauth/authorize');
  target.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID, redirect_uri: `${config.origin}/api/auth/callback`,
    scope: 'public_repo', state, code_challenge: challenge, code_challenge_method: 'S256',
  }).toString();
  const headers = new Headers({ ...securityHeaders, Location: target.href });
  headers.append('Set-Cookie', cookie('__Host-kd-state', state));
  headers.append('Set-Cookie', cookie('__Host-kd-verifier', verifier));
  return new Response(null, { status: 302, headers });
}
