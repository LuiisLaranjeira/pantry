export const shoppingKeys = {
  activeList: (householdId: string | null) => ['shopping', 'activeList', householdId] as const,
  items: (listId: string | null) => ['shopping', 'items', listId] as const,
};
