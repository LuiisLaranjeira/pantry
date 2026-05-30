export const profileKeys = {
  household: (id: string | null) => ['profile', 'household', id] as const,
  userEmail: () => ['profile', 'userEmail'] as const,
  recentActivity: (id: string | null) => ['profile', 'recentActivity', id] as const,
  monthlySpending: (id: string | null) => ['profile', 'monthlySpending', id] as const,
  notificationsState: () => ['profile', 'notificationsState'] as const,
};
