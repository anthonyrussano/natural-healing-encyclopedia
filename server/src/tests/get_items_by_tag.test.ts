import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getItemsByTag } from '../handlers/get_items_by_tag';
import { createCategory } from '../handlers/create_category';
import { createTag } from '../handlers/create_tag';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';

describe('getItemsByTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items with specified tag', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs' });
    const tag = await createTag({ name: 'Anti-inflammatory', description: 'Reduces inflammation' });
    const property = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study' });
    const use = await createUse({ name: 'Joint pain relief', source: 'Traditional use' });

    // Create items - one with the tag, one without
    const item1 = await createNaturalHealingItem({
      name: 'Turmeric',
      description: 'Anti-inflammatory spice',
      potential_side_effects: 'May cause stomach upset',
      image_url: null,
      category_id: category.id,
      property_ids: [property.id],
      use_ids: [use.id],
      tag_ids: [tag.id]
    });

    const item2 = await createNaturalHealingItem({
      name: 'Ginger',
      description: 'Warming spice',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: [] // No tags
    });

    const result = await getItemsByTag(tag.id);

    expect(result).toHaveLength(1);
    
    const returnedItem = result[0];
    expect(returnedItem.name).toBe('Turmeric');
    expect(returnedItem.description).toBe('Anti-inflammatory spice');
    expect(returnedItem.potential_side_effects).toBe('May cause stomach upset');
    expect(returnedItem.category.name).toBe('Herbs');
    expect(returnedItem.properties).toHaveLength(1);
    expect(returnedItem.properties[0].name).toBe('Anti-inflammatory');
    expect(returnedItem.uses).toHaveLength(1);
    expect(returnedItem.uses[0].name).toBe('Joint pain relief');
    expect(returnedItem.tags).toHaveLength(1);
    expect(returnedItem.tags[0].name).toBe('Anti-inflammatory');
  });

  it('should return empty array for non-existent tag', async () => {
    const result = await getItemsByTag(999);
    expect(result).toHaveLength(0);
  });

  it('should return multiple items for the same tag', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Supplements', description: 'Natural supplements' });
    const tag = await createTag({ name: 'Immune support', description: 'Supports immune system' });
    const property1 = await createProperty({ name: 'Antioxidant', source: 'Research' });
    const property2 = await createProperty({ name: 'Immune support', source: 'Clinical trial' });
    const use1 = await createUse({ name: 'Immune system', source: 'Traditional use' });
    const use2 = await createUse({ name: 'Skin health', source: 'Study' });

    const item1 = await createNaturalHealingItem({
      name: 'Vitamin C',
      description: 'Immune boosting vitamin',
      potential_side_effects: 'May cause stomach upset',
      image_url: null,
      category_id: category.id,
      property_ids: [property1.id],
      use_ids: [use1.id, use2.id],
      tag_ids: [tag.id]
    });

    const item2 = await createNaturalHealingItem({
      name: 'Zinc',
      description: 'Essential mineral',
      potential_side_effects: 'May cause nausea',
      image_url: null,
      category_id: category.id,
      property_ids: [property2.id],
      use_ids: [use1.id],
      tag_ids: [tag.id]
    });

    const result = await getItemsByTag(tag.id);

    expect(result).toHaveLength(2);
    
    const itemNames = result.map(item => item.name).sort();
    expect(itemNames).toEqual(['Vitamin C', 'Zinc']);
    
    // Verify all items have the specified tag
    result.forEach(item => {
      const hasTag = item.tags.some(t => t.id === tag.id);
      expect(hasTag).toBe(true);
    });
  });

  it('should include all tags for each item, not just the searched tag', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs' });
    const searchTag = await createTag({ name: 'Anti-inflammatory', description: 'Reduces inflammation' });
    const additionalTag = await createTag({ name: 'Antioxidant', description: 'Fights free radicals' });
    const property = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study' });
    const use = await createUse({ name: 'Joint health', source: 'Traditional use' });

    const item = await createNaturalHealingItem({
      name: 'Turmeric',
      description: 'Golden spice',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [property.id],
      use_ids: [use.id],
      tag_ids: [searchTag.id, additionalTag.id]
    });

    const result = await getItemsByTag(searchTag.id);

    expect(result).toHaveLength(1);
    
    const returnedItem = result[0];
    expect(returnedItem.tags).toHaveLength(2);
    
    const tagNames = returnedItem.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['Anti-inflammatory', 'Antioxidant']);
  });
});