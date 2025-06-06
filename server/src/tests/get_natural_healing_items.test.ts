import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreateNaturalHealingItemInput } from '../schema';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { getNaturalHealingItems } from '../handlers/get_natural_healing_items';
import { createCategory } from '../handlers/create_category';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createTag } from '../handlers/create_tag';

describe('getNaturalHealingItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getNaturalHealingItems();
    expect(result).toEqual([]);
  });

  it('should return all natural healing items with relations', async () => {
    // Create prerequisite data
    const category1 = await createCategory({ name: 'Herbs', description: 'Herbal remedies' });
    const category2 = await createCategory({ name: 'Minerals', description: 'Mineral remedies' });
    const property1 = await createProperty({ name: 'Anti-inflammatory', source: 'Study A' });
    const property2 = await createProperty({ name: 'Antibacterial', source: null });
    const use1 = await createUse({ name: 'Pain relief', source: 'Traditional' });
    const use2 = await createUse({ name: 'Wound healing', source: 'Clinical' });
    const tag1 = await createTag({ name: 'Digestive', description: 'Aids digestion' });
    const tag2 = await createTag({ name: 'Topical', description: 'For external use' });

    // Create test items
    const item1Input: CreateNaturalHealingItemInput = {
      name: 'Turmeric',
      description: 'Golden spice with healing properties',
      potential_side_effects: 'May cause stomach upset',
      image_url: 'https://example.com/turmeric.jpg',
      category_id: category1.id,
      property_ids: [property1.id],
      use_ids: [use1.id],
      tag_ids: [tag1.id]
    };

    const item2Input: CreateNaturalHealingItemInput = {
      name: 'Aloe Vera',
      description: 'Soothing plant for skin care',
      potential_side_effects: null,
      image_url: null,
      category_id: category1.id,
      property_ids: [property1.id, property2.id],
      use_ids: [use2.id],
      tag_ids: [tag1.id, tag2.id]
    };

    await createNaturalHealingItem(item1Input);
    await createNaturalHealingItem(item2Input);

    const result = await getNaturalHealingItems();

    expect(result).toHaveLength(2);
    
    // Check first item
    const turmeric = result.find(item => item.name === 'Turmeric');
    expect(turmeric).toBeDefined();
    expect(turmeric!.description).toEqual('Golden spice with healing properties');
    expect(turmeric!.potential_side_effects).toEqual('May cause stomach upset');
    expect(turmeric!.image_url).toEqual('https://example.com/turmeric.jpg');
    expect(turmeric!.category.name).toEqual('Herbs');
    expect(turmeric!.properties).toHaveLength(1);
    expect(turmeric!.properties[0].name).toEqual('Anti-inflammatory');
    expect(turmeric!.uses).toHaveLength(1);
    expect(turmeric!.uses[0].name).toEqual('Pain relief');
    expect(turmeric!.tags).toHaveLength(1);
    expect(turmeric!.tags[0].name).toEqual('Digestive');

    // Check second item
    const aloe = result.find(item => item.name === 'Aloe Vera');
    expect(aloe).toBeDefined();
    expect(aloe!.potential_side_effects).toBeNull();
    expect(aloe!.image_url).toBeNull();
    expect(aloe!.properties).toHaveLength(2);
    expect(aloe!.uses).toHaveLength(1);
    expect(aloe!.tags).toHaveLength(2);
  });
});