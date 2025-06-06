import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getProtocolById } from '../handlers/get_protocol_by_id';
import { createCategory } from '../handlers/create_category';
import { createTag } from '../handlers/create_tag';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { createProtocol } from '../handlers/create_protocol';

describe('getProtocolById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return protocol with items and their relations', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs' });
    const tag1 = await createTag({ name: 'Anti-inflammatory', description: 'Reduces inflammation' });
    const tag2 = await createTag({ name: 'Digestive', description: 'Aids digestion' });
    const property1 = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study' });
    const property2 = await createProperty({ name: 'Digestive', source: 'Traditional use' });
    const use1 = await createUse({ name: 'Joint health', source: 'Clinical study' });
    const use2 = await createUse({ name: 'Nausea relief', source: 'Traditional use' });

    const item1 = await createNaturalHealingItem({
      name: 'Turmeric',
      description: 'Golden spice',
      potential_side_effects: 'May cause stomach upset',
      image_url: 'https://example.com/turmeric.jpg',
      category_id: category.id,
      property_ids: [property1.id],
      use_ids: [use1.id],
      tag_ids: [tag1.id, tag2.id]
    });

    const item2 = await createNaturalHealingItem({
      name: 'Ginger',
      description: 'Warming spice',
      potential_side_effects: 'May cause heartburn',
      image_url: null,
      category_id: category.id,
      property_ids: [property2.id],
      use_ids: [use2.id],
      tag_ids: [tag1.id]
    });

    const protocol = await createProtocol({
      name: 'Inflammation Protocol',
      description: 'Protocol for reducing inflammation',
      item_ids: [item1.id, item2.id]
    });

    const result = await getProtocolById(protocol.id);

    expect(result).toBeTruthy();
    expect(result!.id).toBe(protocol.id);
    expect(result!.name).toBe('Inflammation Protocol');
    expect(result!.description).toBe('Protocol for reducing inflammation');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Check items
    expect(result!.items).toHaveLength(2);
    
    const turmeric = result!.items.find(item => item.name === 'Turmeric');
    expect(turmeric).toBeTruthy();
    expect(turmeric!.description).toBe('Golden spice');
    expect(turmeric!.potential_side_effects).toBe('May cause stomach upset');
    expect(turmeric!.image_url).toBe('https://example.com/turmeric.jpg');
    expect(turmeric!.category.name).toBe('Herbs');
    expect(turmeric!.properties).toHaveLength(1);
    expect(turmeric!.properties[0].name).toBe('Anti-inflammatory');
    expect(turmeric!.uses).toHaveLength(1);
    expect(turmeric!.uses[0].name).toBe('Joint health');
    expect(turmeric!.tags).toHaveLength(2);

    const ginger = result!.items.find(item => item.name === 'Ginger');
    expect(ginger).toBeTruthy();
    expect(ginger!.description).toBe('Warming spice');
    expect(ginger!.properties).toHaveLength(1);
    expect(ginger!.properties[0].name).toBe('Digestive');
    expect(ginger!.uses).toHaveLength(1);
    expect(ginger!.uses[0].name).toBe('Nausea relief');
    expect(ginger!.tags).toHaveLength(1);
    expect(ginger!.tags[0].name).toBe('Anti-inflammatory');

    // Check aggregated metadata
    expect(result!.aggregated_metadata.common_properties).toHaveLength(2);
    const propertyNames = result!.aggregated_metadata.common_properties.map((p: any) => p.name).sort();
    expect(propertyNames).toEqual(['Anti-inflammatory', 'Digestive']);

    expect(result!.aggregated_metadata.common_uses).toHaveLength(2);
    const useNames = result!.aggregated_metadata.common_uses.map((u: any) => u.name).sort();
    expect(useNames).toEqual(['Joint health', 'Nausea relief']);

    expect(result!.aggregated_metadata.tags).toHaveLength(2);
    expect(result!.aggregated_metadata.tags[0].name).toBe('Anti-inflammatory');
  });

  it('should return null for non-existent protocol', async () => {
    const result = await getProtocolById(999);
    expect(result).toBeNull();
  });

  it('should return protocol without items if no items are associated', async () => {
    const protocol = await createProtocol({
      name: 'Empty Protocol',
      description: 'Protocol with no items',
      item_ids: []
    });

    const result = await getProtocolById(protocol.id);

    expect(result).toBeTruthy();
    expect(result!.id).toBe(protocol.id);
    expect(result!.name).toBe('Empty Protocol');
    expect(result!.items).toHaveLength(0);
    expect(result!.aggregated_metadata.common_properties).toHaveLength(0);
    expect(result!.aggregated_metadata.common_uses).toHaveLength(0);
    expect(result!.aggregated_metadata.tags).toHaveLength(0);
  });

  it('should calculate aggregated metadata correctly', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs' });
    const tag = await createTag({ name: 'Common Tag', description: 'A tag shared by all items' });

    const item = await createNaturalHealingItem({
      name: 'Test Item',
      description: 'Test description',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: [tag.id]
    });

    const protocol = await createProtocol({
      name: 'Test Protocol',
      description: 'Testing aggregated metadata',
      item_ids: [item.id]
    });

    const result = await getProtocolById(protocol.id);

    expect(result).toBeTruthy();
    expect(result!.aggregated_metadata.tags).toHaveLength(1);
    expect(result!.aggregated_metadata.tags[0].name).toBe('Common Tag');
  });
});