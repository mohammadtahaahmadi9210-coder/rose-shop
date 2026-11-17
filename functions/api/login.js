
const enc = new TextEncoder();
const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function sha256(s) {
  return b64(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

async function verifyPassword(password, saltB64, hashB64) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: fromB64(saltB64),
    iterations: 310000
  }, key, 256);
  const a = new Uint8Array(bits), b = fromB64(hashB64);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export async function onRequestPost({request, env}) {
  if (!env.DB) return Response.json({error:'پایگاه داده هنوز به سایت وصل نشده است.'},{status:503});

  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host)
    return Response.json({error:'درخواست نامعتبر است.'},{status:403});

  let body;
  try { body = await request.json(); }
  catch { return Response.json({error:'اطلاعات ورود نامعتبر است.'},{status:400}); }

  const username = String(body.name || '').trim();
  const password = String(body.password || '');

  if (!/^[\w.-]{3,40}$/.test(username) || password.length < 8 || password.length > 128)
    return Response.json({error:'نام واسطه یا رمز عبور معتبر نیست.'},{status:400});

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = await sha256(username.toLowerCase() + ':' + ip);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 900;

  const attempt = await env.DB.prepare(
    'SELECT count, window_start FROM login_attempts WHERE attempt_key=?'
  ).bind(key).first();

  if (attempt && attempt.window_start >= windowStart && attempt.count >= 5)
    return Response.json({error:'تلاش‌های ورود زیاد بوده؛ ۱۵ دقیقه بعد دوباره امتحان کن.'},{status:429});

  const user = await env.DB.prepare(
    'SELECT username,display_name,password_salt,password_hash,active FROM mediators WHERE username=?'
  ).bind(username).first();

  const ok = !!(user && user.active === 1 &&
    await verifyPassword(password, user.password_salt, user.password_hash));

  if (!ok) {
    if (attempt && attempt.window_start >= windowStart)
      await env.DB.prepare('UPDATE login_attempts SET count=count+1 WHERE attempt_key=?').bind(key).run();
    else
      await env.DB.prepare('INSERT OR REPLACE INTO login_attempts(attempt_key,count,window_start) VALUES(?,?,?)').bind(key,1,now).run();

    return Response.json({error:'نام واسطه یا رمز عبور اشتباه است.'},{status:401});
  }

  await env.DB.prepare('DELETE FROM login_attempts WHERE attempt_key=?').bind(key).run();

  const token = b64(crypto.getRandomValues(new Uint8Array(32)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const tokenHash = await sha256(token);
  const expires = now + 43200;

  await env.DB.prepare('DELETE FROM mediator_sessions WHERE expires_at < ?').bind(now).run();
  await env.DB.prepare(
    'INSERT INTO mediator_sessions(token_hash,username,expires_at,created_at) VALUES(?,?,?,?)'
  ).bind(tokenHash,user.username,expires,now).run();

  return Response.json({ok:true,name:user.display_name},{
    headers:{
      'Set-Cookie':cookie('rose_session',token,43200),
      'Cache-Control':'no-store'
    }
  });
    }

