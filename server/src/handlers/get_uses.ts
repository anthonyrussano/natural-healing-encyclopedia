import { db } from '../db';
import { usesTable } from '../db/schema';
import { type Use } from '../schema';

export const getUses = async (): Promise<Use[]> => {
  try {
    const results = await db.select()
      .from(usesTable)
      .orderBy(usesTable.name)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get uses:', error);
    throw error;
  }
};