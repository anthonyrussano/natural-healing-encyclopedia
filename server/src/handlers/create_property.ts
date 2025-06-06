import { db } from '../db';
import { propertiesTable } from '../db/schema';
import { type CreatePropertyInput, type Property } from '../schema';

export const createProperty = async (input: CreatePropertyInput): Promise<Property> => {
  try {
    const result = await db.insert(propertiesTable)
      .values({
        name: input.name,
        source: input.source
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Property creation failed:', error);
    throw error;
  }
};