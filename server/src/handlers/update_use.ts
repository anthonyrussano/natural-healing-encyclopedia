import { db } from '../db';
import { usesTable } from '../db/schema';
import { type UpdateUseInput, type Use } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUse = async (input: UpdateUseInput): Promise<Use> => {
  try {
    const updateData: Partial<typeof input> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.source !== undefined) updateData.source = input.source;

    const result = await db.update(usesTable)
      .set(updateData)
      .where(eq(usesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Use not found');
    }

    return result[0];
  } catch (error) {
    console.error('Use update failed:', error);
    throw error;
  }
};