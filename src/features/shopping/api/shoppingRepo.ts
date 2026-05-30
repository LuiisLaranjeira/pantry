import { supabase } from '@/shared/api/supabaseClient';
import { mapSupabaseError } from '@/shared/api/errors';
import type { ShoppingList, ShoppingListItem } from '@/shared/types/domain';

const ITEM_SELECT =
  'id, list_id, product_id, name, quantity, unit_price, checked, product:products(brand, package_unit)';

const LIST_COLUMNS = 'id, household_id, status, total_spent, created_at, completed_at';

export interface NewShoppingItem {
  list_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number | null;
  checked: boolean;
}

export type ShoppingItemPatch = Partial<
  Pick<ShoppingListItem, 'name' | 'quantity' | 'unit_price' | 'checked'>
>;

export const shoppingRepo = {
  async getActiveList(householdId: string): Promise<ShoppingList | null> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select(LIST_COLUMNS)
      .eq('household_id', householdId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw mapSupabaseError(error, 'Could not load shopping list.');
    return ((data as ShoppingList[] | null) ?? [])[0] ?? null;
  },

  async createList(input: { id: string; household_id: string }): Promise<void> {
    const { error } = await supabase
      .from('shopping_lists')
      .insert({ id: input.id, household_id: input.household_id });
    if (error) throw mapSupabaseError(error, 'Could not create shopping list.');
  },

  async listItems(listId: string): Promise<ShoppingListItem[]> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select(ITEM_SELECT)
      .eq('list_id', listId)
      .order('created_at', { ascending: true });
    if (error) throw mapSupabaseError(error, 'Could not load shopping items.');
    return (data as unknown as ShoppingListItem[]) ?? [];
  },

  async addItem(input: NewShoppingItem): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert(input)
      .select(ITEM_SELECT)
      .single();
    if (error || !data) throw mapSupabaseError(error, 'Could not add item.');
    return data as unknown as ShoppingListItem;
  },

  async addItems(items: NewShoppingItem[]): Promise<void> {
    if (items.length === 0) return;
    const { error } = await supabase.from('shopping_list_items').insert(items);
    if (error) throw mapSupabaseError(error, 'Could not add items.');
  },

  async updateItem(itemId: string, patch: ShoppingItemPatch): Promise<void> {
    const { error } = await supabase.from('shopping_list_items').update(patch).eq('id', itemId);
    if (error) throw mapSupabaseError(error, 'Could not update item.');
  },

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', itemId);
    if (error) throw mapSupabaseError(error, 'Could not delete item.');
  },

  async completeList(listId: string, options: { total_spent: number | null }): Promise<void> {
    const { error } = await supabase
      .from('shopping_lists')
      .update({
        status: 'completed',
        total_spent: options.total_spent,
        completed_at: new Date().toISOString(),
      })
      .eq('id', listId);
    if (error) throw mapSupabaseError(error, 'Could not complete shopping list.');
  },

  async deleteList(listId: string): Promise<void> {
    const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
    if (error) throw mapSupabaseError(error, 'Could not delete shopping list.');
  },

  async spendingSince(
    householdId: string,
    sinceIso: string,
  ): Promise<{ total_spent: number | null; completed_at: string | null }[]> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('total_spent, completed_at')
      .eq('household_id', householdId)
      .eq('status', 'completed')
      .gte('completed_at', sinceIso);
    if (error) throw mapSupabaseError(error, 'Could not load spending history.');
    return data ?? [];
  },

  async listItemNames(listId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('name')
      .eq('list_id', listId);
    if (error) throw mapSupabaseError(error, 'Could not load list items.');
    return (data ?? []).map((r) => r.name);
  },

  async listItemProductIds(listId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('product_id')
      .eq('list_id', listId);
    if (error) throw mapSupabaseError(error, 'Could not load list items.');
    return (data ?? [])
      .map((r) => r.product_id)
      .filter((id): id is string => typeof id === 'string');
  },
};
