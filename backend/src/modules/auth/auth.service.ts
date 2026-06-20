import bcrypt from "bcryptjs";
import { signAccessToken } from "@/middleware/auth";
import { ConflictError, UnauthorizedError } from "@/middleware/errors";
import { authRepository } from "./auth.repository";
import { LoginInput, RegisterInput } from "./auth.validation";

const BCRYPT_ROUNDS = 12;

export interface AuthResult {
  token: string;
  user: { id: number; name: string; email: string };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = authRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = authRepository.create(input.name, input.email, passwordHash);
    const token = signAccessToken({ sub: user.id, email: user.email });

    return { token, user: { id: user.id, name: user.name, email: user.email } };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = authRepository.findByEmail(input.email);
    // Compare against a dummy hash when the user doesn't exist so response
    // timing doesn't reveal whether an email is registered.
    const hashToCompare = user?.password_hash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalid";
    const passwordMatches = await bcrypt.compare(input.password, hashToCompare);

    if (!user || !passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signAccessToken({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
};
