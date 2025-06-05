
import { db } from '../db';
import { naturalHealingItemsTable, naturalHealingItemTagsTable, protocolItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteNaturalHealingItem = async (id: number): Promise<void> => {
  try {
    // Delete related records first to maintain referential integrity
    // Delete from junction tables
    await db.delete(naturalHealingItemTagsTable)
      .where(eq(naturalHealingItemTagsTable.item_id, id))
      .execute();

    await db.delete(protocolItemsTable)
      .where(eq(protocolItemsTable.item_id, id))
      .execute();

    // Delete the main record
    await db.delete(naturalHealingItemsTable)
      .where(eq(naturalHealingItemsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Natural healing item deletion failed:', error);
    throw error;
  }
};
