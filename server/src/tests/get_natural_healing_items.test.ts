
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, naturalHealingItemsTable, naturalHealingItemTagsTable } from '../db/schema';
import { getNaturalHealingItems } from '../handlers/get_natural_healing_items';

describe('getNaturalHealingItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getNaturalHealingItems();
    expect(result).toEqual([]);
  });

  it('should return natural healing items with categories and tags', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Herbs',
        description: 'Natural herbs for healing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'Anti-inflammatory', description: 'Reduces inflammation' },
        { name: 'Digestive', description: 'Aids digestion' }
      ])
      .returning()
      .execute();
    const [tag1, tag2] = tagResults;

    // Create test natural healing item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Turmeric',
        description: 'A powerful healing spice',
        properties: 'Anti-inflammatory, antioxidant',
        uses: 'Joint pain, inflammation',
        potential_side_effects: 'May cause stomach upset',
        image_url: 'https://example.com/turmeric.jpg',
        category_id: category.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    // Create item-tag relationships
    await db.insert(naturalHealingItemTagsTable)
      .values([
        { item_id: item.id, tag_id: tag1.id },
        { item_id: item.id, tag_id: tag2.id }
      ])
      .execute();

    const result = await getNaturalHealingItems();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(item.id);
    expect(result[0].name).toEqual('Turmeric');
    expect(result[0].description).toEqual('A powerful healing spice');
    expect(result[0].properties).toEqual('Anti-inflammatory, antioxidant');
    expect(result[0].uses).toEqual('Joint pain, inflammation');
    expect(result[0].potential_side_effects).toEqual('May cause stomach upset');
    expect(result[0].image_url).toEqual('https://example.com/turmeric.jpg');
    expect(result[0].category_id).toEqual(category.id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify category relation
    expect(result[0].category.id).toEqual(category.id);
    expect(result[0].category.name).toEqual('Herbs');
    expect(result[0].category.description).toEqual('Natural herbs for healing');
    expect(result[0].category.created_at).toBeInstanceOf(Date);

    // Verify tags relation
    expect(result[0].tags).toHaveLength(2);
    expect(result[0].tags[0].name).toEqual('Anti-inflammatory');
    expect(result[0].tags[0].description).toEqual('Reduces inflammation');
    expect(result[0].tags[1].name).toEqual('Digestive');
    expect(result[0].tags[1].description).toEqual('Aids digestion');
  });

  it('should return items with empty tags array when no tags are associated', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Supplements',
        description: 'Natural supplements'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test natural healing item without tags
    await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Ginseng',
        description: 'Energy boosting root',
        properties: 'Adaptogenic, energizing',
        uses: 'Fatigue, stress',
        potential_side_effects: null,
        image_url: null,
        category_id: category.id
      })
      .execute();

    const result = await getNaturalHealingItems();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Ginseng');
    expect(result[0].potential_side_effects).toBeNull();
    expect(result[0].image_url).toBeNull();
    expect(result[0].tags).toEqual([]);
  });

  it('should return multiple items with correct relations', async () => {
    // Create test categories
    const categoryResults = await db.insert(categoriesTable)
      .values([
        { name: 'Herbs', description: 'Natural herbs' },
        { name: 'Roots', description: 'Healing roots' }
      ])
      .returning()
      .execute();
    const [herbCategory, rootCategory] = categoryResults;

    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({ name: 'Calming', description: 'Has calming effects' })
      .returning()
      .execute();
    const tag = tagResult[0];

    // Create test items
    const itemResults = await db.insert(naturalHealingItemsTable)
      .values([
        {
          name: 'Chamomile',
          description: 'Calming herb',
          properties: 'Relaxing, soothing',
          uses: 'Sleep, anxiety',
          potential_side_effects: 'May cause drowsiness',
          image_url: 'https://example.com/chamomile.jpg',
          category_id: herbCategory.id
        },
        {
          name: 'Valerian Root',
          description: 'Sleep aid root',
          properties: 'Sedative, calming',
          uses: 'Insomnia, restlessness',
          potential_side_effects: 'Strong odor',
          image_url: null,
          category_id: rootCategory.id
        }
      ])
      .returning()
      .execute();
    const [chamomile, valerian] = itemResults;

    // Add tag to first item only
    await db.insert(naturalHealingItemTagsTable)
      .values({ item_id: chamomile.id, tag_id: tag.id })
      .execute();

    const result = await getNaturalHealingItems();

    expect(result).toHaveLength(2);
    
    // Find items by name for consistent testing
    const chamomileResult = result.find(item => item.name === 'Chamomile');
    const valerianResult = result.find(item => item.name === 'Valerian Root');

    expect(chamomileResult).toBeDefined();
    expect(chamomileResult?.category.name).toEqual('Herbs');
    expect(chamomileResult?.tags).toHaveLength(1);
    expect(chamomileResult?.tags[0].name).toEqual('Calming');

    expect(valerianResult).toBeDefined();
    expect(valerianResult?.category.name).toEqual('Roots');
    expect(valerianResult?.tags).toEqual([]);
  });
});
