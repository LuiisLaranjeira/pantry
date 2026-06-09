import { useMutation } from '@tanstack/react-query';

import { useAppState } from '@/app/providers/AppStateProvider';
import { authRepo } from '@/features/auth/api/authRepo';

export function useSignInWithGoogle() {
  const { refresh } = useAppState();
  return useMutation({
    mutationFn: () => authRepo.signInWithGoogle(),
    onSuccess: () => refresh(),
  });
}
