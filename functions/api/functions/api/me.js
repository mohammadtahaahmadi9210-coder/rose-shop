
const enc = new TextEncoder();

async function hash(s) {
  const b = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return btoa(String.fromCharCode(...new Uint8Array(b)));
}

export async function onRequestGet({request, env}) {
  if (!env.DB) {
    return Response.json({error: 'DB unavailable'}, {status: 503});
  }

  const raw = request.headers.get('Cookie') || '';
  const token = raw.split(';')
    .map(x => x.trim())
    .find(x => x.startsWith('rose_session='))
    ?.slice(13);

  if (!token) {
    return Response.json({error: 'unauthorized'}, {status: 401});
  }

  const row = await env.DB.prepare(
    'SELECT m.display_name FROM mediator_sessions s JOIN mediators m ON m.username=s.username WHERE s.token_hash=? AND s.expires_at>? AND m.active=1'
  ).bind(await hash(token), Math.floor(Date.now() / 1000)).first();

  return row
    ? Response.json({name: row.display_name}, {
        headers: {'Cache-Control': 'no-store'}
      })
    : Response.json({error: 'unauthorized'}, {status: 401});
}

