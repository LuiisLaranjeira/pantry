import { makeChain } from '../../../__helpers__/supabaseMock';

import { supabase } from '@/shared/api/supabaseClient';
import { householdRepo } from '@/features/household/api/householdRepo';
import { AppError } from '@/shared/api/errors';

jest.mock('@/shared/api/supabaseClient', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

beforeEach(() => jest.clearAllMocks());

const fakeHousehold = {
  id: 'hh-1',
  name: 'My Home',
  invite_code: 'abc123',
  country: 'pt',
  grouped_view: false,
};

// ─── getById ──────────────────────────────────────────────────────────────────

describe('getById', () => {
  it('returns the household on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: fakeHousehold, error: null }));
    expect(await householdRepo.getById('hh-1')).toEqual(fakeHousehold);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(householdRepo.getById('hh-1')).rejects.toBeInstanceOf(AppError);
  });

  it('throws when data is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(householdRepo.getById('hh-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── getByIdWithMemberCount ───────────────────────────────────────────────────

describe('getByIdWithMemberCount', () => {
  it('returns household with numeric member_count', async () => {
    const raw = { ...fakeHousehold, household_users: [{ count: '3' }] };
    mockFrom.mockReturnValue(makeChain({ data: raw, error: null }));
    const result = await householdRepo.getByIdWithMemberCount('hh-1');
    expect(result.member_count).toBe(3);
    expect(typeof result.member_count).toBe('number');
  });

  it('returns member_count 0 when household_users is empty', async () => {
    const raw = { ...fakeHousehold, household_users: [] };
    mockFrom.mockReturnValue(makeChain({ data: raw, error: null }));
    expect((await householdRepo.getByIdWithMemberCount('hh-1')).member_count).toBe(0);
  });

  it('converts string count to number (Supabase returns aggregate count as string)', async () => {
    const raw = { ...fakeHousehold, household_users: [{ count: '7' }] };
    mockFrom.mockReturnValue(makeChain({ data: raw, error: null }));
    const result = await householdRepo.getByIdWithMemberCount('hh-1');
    expect(result.member_count).toBe(7);
  });

  it('throws AppError on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(householdRepo.getByIdWithMemberCount('hh-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe('create', () => {
  it('calls create_household RPC and returns the result', async () => {
    const rpcResult = { id: 'hh-2', name: 'New Home', invite_code: 'xyz' };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });
    expect(await householdRepo.create('New Home')).toEqual(rpcResult);
    expect(mockRpc).toHaveBeenCalledWith('create_household', { p_name: 'New Home' });
  });

  it('throws AppError when RPC errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail', status: 500 } });
    await expect(householdRepo.create('Bad')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── joinByInviteCode ─────────────────────────────────────────────────────────

describe('joinByInviteCode', () => {
  it('calls join_household_by_invite_code RPC and returns the result', async () => {
    const rpcResult = { id: 'hh-3', name: 'Shared', invite_code: 'code1' };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });
    expect(await householdRepo.joinByInviteCode('code1')).toEqual(rpcResult);
    expect(mockRpc).toHaveBeenCalledWith('join_household_by_invite_code', { p_code: 'code1' });
  });

  it('throws AppError("not_found") when the invite code does not exist', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'household not found', status: 500 },
    });
    const err = await householdRepo.joinByInviteCode('bad').catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe('not_found');
  });

  it('throws a generic AppError for non-not-found errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Internal error', status: 500 } });
    const err = await householdRepo.joinByInviteCode('code').catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).not.toBe('not_found');
  });

  it('throws AppError when RPC returns null data with no error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const err = await householdRepo.joinByInviteCode('code').catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('update', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(householdRepo.update('hh-1', { grouped_view: true })).resolves.toBeUndefined();
  });

  it('calls update with the correct patch', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await householdRepo.update('hh-1', { name: 'Updated', grouped_view: false });
    expect(chain.update as jest.Mock).toHaveBeenCalledWith({
      name: 'Updated',
      grouped_view: false,
    });
    expect(chain.eq as jest.Mock).toHaveBeenCalledWith('id', 'hh-1');
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(householdRepo.update('hh-1', {})).rejects.toBeInstanceOf(AppError);
  });
});

// ─── removeMember ─────────────────────────────────────────────────────────────

describe('removeMember', () => {
  it('resolves without error on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await expect(householdRepo.removeMember('hh-1', 'user-1')).resolves.toBeUndefined();
  });

  it('filters by both household_id and user_id', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await householdRepo.removeMember('hh-1', 'user-1');
    expect(chain.eq as jest.Mock).toHaveBeenCalledWith('household_id', 'hh-1');
    expect(chain.eq as jest.Mock).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'fail', status: 500 } }));
    await expect(householdRepo.removeMember('hh-1', 'u-1')).rejects.toBeInstanceOf(AppError);
  });
});

// ─── memberCount ─────────────────────────────────────────────────────────────

describe('memberCount', () => {
  it('returns the count as a number', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: 4 }));
    expect(await householdRepo.memberCount('hh-1')).toBe(4);
  });

  it('returns 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: null }));
    expect(await householdRepo.memberCount('hh-1')).toBe(0);
  });

  it('throws AppError when supabase returns an error', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: { message: 'fail', status: 500 }, count: null }),
    );
    await expect(householdRepo.memberCount('hh-1')).rejects.toBeInstanceOf(AppError);
  });
});
