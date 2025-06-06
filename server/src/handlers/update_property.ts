import { db } from '../db';
import { propertiesTable } from '../db/schema';
import { type UpdatePropertyInput, type Property } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProperty = async (input: UpdatePropertyInput): Promise<Property> => {
  try {
    const updateData: Partial<typeof input> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.source !== undefined) updateData.source = input.source;

    const result = await db.update(propertiesTable)
      .set(updateData)
      .where(eq(propertiesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Property not found');
    }

    return result[0];
  } catch (error) {
    console.error('Property update failed:', error);
    throw error;
  }
};