
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getItemsByCategory } from '../handlers/get_items_by_category';
import { createCategory } from '../handlers/create_category';
import { createTag } from '../handlers/create_tag';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';

describe('getItemsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items with their category and tags', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs for healing' });
    const tag1 = await createTag({ name: 'Anti-inflammatory', description: 'Reduces inflammation' });
    const tag2 = await createTag({ name: 'Immune support', description: 'Supports immune system' });
    const property = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study' });
    const use = await createUse({ name: 'Reduces inflammation', source: 'Traditional use' });

    const item = await createNaturalHealingItem({
      name: 'Turmeric',
      description: 'A powerful anti-inflammatory herb',
      potential_side_effects: 'May cause stomach upset in large doses',
      image_url: 'https://example.com/turmeric.jpg',
      category_id: category.id,
      property_ids: [property.id],
      use_ids: [use.id],
      tag_ids: [tag1.id, tag2.id]
    });

    const result = await getItemsByCategory(category.id);

    expect(result).toHaveLength(1);
    
    const returnedItem = result[0];
    expect(returnedItem.id).toBe(item.id);
    expect(returnedItem.name).toBe('Turmeric');
    expect(returnedItem.description).toBe('A powerful anti-inflammatory herb');
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

    // Check properties
    expect(returnedItem.properties).toHaveLength(1);
    expect(returnedItem.properties[0].name).toBe('Anti-inflammatory');
    expect(returnedItem.properties[0].source).toBe('Clinical study');

    // Check uses
    expect(returnedItem.uses).toHaveLength(1);
    expect(returnedItem.uses[0].name).toBe('Reduces inflammation');
    expect(returnedItem.uses[0].source).toBe('Traditional use');

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
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Oils', description: 'Essential oils' });

    const item = await createNaturalHealingItem({
      name: 'Lavender Oil',
      description: 'Calming essential oil',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: []
    });

    const result = await getItemsByCategory(category.id);

    expect(result).toHaveLength(1);
    
    const returnedItem = result[0];
    expect(returnedItem.id).toBe(item.id);
    expect(returnedItem.name).toBe('Lavender Oil');
    expect(returnedItem.properties).toHaveLength(0);
    expect(returnedItem.uses).toHaveLength(0);
    expect(returnedItem.tags).toHaveLength(0);
  });

  it('should return multiple items for the same category', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Supplements', description: 'Natural supplements' });
    const property1 = await createProperty({ name: 'Antioxidant', source: 'Research study' });
    const property2 = await createProperty({ name: 'Immune support', source: 'Clinical trial' });
    const use1 = await createUse({ name: 'Immune support', source: 'Traditional use' });
    const use2 = await createUse({ name: 'Skin health', source: 'Clinical study' });

    const item1 = await createNaturalHealingItem({
      name: 'Vitamin C',
      description: 'Immune support supplement',
      potential_side_effects: 'May cause stomach upset',
      image_url: null,
      category_id: category.id,
      property_ids: [property1.id],
      use_ids: [use1.id, use2.id],
      tag_ids: []
    });

    const item2 = await createNaturalHealingItem({
      name: 'Zinc',
      description: 'Essential mineral supplement',
      potential_side_effects: 'May cause nausea',
      image_url: null,
      category_id: category.id,
      property_ids: [property2.id],
      use_ids: [use1.id],
      tag_ids: []
    });

    const result = await getItemsByCategory(category.id);

    expect(result).toHaveLength(2);
    
    const itemNames = result.map(item => item.name).sort();
    expect(itemNames).toEqual(['Vitamin C', 'Zinc']);
    
    // Verify all items have the correct category
    result.forEach(item => {
      expect(item.category.id).toBe(category.id);
      expect(item.category.name).toBe('Supplements');
    });

    // Verify properties and uses are included
    const vitaminC = result.find(item => item.name === 'Vitamin C');
    expect(vitaminC?.properties).toHaveLength(1);
    expect(vitaminC?.uses).toHaveLength(2);

    const zinc = result.find(item => item.name === 'Zinc');
    expect(zinc?.properties).toHaveLength(1);
    expect(zinc?.uses).toHaveLength(1);
  });
});
