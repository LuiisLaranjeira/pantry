import { supabase } from '@/shared/api/supabaseClient';
import { AppError, mapSupabaseError } from '@/shared/api/errors';

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  country: string | null;
  grouped_view: boolean;
}

export type HouseholdPatch = Partial<Pick<Household, 'name' | 'country' | 'grouped_view'>>;

const HOUSEHOLD_COLUMNS = 'id, name, invite_code, country, grouped_view';

export const householdRepo = {
  async getById(id: string): Promise<Household> {
    const { data, error } = await supabase
      .from('households')
      .select(HOUSEHOLD_COLUMNS)
      .eq('id', id)
      .single();
    if (error || !data) throw mapSupabaseError(error, 'Could not load household.');
    return data as Household;
  },

  async getByInviteCode(code: string): Promise<Household | null> {
    const { data, error } = await supabase
      .from('households')
      .select(HOUSEHOLD_COLUMNS)
      .eq('invite_code', code)
      .maybeSingle();
    if (error) throw mapSupabaseError(error, 'Could not look up invite code.');
    return (data as Household | null) ?? null;
  },

  async create({ id, name }: { id: string; name: string }): Promise<void> {
    const { error } = await supabase.from('households').insert({ id, name });
    if (error) throw mapSupabaseError(error, 'Could not create household.');
  },

  async update(id: string, patch: HouseholdPatch): Promise<void> {
    const { error } = await supabase.from('households').update(patch).eq('id', id);
    if (error) throw mapSupabaseError(error, 'Could not update household.');
  },

  async addMember(householdId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('household_users')
      .insert({ household_id: householdId, user_id: userId });
    if (error) throw mapSupabaseError(error, 'Could not join household.');
  },

  async removeMember(householdId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('household_users')
      .delete()
      .eq('household_id', householdId)
      .eq('user_id', userId);
    if (error) throw mapSupabaseError(error, 'Could not leave household.');
  },

  async memberCount(householdId: string): Promise<number> {
    const { count, error } = await supabase
      .from('household_users')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId);
    if (error) throw mapSupabaseError(error, 'Could not load member count.');
    return count ?? 0;
  },
};

export { AppError };
