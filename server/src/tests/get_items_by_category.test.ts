
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, naturalHealingItemsTable, naturalHealingItemTagsTable } from '../db/schema';
import { getItemsByCategory } from '../handlers/get_items_by_category';

describe('getItemsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items with their category and tags', async () => {
    // Create category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Herbs',
        description: 'Natural herbs for healing'
      })
      .returning()
      .execute();

    // Create tags
    const [tag1] = await db.insert(tagsTable)
      .values({
        name: 'Anti-inflammatory',
        description: 'Reduces inflammation'
      })
      .returning()
      .execute();

    const [tag2] = await db.insert(tagsTable)
      .values({
        name: 'Immune support',
        description: 'Supports immune system'
      })
      .returning()
      .execute();

    // Create natural healing item
    const [item] = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Turmeric',
        description: 'A powerful anti-inflammatory herb',
        properties: 'Anti-inflammatory, antioxidant',
        uses: 'Reduces inflammation, supports digestion',
        potential_side_effects: 'May cause stomach upset in large doses',
        image_url: 'https://example.com/turmeric.jpg',
        category_id: category.id
      })
      .returning()
      .execute();

    // Associate item with tags
    await db.insert(naturalHealingItemTagsTable)
      .values([
        { item_id: item.id, tag_id: tag1.id },
        { item_id: item.id, tag_id: tag2.id }
      ])
      .execute();

    const result = await getItemsByCategory(category.id);

    expect(result).toHaveLength(1);
    
    const returnedItem = result[0];
    expect(returnedItem.id).toBe(item.id);
    expect(returnedItem.name).toBe('Turmeric');
    expect(returnedItem.description).toBe('A powerful anti-inflammatory herb');
    expect(returnedItem.properties).toBe('Anti-inflammatory, antioxidant');
    expect(returnedItem.uses).toBe('Reduces inflammation, supports digestion');
    expect(returnedItem.potential_side_effects).toBe('May cause stomach upset in large doses');
    expect(returnedItem.image_url).toBe('https://example.com/turmeric.jpg');
    expect(returnedItem.category_id).toBe(category.id);
    expect(returnedItem.created_at).toBeInstanceOf(Date);
    expect(returnedItem.updated_at).toBeInstanceOf(Date);

    // Check category
    expect(returnedItem.category.id).toBe(category.id);
    expect(returnedItem.category.name).toBe('Herbs');
    expect(returnedItem.category.description).toBe('Natural herbs for healing');
    expect(returnedItem.category.created_at).toBeInstanceOf(Date);

    // Check tags
    expect(returnedItem.tags).toHaveLength(2);
    const tagNames = returnedItem.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['Anti-inflammatory', 'Immune support']);
  });

  it('should return empty array for non-existent category', async () => {
    const result = await getItemsByCategory(999);
    expect(result).toHaveLength(0);
  });

  it('should return items without tags if no tags are associated', async () => {
    // Create category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Oils',
        description: 'Essential oils'
      })
      .returning()
      .execute();

    // Create natural healing item without tags
    const [item] = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Lavender Oil',
        description: 'Calming essential oil',
        properties: 'Relaxing, antimicrobial',
        uses: 'Aromatherapy, skin care',
        potential_side_effects: null,
        image_url: null,
        category_id: category.id
      })
      .returning()
      .execute();

    const result = await getItemsByCategory(category.id);

    expect(result).toHaveLength(1);
    
    const returnedItem = result[0];
    expect(returnedItem.id).toBe(item.id);
    expect(returnedItem.name).toBe('Lavender Oil');
    expect(returnedItem.tags).toHaveLength(0);
  });

  it('should return multiple items for the same category', async () => {
    // Create category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Supplements',
        description: 'Natural supplements'
      })
      .returning()
      .execute();

    // Create multiple items
    await db.insert(naturalHealingItemsTable)
      .values([
        {
          name: 'Vitamin C',
          description: 'Immune support supplement',
          properties: 'Antioxidant, immune boosting',
          uses: 'Immune support, skin health',
          potential_side_effects: 'May cause stomach upset',
          image_url: null,
          category_id: category.id
        },
        {
          name: 'Zinc',
          description: 'Essential mineral supplement',
          properties: 'Immune support, wound healing',
          uses: 'Immune function, skin health',
          potential_side_effects: 'May cause nausea',
          image_url: null,
          category_id: category.id
        }
      ])
      .execute();

    const result = await getItemsByCategory(category.id);

    expect(result).toHaveLength(2);
    
    const itemNames = result.map(item => item.name).sort();
    expect(itemNames).toEqual(['Vitamin C', 'Zinc']);
    
    // Verify all items have the correct category
    result.forEach(item => {
      expect(item.category.id).toBe(category.id);
      expect(item.category.name).toBe('Supplements');
    });
  });
});
