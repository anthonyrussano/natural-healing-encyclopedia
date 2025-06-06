import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreateNaturalHealingItemInput, type CreateCategoryInput, type CreatePropertyInput, type CreateUseInput, type CreateTagInput } from '../schema';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { createCategory } from '../handlers/create_category';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createTag } from '../handlers/create_tag';

describe('createNaturalHealingItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a natural healing item with properties and uses', async () => {
    // Create prerequisite data
    const category = await createCategory({ name: 'Herbs', description: 'Herbal remedies' });
    const property = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study 2023' });
    const use = await createUse({ name: 'Pain relief', source: 'Traditional medicine' });
    const tag = await createTag({ name: 'Digestive', description: 'Aids digestion' });

    const testInput: CreateNaturalHealingItemInput = {
      name: 'Test Herb',
      description: 'A healing herb for testing',
      potential_side_effects: 'May cause drowsiness',
      image_url: 'https://example.com/herb.jpg',
      category_id: category.id,
      property_ids: [property.id],
      use_ids: [use.id],
      tag_ids: [tag.id]
    };

    const result = await createNaturalHealingItem(testInput);

    expect(result.name).toEqual('Test Herb');
    expect(result.description).toEqual('A healing herb for testing');
    expect(result.potential_side_effects).toEqual('May cause drowsiness');
    expect(result.image_url).toEqual('https://example.com/herb.jpg');
    expect(result.category_id).toEqual(category.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Check relations
    expect(result.category.name).toEqual('Herbs');
    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toEqual('Anti-inflammatory');
    expect(result.properties[0].source).toEqual('Clinical study 2023');
    expect(result.uses).toHaveLength(1);
    expect(result.uses[0].name).toEqual('Pain relief');
    expect(result.uses[0].source).toEqual('Traditional medicine');
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toEqual('Digestive');
  });

  it('should create a natural healing item without optional relations', async () => {
    const category = await createCategory({ name: 'Minerals', description: null });

    const testInput: CreateNaturalHealingItemInput = {
      name: 'Test Mineral',
      description: 'A healing mineral for testing',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: []
    };

    const result = await createNaturalHealingItem(testInput);

    expect(result.name).toEqual('Test Mineral');
    expect(result.potential_side_effects).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.properties).toHaveLength(0);
    expect(result.uses).toHaveLength(0);
    expect(result.tags).toHaveLength(0);
  });

  it('should throw error for non-existent category', async () => {
    const testInput: CreateNaturalHealingItemInput = {
      name: 'Test Item',
      description: 'Test description',
      potential_side_effects: null,
      image_url: null,
      category_id: 999, // Non-existent category
      property_ids: [],
      use_ids: [],
      tag_ids: []
    };

    expect(createNaturalHealingItem(testInput)).rejects.toThrow(/Category with id 999 not found/);
  });

  it('should throw error for non-existent property', async () => {
    const category = await createCategory({ name: 'Test Category', description: null });

    const testInput: CreateNaturalHealingItemInput = {
      name: 'Test Item',
      description: 'Test description',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [999], // Non-existent property
      use_ids: [],
      tag_ids: []
    };

    expect(createNaturalHealingItem(testInput)).rejects.toThrow(/Property with id 999 not found/);
  });
});