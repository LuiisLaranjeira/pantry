export interface MonthData {
  key: string;
  label: string;
  shortLabel: string;
  total: number;
  trips: number;
}

export interface HouseholdInfo {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  country: string | null;
  grouped_view: boolean;
}
