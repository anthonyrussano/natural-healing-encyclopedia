import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getNaturalHealingItemById } from '../handlers/get_natural_healing_item_by_id';
import { createCategory } from '../handlers/create_category';
import { createTag } from '../handlers/create_tag';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';

describe('getNaturalHealingItemById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return item with category, properties, uses, and tags', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs for healing' });
    const tag1 = await createTag({ name: 'Anti-inflammatory', description: 'Reduces inflammation' });
    const tag2 = await createTag({ name: 'Digestive', description: 'Aids digestion' });
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

    const result = await getNaturalHealingItemById(item.id);

    expect(result).toBeTruthy();
    expect(result!.id).toBe(item.id);
    expect(result!.name).toBe('Turmeric');
    expect(result!.description).toBe('A powerful anti-inflammatory herb');
    expect(result!.potential_side_effects).toBe('May cause stomach upset in large doses');
    expect(result!.image_url).toBe('https://example.com/turmeric.jpg');
    expect(result!.category_id).toBe(category.id);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Check category
    expect(result!.category.id).toBe(category.id);
    expect(result!.category.name).toBe('Herbs');
    expect(result!.category.description).toBe('Natural herbs for healing');
    expect(result!.category.created_at).toBeInstanceOf(Date);

    // Check properties
    expect(result!.properties).toHaveLength(1);
    expect(result!.properties[0].name).toBe('Anti-inflammatory');
    expect(result!.properties[0].source).toBe('Clinical study');

    // Check uses
    expect(result!.uses).toHaveLength(1);
    expect(result!.uses[0].name).toBe('Reduces inflammation');
    expect(result!.uses[0].source).toBe('Traditional use');

    // Check tags
    expect(result!.tags).toHaveLength(2);
    const tagNames = result!.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['Anti-inflammatory', 'Digestive']);
  });

  it('should return null for non-existent item', async () => {
    const result = await getNaturalHealingItemById(999);
    expect(result).toBeNull();
  });

  it('should return item without tags if no tags are associated', async () => {
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

    const result = await getNaturalHealingItemById(item.id);

    expect(result).toBeTruthy();
    expect(result!.id).toBe(item.id);
    expect(result!.name).toBe('Lavender Oil');
    expect(result!.properties).toHaveLength(0);
    expect(result!.uses).toHaveLength(0);
    expect(result!.tags).toHaveLength(0);
  });
});