import { db } from '../db';
import { categoriesTable, naturalHealingItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCategory = async (id: number): Promise<void> => {
  try {
    // Check if category is referenced by any natural healing items
    const referencedItems = await db.select()
      .from(naturalHealingItemsTable)
      .where(eq(naturalHealingItemsTable.category_id, id))
      .execute();

    if (referencedItems.length > 0) {
      throw new Error('Cannot delete category that is referenced by natural healing items');
    }

    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Category not found');
    }
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};