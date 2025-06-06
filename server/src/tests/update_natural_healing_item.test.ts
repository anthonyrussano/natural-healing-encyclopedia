import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreateNaturalHealingItemInput, type UpdateNaturalHealingItemInput } from '../schema';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { updateNaturalHealingItem } from '../handlers/update_natural_healing_item';
import { createCategory } from '../handlers/create_category';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createTag } from '../handlers/create_tag';

describe('updateNaturalHealingItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a natural healing item with new properties and uses', async () => {
    // Create prerequisite data
    const category1 = await createCategory({ name: 'Herbs', description: 'Herbal remedies' });
    const category2 = await createCategory({ name: 'Minerals', description: 'Mineral remedies' });
    const property1 = await createProperty({ name: 'Anti-inflammatory', source: 'Study A' });
    const property2 = await createProperty({ name: 'Antibacterial', source: 'Study B' });
    const use1 = await createUse({ name: 'Pain relief', source: 'Traditional' });
    const use2 = await createUse({ name: 'Wound healing', source: 'Clinical' });
    const tag1 = await createTag({ name: 'Digestive', description: 'Aids digestion' });
    const tag2 = await createTag({ name: 'Topical', description: 'For external use' });

    // Create initial item
    const createInput: CreateNaturalHealingItemInput = {
      name: 'Original Name',
      description: 'Original description',
      potential_side_effects: 'Original side effects',
      image_url: 'https://example.com/original.jpg',
      category_id: category1.id,
      property_ids: [property1.id],
      use_ids: [use1.id],
      tag_ids: [tag1.id]
    };

    const originalItem = await createNaturalHealingItem(createInput);

    // Update the item
    const updateInput: UpdateNaturalHealingItemInput = {
      id: originalItem.id,
      name: 'Updated Name',
      description: 'Updated description',
      potential_side_effects: 'Updated side effects',
      image_url: 'https://example.com/updated.jpg',
      category_id: category2.id,
      property_ids: [property2.id],
      use_ids: [use2.id],
      tag_ids: [tag2.id]
    };

    const result = await updateNaturalHealingItem(updateInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Updated description');
    expect(result.potential_side_effects).toEqual('Updated side effects');
    expect(result.image_url).toEqual('https://example.com/updated.jpg');
    expect(result.category_id).toEqual(category2.id);
    expect(result.category.name).toEqual('Minerals');

    // Check updated relations
    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toEqual('Antibacterial');
    expect(result.uses).toHaveLength(1);
    expect(result.uses[0].name).toEqual('Wound healing');
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toEqual('Topical');
  });

  it('should partially update natural healing item', async () => {
    // Create prerequisite data
    const category = await createCategory({ name: 'Herbs', description: 'Herbal remedies' });
    const property = await createProperty({ name: 'Anti-inflammatory', source: 'Study A' });

    // Create initial item
    const createInput: CreateNaturalHealingItemInput = {
      name: 'Test Herb',
      description: 'Original description',
      potential_side_effects: 'Original side effects',
      image_url: 'https://example.com/original.jpg',
      category_id: category.id,
      property_ids: [property.id],
      use_ids: [],
      tag_ids: []
    };

    const originalItem = await createNaturalHealingItem(createInput);

    // Partial update - only name
    const updateInput: UpdateNaturalHealingItemInput = {
      id: originalItem.id,
      name: 'Updated Name Only'
    };

    const result = await updateNaturalHealingItem(updateInput);

    expect(result.name).toEqual('Updated Name Only');
    // Other fields should remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.potential_side_effects).toEqual('Original side effects');
    expect(result.image_url).toEqual('https://example.com/original.jpg');
    expect(result.category_id).toEqual(category.id);
    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toEqual('Anti-inflammatory');
  });

  it('should throw error for non-existent item', async () => {
    const updateInput: UpdateNaturalHealingItemInput = {
      id: 999, // Non-existent item
      name: 'Updated Name'
    };

    expect(updateNaturalHealingItem(updateInput)).rejects.toThrow(/Natural healing item with id 999 not found/);
  });
});