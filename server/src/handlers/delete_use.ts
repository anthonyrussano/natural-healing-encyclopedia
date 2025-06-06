import { db } from '../db';
import { usesTable, naturalHealingItemUsesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteUse = async (id: number): Promise<void> => {
  try {
    // First delete all references in junction table
    await db.delete(naturalHealingItemUsesTable)
      .where(eq(naturalHealingItemUsesTable.use_id, id))
      .execute();

    // Then delete the use itself
    const result = await db.delete(usesTable)
      .where(eq(usesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Use not found');
    }
  } catch (error) {
    console.error('Use deletion failed:', error);
    throw error;
  }
};