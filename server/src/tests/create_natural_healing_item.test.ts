
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, naturalHealingItemsTable, naturalHealingItemTagsTable } from '../db/schema';
import { type CreateNaturalHealingItemInput } from '../schema';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { eq } from 'drizzle-orm';

describe('createNaturalHealingItem', () => {
  let testCategoryId: number;
  let testTagIds: number[];

  beforeEach(async () => {
    await createDB();
    
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;

    // Create test tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'Anti-inflammatory', description: 'Reduces inflammation' },
        { name: 'Antioxidant', description: 'Fights free radicals' }
      ])
      .returning()
      .execute();
    testTagIds = tagResults.map(tag => tag.id);
  });

  afterEach(resetDB);

  it('should create a natural healing item without tags', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Test Herb',
      description: 'A healing herb for testing',
      properties: 'Anti-inflammatory, antimicrobial',
      uses: 'Used for pain relief and wound healing',
      potential_side_effects: 'May cause drowsiness',
      image_url: 'https://example.com/herb.jpg',
      category_id: testCategoryId
    };

    const result = await createNaturalHealingItem(testInput);

    // Verify basic fields
    expect(result.name).toEqual('Test Herb');
    expect(result.description).toEqual(testInput.description);
    expect(result.properties).toEqual(testInput.properties);
    expect(result.uses).toEqual(testInput.uses);
    expect(result.potential_side_effects).toEqual(testInput.potential_side_effects);
    expect(result.image_url).toEqual(testInput.image_url);
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify category relation
    expect(result.category).toBeDefined();
    expect(result.category.name).toEqual('Test Category');
    expect(result.category.id).toEqual(testCategoryId);

    // Verify empty tags array
    expect(result.tags).toEqual([]);
  });

  it('should create a natural healing item with tags', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Test Herb with Tags',
      description: 'A healing herb with associated tags',
      properties: 'Anti-inflammatory, antioxidant',
      uses: 'Used for inflammation and oxidative stress',
      potential_side_effects: null,
      image_url: null,
      category_id: testCategoryId,
      tag_ids: testTagIds
    };

    const result = await createNaturalHealingItem(testInput);

    // Verify basic fields
    expect(result.name).toEqual('Test Herb with Tags');
    expect(result.potential_side_effects).toBeNull();
    expect(result.image_url).toBeNull();

    // Verify tags relation
    expect(result.tags).toHaveLength(2);
    expect(result.tags.some(tag => tag.name === 'Anti-inflammatory')).toBe(true);
    expect(result.tags.some(tag => tag.name === 'Antioxidant')).toBe(true);
  });

  it('should save item to database correctly', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Database Test Herb',
      description: 'Testing database persistence',
      properties: 'Healing properties',
      uses: 'Various healing uses',
      potential_side_effects: 'Minor side effects',
      image_url: 'https://example.com/test.jpg',
      category_id: testCategoryId,
      tag_ids: [testTagIds[0]]
    };

    const result = await createNaturalHealingItem(testInput);

    // Verify item exists in database
    const items = await db.select()
      .from(naturalHealingItemsTable)
      .where(eq(naturalHealingItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Database Test Herb');
    expect(items[0].category_id).toEqual(testCategoryId);

    // Verify tag association exists in database
    const tagAssociations = await db.select()
      .from(naturalHealingItemTagsTable)
      .where(eq(naturalHealingItemTagsTable.item_id, result.id))
      .execute();

    expect(tagAssociations).toHaveLength(1);
    expect(tagAssociations[0].tag_id).toEqual(testTagIds[0]);
  });

  it('should throw error for non-existent category', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Invalid Category Item',
      description: 'Testing invalid category',
      properties: 'Test properties',
      uses: 'Test uses',
      potential_side_effects: null,
      image_url: null,
      category_id: 99999 // Non-existent category
    };

    expect(createNaturalHealingItem(testInput)).rejects.toThrow(/category.*not found/i);
  });

  it('should throw error for non-existent tag', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Invalid Tag Item',
      description: 'Testing invalid tag',
      properties: 'Test properties',
      uses: 'Test uses',
      potential_side_effects: null,
      image_url: null,
      category_id: testCategoryId,
      tag_ids: [99999] // Non-existent tag
    };

    expect(createNaturalHealingItem(testInput)).rejects.toThrow(/tag.*not found/i);
  });
});
