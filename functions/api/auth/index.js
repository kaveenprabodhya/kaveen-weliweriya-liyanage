const securityHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};
export function fail(message, status = 400) {
  return new Response(message, { status, headers: securityHeaders });
}
export function configurationError(env, request) {
  const missing = ['SITE_URL', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'].filter(key => typeof env[key] !== 'string' || !env[key].trim());
  if (missing.length) return `Publishing sign-in is not configured: missing runtime variable(s): ${missing.join(', ')}. Add them under this Worker's Settings → Variables and Secrets, then Deploy. Build variables do not configure runtime sign-in.`;
  let site;
  try { site = new URL(env.SITE_URL); } catch { return 'Publishing sign-in is not configured: SITE_URL is not a valid HTTPS URL.'; }
  if (site.protocol !== 'https:') return 'Publishing sign-in is not configured: SITE_URL must use HTTPS.';
  if (site.origin !== new URL(request.url).origin) return 'Publishing sign-in is not configured: SITE_URL does not match the origin of this request. Open the production site and set SITE_URL to its exact HTTPS origin.';
  return null;
}
export function settings(env, request) {
  if (configurationError(env, request)) return null;
  const origin = new URL(env.SITE_URL).origin;
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
  if (!config) return fail(configurationError(env, request), 503);
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
