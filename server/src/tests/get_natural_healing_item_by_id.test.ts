
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, naturalHealingItemsTable, naturalHealingItemTagsTable } from '../db/schema';
import { getNaturalHealingItemById } from '../handlers/get_natural_healing_item_by_id';

describe('getNaturalHealingItemById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return natural healing item with category and tags', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Herbs',
        description: 'Medicinal herbs'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'Anti-inflammatory', description: 'Reduces inflammation' },
        { name: 'Antioxidant', description: 'Fights free radicals' }
      ])
      .returning()
      .execute();
    const tagIds = tagResults.map(tag => tag.id);

    // Create natural healing item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Turmeric',
        description: 'Golden spice with healing properties',
        properties: 'Anti-inflammatory, antioxidant',
        uses: 'Joint pain, digestive issues',
        potential_side_effects: 'May cause stomach upset',
        image_url: 'https://example.com/turmeric.jpg',
        category_id: categoryId
      })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    // Associate item with tags
    await db.insert(naturalHealingItemTagsTable)
      .values([
        { item_id: itemId, tag_id: tagIds[0] },
        { item_id: itemId, tag_id: tagIds[1] }
      ])
      .execute();

    const result = await getNaturalHealingItemById(itemId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(itemId);
    expect(result!.name).toEqual('Turmeric');
    expect(result!.description).toEqual('Golden spice with healing properties');
    expect(result!.properties).toEqual('Anti-inflammatory, antioxidant');
    expect(result!.uses).toEqual('Joint pain, digestive issues');
    expect(result!.potential_side_effects).toEqual('May cause stomach upset');
    expect(result!.image_url).toEqual('https://example.com/turmeric.jpg');
    expect(result!.category_id).toEqual(categoryId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Check category
    expect(result!.category.id).toEqual(categoryId);
    expect(result!.category.name).toEqual('Herbs');
    expect(result!.category.description).toEqual('Medicinal herbs');
    expect(result!.category.created_at).toBeInstanceOf(Date);

    // Check tags
    expect(result!.tags).toHaveLength(2);
    expect(result!.tags.map(t => t.name).sort()).toEqual(['Anti-inflammatory', 'Antioxidant']);
    expect(result!.tags.every(t => t.id && t.created_at instanceof Date)).toBe(true);
  });

  it('should return natural healing item with no tags', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Minerals',
        description: 'Essential minerals'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create natural healing item without tags
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Magnesium',
        description: 'Essential mineral supplement',
        properties: 'Muscle relaxant, sleep aid',
        uses: 'Muscle cramps, insomnia',
        potential_side_effects: null,
        image_url: null,
        category_id: categoryId
      })
      .returning()
      .execute();
    const itemId = itemResult[0].id;

    const result = await getNaturalHealingItemById(itemId);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Magnesium');
    expect(result!.potential_side_effects).toBeNull();
    expect(result!.image_url).toBeNull();
    expect(result!.category.name).toEqual('Minerals');
    expect(result!.tags).toHaveLength(0);
  });

  it('should return null when item does not exist', async () => {
    const result = await getNaturalHealingItemById(999);
    expect(result).toBeNull();
  });
});
