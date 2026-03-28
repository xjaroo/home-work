/**
 * Password hashing using Node built-in crypto (scrypt).
 * Same API as bcrypt: hashSync(password, _rounds), compareSync(password, hash).
 */
import crypto from 'crypto';

const SALT_LEN = 32;
const KEY_LEN = 64;
const COST = 16384; // scrypt N parameter (memory/cost)
const SEP = '.';

export function hashSync(password, _rounds = 10) {
  const salt = crypto.randomBytes(SALT_LEN);
  const key = crypto.scryptSync(password, salt, KEY_LEN, { N: COST });
  return salt.toString('hex') + SEP + key.toString('hex');
}

export function compareSync(password, storedHash) {
  const i = storedHash.indexOf(SEP);
  if (i === -1) return false;
  const salt = Buffer.from(storedHash.slice(0, i), 'hex');
  const expected = storedHash.slice(i + 1);
  const key = crypto.scryptSync(password, salt, KEY_LEN, { N: COST });
  return key.toString('hex') === expected;
}

export default { hashSync, compareSync };
