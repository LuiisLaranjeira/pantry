import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { supabase } from '@/shared/api/supabaseClient';
import { logger } from '@/shared/lib/logger';

export function useShoppingListSync(listId: string | null | undefined, householdId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!listId) return;

    // supabase.channel() deduplicates by name: if a previous channel with the
    // same topic hasn't finished unsubscribing (removeChannel is async), it
    // returns the already-subscribed instance and .on() throws. A unique suffix
    // per effect invocation guarantees a fresh channel every time.
    const channel = supabase
      .channel(`shopping-list-${listId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `list_id=eq.${listId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: shoppingKeys.items(listId) }),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: `id=eq.${listId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: shoppingKeys.activeList(householdId) }),
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          logger.warn('Shopping list sync lost connection', { listId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, householdId, queryClient]);
}
