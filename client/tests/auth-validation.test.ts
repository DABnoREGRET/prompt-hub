import { describe, expect, it } from 'vitest';
import { loginFormSchema, registerFormSchema } from '../src/validation/auth.schema';

describe('Auth Form Validation Schemas', () => {
  it('accepts valid login credentials and normalizes email casing', () => {
    const parsed = loginFormSchema.safeParse({
      email: '  Dab@PromptHub.dev ',
      password: 'PromptHub123!',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe('dab@prompthub.dev');
    }
  });

  it('rejects weak passwords and mismatched confirmation on registration', () => {
    const weak = registerFormSchema.safeParse({
      username: 'phan_dev',
      email: 'phan@prompthub.dev',
      password: 'onlyletters',
      confirmPassword: 'onlyletters',
    });
    expect(weak.success).toBe(false);

    const mismatch = registerFormSchema.safeParse({
      username: 'phan_dev',
      email: 'phan@prompthub.dev',
      password: 'Password123!',
      confirmPassword: 'Different123!',
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mismatch.error.flatten().fieldErrors.confirmPassword).toBeDefined();
    }
  });
});
