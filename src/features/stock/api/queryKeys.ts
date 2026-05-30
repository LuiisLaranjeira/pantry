export const stockKeys = {
  list: (householdId: string | null) => ['stock', 'list', householdId] as const,
};
