import { onRequestGet as login, fail } from '../functions/api/auth/index.js';
import { onRequestGet as callback } from '../functions/api/auth/callback.js';

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname.replace(/\/$/, '');
    if (pathname === '/api/auth' || pathname === '/api/auth/callback') {
      if (request.method !== 'GET') {
        const response = fail('Method not allowed', 405);
        response.headers.set('Allow', 'GET');
        return response;
      }
      return (pathname === '/api/auth' ? login : callback)({ request, env });
    }
    if (pathname === '/api' || pathname.startsWith('/api/')) return fail('Not found', 404);
    return env.ASSETS.fetch(request);
  },
};
