
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = createInterface({input, output});

const username = (await rl.question('Mediator username: ')).trim();
const display = (await rl.question('Display name: ')).trim();
const password = await rl.question('Temporary password (minimum 12 characters): ');

rl.close();

if (!/^[\w.-]{3,40}$/.test(username) || !display || password.length < 12 || password.length > 128) {
  console.error('Invalid username/display name/password length.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, 310000, 32, 'sha256');

const q = s => "'" + s.replaceAll("'", "''") + "'";

console.log('\nRun this SQL against your Cloudflare D1 database:\n');

console.log(
  `INSERT OR REPLACE INTO mediators(username,display_name,password_salt,password_hash,active,created_at) VALUES(${q(username)},${q(display)},${q(salt.toString('base64'))},${q(hash.toString('base64'))},1,${Math.floor(Date.now()/1000)});`
);

