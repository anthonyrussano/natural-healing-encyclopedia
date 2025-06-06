import { db } from '../db';
import { tagsTable, naturalHealingItemTagsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTag = async (id: number): Promise<void> => {
  try {
    // First delete all references in junction table
    await db.delete(naturalHealingItemTagsTable)
      .where(eq(naturalHealingItemTagsTable.tag_id, id))
      .execute();

    // Then delete the tag itself
    const result = await db.delete(tagsTable)
      .where(eq(tagsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Tag not found');
    }
  } catch (error) {
    console.error('Tag deletion failed:', error);
    throw error;
  }
};