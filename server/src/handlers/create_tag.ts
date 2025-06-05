
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput, type Tag } from '../schema';

export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    const result = await db.insert(tagsTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};
