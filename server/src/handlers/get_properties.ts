import { db } from '../db';
import { propertiesTable } from '../db/schema';
import { type Property } from '../schema';

export const getProperties = async (): Promise<Property[]> => {
  try {
    const results = await db.select()
      .from(propertiesTable)
      .orderBy(propertiesTable.name)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get properties:', error);
    throw error;
  }
};