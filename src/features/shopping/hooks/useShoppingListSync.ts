import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { shoppingKeys } from '@/features/shopping/api/queryKeys';
import { supabase } from '@/shared/api/supabaseClient';

export function useShoppingListSync(listId: string | null | undefined, householdId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!listId) return;

    const channel = supabase
      .channel(`shopping-list-${listId}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, householdId, queryClient]);
}
