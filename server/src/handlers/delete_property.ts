import { db } from '../db';
import { propertiesTable, naturalHealingItemPropertiesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteProperty = async (id: number): Promise<void> => {
  try {
    // First delete all references in junction table
    await db.delete(naturalHealingItemPropertiesTable)
      .where(eq(naturalHealingItemPropertiesTable.property_id, id))
      .execute();

    // Then delete the property itself
    const result = await db.delete(propertiesTable)
      .where(eq(propertiesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Property not found');
    }
  } catch (error) {
    console.error('Property deletion failed:', error);
    throw error;
  }
};