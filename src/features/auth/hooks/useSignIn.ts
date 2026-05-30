import { useMutation } from '@tanstack/react-query';

import { authRepo } from '@/features/auth/api/authRepo';

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authRepo.signInWithPassword(email, password),
  });
}
