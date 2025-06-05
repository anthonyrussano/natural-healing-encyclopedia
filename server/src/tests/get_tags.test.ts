
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { getTags } from '../handlers/get_tags';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getTags();
    expect(result).toEqual([]);
  });

  it('should return all tags ordered by name', async () => {
    // Create test tags
    await db.insert(tagsTable).values([
      { name: 'Zebra Tag', description: 'Last tag' },
      { name: 'Alpha Tag', description: 'First tag' },
      { name: 'Beta Tag', description: null }
    ]).execute();

    const result = await getTags();

    expect(result).toHaveLength(3);
    
    // Verify alphabetical ordering
    expect(result[0].name).toBe('Alpha Tag');
    expect(result[1].name).toBe('Beta Tag');
    expect(result[2].name).toBe('Zebra Tag');
    
    // Verify all fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].description).toBe('First tag');
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Verify null description handling
    expect(result[1].description).toBeNull();
  });

  it('should handle tags with same name prefix correctly', async () => {
    // Create tags with similar names to test ordering
    await db.insert(tagsTable).values([
      { name: 'Herb', description: 'General herbs' },
      { name: 'Herbal Tea', description: 'Tea herbs' },
      { name: 'Herb Extract', description: 'Concentrated herbs' }
    ]).execute();

    const result = await getTags();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Herb');
    expect(result[1].name).toBe('Herb Extract');
    expect(result[2].name).toBe('Herbal Tea');
  });
});
