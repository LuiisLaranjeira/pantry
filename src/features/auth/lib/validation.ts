export function validateAuthForm(
  email: string,
  password: string,
): { emailError: string | null; passwordError: string | null } {
  return {
    emailError: !email.trim().includes('@') ? 'Enter a valid email address.' : null,
    passwordError: password.length < 6 ? 'Password must be at least 6 characters.' : null,
  };
}
