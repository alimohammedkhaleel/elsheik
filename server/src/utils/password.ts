import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash plaintext password using bcrypt
 */
export const hashPassword = async (plaintext: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plaintext, salt);
};

/**
 * Compare plaintext password with stored bcrypt hash
 */
export const comparePassword = async (
  plaintext: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(plaintext, hash);
};
