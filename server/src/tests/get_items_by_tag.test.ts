
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, naturalHealingItemsTable, naturalHealingItemTagsTable } from '../db/schema';
import { type CreateCategoryInput, type CreateTagInput, type CreateNaturalHealingItemInput } from '../schema';
import { getItemsByTag } from '../handlers/get_items_by_tag';

describe('getItemsByTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items with the specified tag', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Category for testing'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'Anti-inflammatory', description: 'Reduces inflammation' },
        { name: 'Antioxidant', description: 'Fights oxidative stress' }
      ])
      .returning()
      .execute();
    const antiInflammatoryTagId = tagResults[0].id;
    const antioxidantTagId = tagResults[1].id;

    // Create test items
    const itemResults = await db.insert(naturalHealingItemsTable)
      .values([
        {
          name: 'Turmeric',
          description: 'Golden spice with healing properties',
          properties: 'Contains curcumin',
          uses: 'Reduces inflammation and pain',
          potential_side_effects: 'May cause stomach upset',
          category_id: categoryId
        },
        {
          name: 'Ginger',
          description: 'Root with digestive benefits',
          properties: 'Contains gingerol',
          uses: 'Aids digestion and reduces nausea',
          potential_side_effects: null,
          category_id: categoryId
        }
      ])
      .returning()
      .execute();
    const turmericId = itemResults[0].id;
    const gingerId = itemResults[1].id;

    // Associate items with tags
    await db.insert(naturalHealingItemTagsTable)
      .values([
        { item_id: turmericId, tag_id: antiInflammatoryTagId },
        { item_id: turmericId, tag_id: antioxidantTagId },
        { item_id: gingerId, tag_id: antiInflammatoryTagId }
      ])
      .execute();

    // Test getting items by anti-inflammatory tag
    const result = await getItemsByTag(antiInflammatoryTagId);

    expect(result).toHaveLength(2);
    expect(result.map(item => item.name).sort()).toEqual(['Ginger', 'Turmeric']);

    // Check that items have proper structure
    const turmericItem = result.find(item => item.name === 'Turmeric');
    expect(turmericItem).toBeDefined();
    expect(turmericItem!.category.name).toEqual('Test Category');
    expect(turmericItem!.tags).toHaveLength(2);
    expect(turmericItem!.tags.map(tag => tag.name).sort()).toEqual(['Anti-inflammatory', 'Antioxidant']);

    const gingerItem = result.find(item => item.name === 'Ginger');
    expect(gingerItem).toBeDefined();
    expect(gingerItem!.category.name).toEqual('Test Category');
    expect(gingerItem!.tags).toHaveLength(1);
    expect(gingerItem!.tags[0].name).toEqual('Anti-inflammatory');
  });

  it('should return empty array when no items have the specified tag', async () => {
    // Create test category and tag
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Category for testing'
      })
      .returning()
      .execute();

    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Unused Tag',
        description: 'Tag not associated with any items'
      })
      .returning()
      .execute();

    const result = await getItemsByTag(tagResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return items with complete category and tag information', async () => {
    // Create test data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Herbs',
        description: 'Medicinal herbs'
      })
      .returning()
      .execute();

    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Digestive',
        description: 'Supports digestive health'
      })
      .returning()
      .execute();

    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Peppermint',
        description: 'Cooling herb for digestion',
        properties: 'Contains menthol',
        uses: 'Soothes digestive issues',
        potential_side_effects: 'May cause heartburn in some people',
        image_url: 'https://example.com/peppermint.jpg',
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    await db.insert(naturalHealingItemTagsTable)
      .values({
        item_id: itemResult[0].id,
        tag_id: tagResult[0].id
      })
      .execute();

    const result = await getItemsByTag(tagResult[0].id);

    expect(result).toHaveLength(1);
    const item = result[0];
    
    // Verify item properties
    expect(item.name).toEqual('Peppermint');
    expect(item.description).toEqual('Cooling herb for digestion');
    expect(item.properties).toEqual('Contains menthol');
    expect(item.uses).toEqual('Soothes digestive issues');
    expect(item.potential_side_effects).toEqual('May cause heartburn in some people');
    expect(item.image_url).toEqual('https://example.com/peppermint.jpg');
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);

    // Verify category
    expect(item.category.name).toEqual('Herbs');
    expect(item.category.description).toEqual('Medicinal herbs');
    expect(item.category.created_at).toBeInstanceOf(Date);

    // Verify tags
    expect(item.tags).toHaveLength(1);
    expect(item.tags[0].name).toEqual('Digestive');
    expect(item.tags[0].description).toEqual('Supports digestive health');
    expect(item.tags[0].created_at).toBeInstanceOf(Date);
  });
});
