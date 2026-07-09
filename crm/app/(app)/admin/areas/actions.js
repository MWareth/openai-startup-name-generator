'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

const PATH = '/admin/areas';
const back = (msg, ok) => redirect(`${PATH}?${ok ? 'ok' : 'error'}=` + encodeURIComponent(msg));

export async function createArea(formData) {
  const { supabase } = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  if (!name) back('Area name is required');
  const { error } = await supabase.from('areas').insert({ name });
  if (error) back(error.code === '23505' ? `"${name}" already exists` : error.message);
  revalidatePath(PATH);
  back(`Added area "${name}"`, true);
}

export async function deleteArea(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('areas').delete().eq('id', String(formData.get('area_id')));
  if (error) back(error.message);
  revalidatePath(PATH);
  back('Area removed', true);
}

export async function createBuilding(formData) {
  const { supabase } = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  const areaId = String(formData.get('area_id') || '') || null;
  if (!name) back('Building name is required');
  const { error } = await supabase.from('buildings').insert({ name, area_id: areaId });
  if (error) back(error.code === '23505' ? `"${name}" already exists in that area` : error.message);
  revalidatePath(PATH);
  back(`Added building "${name}"`, true);
}

export async function deleteBuilding(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('buildings').delete().eq('id', String(formData.get('building_id')));
  if (error) back(error.message);
  revalidatePath(PATH);
  back('Building removed', true);
}
