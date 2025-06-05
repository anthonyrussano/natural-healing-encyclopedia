
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

const testInput: CreateTagInput = {
  name: 'Herbal',
  description: 'Natural herbal remedies and treatments'
};

const testInputWithNullDescription: CreateTagInput = {
  name: 'Anti-inflammatory',
  description: null
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag with description', async () => {
    const result = await createTag(testInput);

    expect(result.name).toEqual('Herbal');
    expect(result.description).toEqual('Natural herbal remedies and treatments');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a tag with null description', async () => {
    const result = await createTag(testInputWithNullDescription);

    expect(result.name).toEqual('Anti-inflammatory');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    const result = await createTag(testInput);

    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Herbal');
    expect(tags[0].description).toEqual('Natural herbal remedies and treatments');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple tag creation', async () => {
    const tag1 = await createTag(testInput);
    const tag2 = await createTag(testInputWithNullDescription);

    expect(tag1.id).not.toEqual(tag2.id);
    expect(tag1.name).toEqual('Herbal');
    expect(tag2.name).toEqual('Anti-inflammatory');

    const allTags = await db.select()
      .from(tagsTable)
      .execute();

    expect(allTags).toHaveLength(2);
  });
});
