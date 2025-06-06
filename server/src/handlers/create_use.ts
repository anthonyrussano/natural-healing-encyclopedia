import { db } from '../db';
import { usesTable } from '../db/schema';
import { type CreateUseInput, type Use } from '../schema';

export const createUse = async (input: CreateUseInput): Promise<Use> => {
  try {
    const result = await db.insert(usesTable)
      .values({
        name: input.name,
        source: input.source
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Use creation failed:', error);
    throw error;
  }
};