import { validateAuthForm } from '@/features/auth/lib/validation';

describe('validateAuthForm', () => {
  it('returns no errors for valid credentials', () => {
    const r = validateAuthForm('user@example.com', 'password123');
    expect(r.emailError).toBeNull();
    expect(r.passwordError).toBeNull();
  });

  it('flags an email missing the @ symbol', () => {
    expect(validateAuthForm('notanemail', 'password').emailError).not.toBeNull();
  });

  it('accepts a minimal email containing @', () => {
    expect(validateAuthForm('a@b', 'password').emailError).toBeNull();
  });

  it('accepts email with subdomains and TLDs', () => {
    expect(validateAuthForm('user@mail.example.co.uk', 'password').emailError).toBeNull();
  });

  it('trims the email before checking', () => {
    expect(validateAuthForm('  notanemail  ', 'password').emailError).not.toBeNull();
    expect(validateAuthForm('  a@b.com  ', 'password').emailError).toBeNull();
  });

  it('flags a password shorter than 6 characters', () => {
    expect(validateAuthForm('a@b.com', '12345').passwordError).not.toBeNull();
  });

  it('accepts a password of exactly 6 characters', () => {
    expect(validateAuthForm('a@b.com', '123456').passwordError).toBeNull();
  });

  it('accepts a password longer than 6 characters', () => {
    expect(validateAuthForm('a@b.com', 'supersecurepassword').passwordError).toBeNull();
  });

  it('returns both errors when both fields are invalid', () => {
    const r = validateAuthForm('bad', '123');
    expect(r.emailError).not.toBeNull();
    expect(r.passwordError).not.toBeNull();
  });

  it('returns only email error when password is valid', () => {
    const r = validateAuthForm('bad', 'validpassword');
    expect(r.emailError).not.toBeNull();
    expect(r.passwordError).toBeNull();
  });

  it('returns only password error when email is valid', () => {
    const r = validateAuthForm('a@b.com', 'bad');
    expect(r.emailError).toBeNull();
    expect(r.passwordError).not.toBeNull();
  });
});
