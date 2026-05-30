import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HouseholdStackParamList = {
  Household: undefined;
};

export type MainTabsParamList = {
  Pantry: { searchQuery?: string } | undefined;
  Shopping: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Main: NavigatorScreenParams<MainTabsParamList> | undefined;
  Scan: { defaultDestination?: 'stock' | 'list'; returnSearch?: boolean } | undefined;
  ReceiptScan: undefined;
};
