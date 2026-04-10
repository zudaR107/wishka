import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_LENGTH = 16;
const PASSWORD_HASH_PREFIX = "scrypt";
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_LENGTH);
  const derivedKey = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;

  return [
    PASSWORD_HASH_PREFIX,
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const [prefix, saltHex, storedHashHex] = passwordHash.split("$");

  if (
    prefix !== PASSWORD_HASH_PREFIX ||
    !saltHex ||
    !storedHashHex ||
    storedHashHex.length !== PASSWORD_KEY_LENGTH * 2
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const storedHash = Buffer.from(storedHashHex, "hex");

  if (salt.length !== PASSWORD_SALT_LENGTH || storedHash.length !== PASSWORD_KEY_LENGTH) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;

  return timingSafeEqual(storedHash, derivedKey);
}
