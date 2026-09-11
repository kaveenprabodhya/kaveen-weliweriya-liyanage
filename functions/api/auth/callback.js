import { cookie, fail, randomValue, settings } from './index.js';

export async function onRequestGet({ request, env }) {
  const config = settings(env, request);
  if (!config) return fail('Publishing sign-in is not configured for this site.', 503);
  const url = new URL(request.url);
  const cookies = Object.fromEntries((request.headers.get('Cookie') || '').split(';').map(s => s.trim().split('=')));
  const state = cookies['__Host-kd-state'];
  const verifier = cookies['__Host-kd-verifier'];
  if (!state || !/^[a-f0-9]{64}$/.test(state) || state !== url.searchParams.get('state') || !verifier || !/^[a-f0-9]{64}$/.test(verifier)) {
    return fail('Sign-in expired or could not be verified. Close this window and sign in again.');
  }
  const finishError = (message, status = 400) => {
    const response = fail(message, status);
    response.headers.append('Set-Cookie', cookie('__Host-kd-state', '', 0));
    response.headers.append('Set-Cookie', cookie('__Host-kd-verifier', '', 0));
    return response;
  };
  if (url.searchParams.has('error') || !url.searchParams.get('code')) return finishError('GitHub sign-in was cancelled.');
  try {
    const exchange = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
        code: url.searchParams.get('code'), redirect_uri: `${config.origin}/api/auth/callback`, code_verifier: verifier }),
    });
    const result = await exchange.json();
    if (!exchange.ok || typeof result.access_token !== 'string') return finishError('GitHub could not complete sign-in. Please try again.', 502);
    const access = await fetch(`https://api.github.com/repos/${config.repo}`, {
      headers: { Authorization: `Bearer ${result.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Kaveen-Desktop-CMS' },
    });
    const repo = await access.json();
    if (!access.ok || repo.permissions?.push !== true) return finishError('Only approved repository authors can use this editor.', 403);
    const nonce = randomValue();
    const origin = JSON.stringify(config.origin).replace(/</g, '\\u003c');
    const payload = JSON.stringify(`authorization:github:success:${JSON.stringify({ token: result.access_token, provider: 'github' })}`).replace(/</g, '\\u003c');
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>GitHub sign-in</title><p>Completing sign-in. You can close this window after the editor opens.</p><script nonce="${nonce}">
      const origin = ${origin};
      function receive(event) {
        if (event.origin !== origin || event.source !== window.opener || event.data !== 'authorizing:github') return;
        window.removeEventListener('message', receive);
        window.opener.postMessage(${payload}, origin);
        window.close();
      }
      if (window.opener) {
        window.addEventListener('message', receive);
        window.opener.postMessage('authorizing:github', origin);
      }
    </script></html>`;
    const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'` });
    headers.append('Set-Cookie', cookie('__Host-kd-state', '', 0));
    headers.append('Set-Cookie', cookie('__Host-kd-verifier', '', 0));
    return new Response(html, { headers });
  } catch (_) { return finishError('GitHub is temporarily unavailable. Please try again.', 502); }
}
