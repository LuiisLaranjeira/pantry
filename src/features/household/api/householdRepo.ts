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

interface RpcHouseholdResult {
  id: string;
  name: string;
  invite_code: string;
}

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

  async getByIdWithMemberCount(id: string): Promise<Household & { member_count: number }> {
    const { data, error } = await supabase
      .from('households')
      .select(`${HOUSEHOLD_COLUMNS}, household_users(count)`)
      .eq('id', id)
      .single();
    if (error || !data) throw mapSupabaseError(error, 'Could not load household.');
    const { household_users, ...household } = data as typeof data & {
      household_users: { count: number }[];
    };
    return { ...(household as Household), member_count: Number(household_users?.[0]?.count ?? 0) };
  },

  /**
   * Atomically creates a household and adds the caller as the first member.
   * Backed by the create_household() RPC (SECURITY DEFINER) so the two
   * inserts can't be split across two failed network calls.
   */
  async create(name: string): Promise<RpcHouseholdResult> {
    const { data, error } = await supabase.rpc('create_household', { p_name: name });
    if (error || !data) throw mapSupabaseError(error, 'Could not create household.');
    return data as RpcHouseholdResult;
  },

  /**
   * Idempotent join by invite code. Backed by the
   * join_household_by_invite_code() RPC; the client never inserts into
   * household_users directly. The RPC returns the household's id + name +
   * invite_code so the caller doesn't need a follow-up SELECT.
   */
  async joinByInviteCode(code: string): Promise<RpcHouseholdResult> {
    const { data, error } = await supabase.rpc('join_household_by_invite_code', {
      p_code: code,
    });
    if (error || !data) {
      const isNotFound = error?.message?.toLowerCase().includes('not found');
      if (isNotFound) throw new AppError('not_found', 'No household found with that code.');
      throw mapSupabaseError(error, 'Could not join household.');
    }
    return data as RpcHouseholdResult;
  },

  async update(id: string, patch: HouseholdPatch): Promise<void> {
    const { error } = await supabase.from('households').update(patch).eq('id', id);
    if (error) throw mapSupabaseError(error, 'Could not update household.');
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
