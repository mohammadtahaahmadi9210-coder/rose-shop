
const enc = new TextEncoder();

async function hash(s) {
  const b = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return btoa(String.fromCharCode(...new Uint8Array(b)));
}

export async function onRequestPost({request, env}) {
  const raw = request.headers.get('Cookie') || '';
  const token = raw.split(';')
    .map(x => x.trim())
    .find(x => x.startsWith('rose_session='))
    ?.slice(13);

  if (token && env.DB) {
    await env.DB.prepare(
      'DELETE FROM mediator_sessions WHERE token_hash=?'
    ).bind(await hash(token)).run();
  }

  return new Response(JSON.stringify({ok: true}), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'rose_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
      'Cache-Control': 'no-store'
    }
  });
}

