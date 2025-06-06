import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreateNaturalHealingItemInput, type CreateCategoryInput, type CreatePropertyInput, type CreateUseInput, type CreateTagInput } from '../schema';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { createCategory } from '../handlers/create_category';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createTag } from '../handlers/create_tag';

describe('createNaturalHealingItem', () => {
  let category: any;
  let property1: any;
  let property2: any;
  let use1: any;
  let use2: any;
  let tag1: any;
  let tag2: any;

  beforeEach(async () => {
    await createDB();
    // Create prerequisite data
    category = await createCategory({ name: 'Herbs', description: 'Herbal remedies' });
    property1 = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study 2023' });
    property2 = await createProperty({ name: 'Antioxidant', source: 'Research paper X' });
    use1 = await createUse({ name: 'Pain relief', source: 'Traditional medicine' });
    use2 = await createUse({ name: 'Digestive Aid', source: 'Clinical trial Z' });
    tag1 = await createTag({ name: 'Digestive', description: 'Aids digestion' });
    tag2 = await createTag({ name: 'Topical', description: 'For external use' });
  });

  afterEach(resetDB);

  it('should create a natural healing item with properties, uses, and tags', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Test Herb',
      description: 'A healing herb for testing',
      potential_side_effects: 'May cause drowsiness',
      image_url: 'https://example.com/herb.jpg',
      category_id: category.id,
      property_ids: [property1.id],
      use_ids: [use1.id],
      tag_ids: [tag1.id]
    };

    const result = await createNaturalHealingItem(testInput);

    expect(result.name).toEqual('Test Herb');
    expect(result.description).toEqual(testInput.description);
    expect(result.potential_side_effects).toEqual(testInput.potential_side_effects);
    expect(result.image_url).toEqual(testInput.image_url);
    expect(result.category_id).toEqual(category.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Check category relation
    expect(result.category.name).toEqual(category.name);
    expect(result.category.id).toEqual(category.id);

    // Check properties relation
    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toEqual(property1.name);
    expect(result.properties[0].source).toEqual(property1.source);
    expect(result.properties[0].id).toEqual(property1.id);

    // Check uses relation
    expect(result.uses).toHaveLength(1);
    expect(result.uses[0].name).toEqual(use1.name);
    expect(result.uses[0].source).toEqual(use1.source);
    expect(result.uses[0].id).toEqual(use1.id);

    // Check tags relation
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toEqual(tag1.name);
    expect(result.tags[0].id).toEqual(tag1.id);
  });

  it('should create a natural healing item with multiple properties and uses', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Multi-Benefit Herb',
      description: 'An herb with various healing benefits',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [property1.id, property2.id],
      use_ids: [use1.id, use2.id],
      tag_ids: [tag1.id, tag2.id]
    };

    const result = await createNaturalHealingItem(testInput);

    expect(result.name).toEqual('Multi-Benefit Herb');
    expect(result.potential_side_effects).toBeNull();
    expect(result.image_url).toBeNull();

    expect(result.properties).toHaveLength(2);
    const propertyNames = result.properties.map(p => p.name).sort();
    expect(propertyNames).toEqual([property1.name, property2.name].sort());

    expect(result.uses).toHaveLength(2);
    const useNames = result.uses.map(u => u.name).sort();
    expect(useNames).toEqual([use1.name, use2.name].sort());

    expect(result.tags).toHaveLength(2);
    const tagNames = result.tags.map(t => t.name).sort();
    expect(tagNames).toEqual([tag1.name, tag2.name].sort());
  });

  it('should create a natural healing item without optional relations', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Simple Item',
      description: 'A basic item',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: []
    };

    const result = await createNaturalHealingItem(testInput);

    expect(result.name).toEqual('Simple Item');
    expect(result.properties).toHaveLength(0);
    expect(result.uses).toHaveLength(0);
    expect(result.tags).toHaveLength(0);
  });

  it('should throw error for non-existent category', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Invalid Category Item',
      description: 'Testing invalid category',
      potential_side_effects: null,
      image_url: null,
      category_id: 99999, // Non-existent category
      property_ids: [],
      use_ids: [],
      tag_ids: []
    };

    await expect(createNaturalHealingItem(testInput)).rejects.toThrow('Category with id 99999 not found');
  });

  it('should throw error for non-existent property', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Invalid Property Item',
      description: 'Testing invalid property',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [99999], // Non-existent property
      use_ids: [],
      tag_ids: []
    };

    await expect(createNaturalHealingItem(testInput)).rejects.toThrow('Property with id 99999 not found');
  });

  it('should throw error for non-existent use', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Invalid Use Item',
      description: 'Testing invalid use',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [99999], // Non-existent use
      tag_ids: []
    };

    await expect(createNaturalHealingItem(testInput)).rejects.toThrow('Use with id 99999 not found');
  });

  it('should throw error for non-existent tag', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Invalid Tag Item',
      description: 'Testing invalid tag',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: [99999] // Non-existent tag
    };

    await expect(createNaturalHealingItem(testInput)).rejects.toThrow('Tag with id 99999 not found');
  });
});