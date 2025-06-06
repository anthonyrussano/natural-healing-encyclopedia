import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getProtocols } from '../handlers/get_protocols';
import { createCategory } from '../handlers/create_category';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { createProtocol } from '../handlers/create_protocol';

describe('getProtocols', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all protocols with their items', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs' });
    const property = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study' });
    const use = await createUse({ name: 'Joint health', source: 'Traditional use' });

    const item = await createNaturalHealingItem({
      name: 'Turmeric',
      description: 'Golden spice',
      potential_side_effects: 'May cause stomach upset',
      image_url: null,
      category_id: category.id,
      property_ids: [property.id],
      use_ids: [use.id],
      tag_ids: []
    });

    const protocol1 = await createProtocol({
      name: 'Protocol 1',
      description: 'First protocol',
      item_ids: [item.id]
    });

    const protocol2 = await createProtocol({
      name: 'Protocol 2',
      description: 'Second protocol',
      item_ids: []
    });

    const result = await getProtocols();

    expect(result).toHaveLength(2);

    // Find protocols by name
    const p1 = result.find(p => p.name === 'Protocol 1');
    const p2 = result.find(p => p.name === 'Protocol 2');

    expect(p1).toBeTruthy();
    expect(p1!.description).toBe('First protocol');
    expect(p1!.items).toHaveLength(1);
    expect(p1!.items[0].name).toBe('Turmeric');
    expect(p1!.items[0].properties).toHaveLength(1);
    expect(p1!.items[0].properties[0].name).toBe('Anti-inflammatory');
    expect(p1!.items[0].uses).toHaveLength(1);
    expect(p1!.items[0].uses[0].name).toBe('Joint health');

    expect(p2).toBeTruthy();
    expect(p2!.description).toBe('Second protocol');
    expect(p2!.items).toHaveLength(0);
  });

  it('should return empty array when no protocols exist', async () => {
    const result = await getProtocols();
    expect(result).toHaveLength(0);
  });

  it('should return protocols with complete item information', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs' });
    const property1 = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study' });
    const property2 = await createProperty({ name: 'Digestive', source: 'Traditional use' });
    const use1 = await createUse({ name: 'Joint health', source: 'Traditional use' });
    const use2 = await createUse({ name: 'Nausea relief', source: 'Clinical study' });

    const item1 = await createNaturalHealingItem({
      name: 'Turmeric',
      description: 'Golden spice',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [property1.id],
      use_ids: [use1.id],
      tag_ids: []
    });

    const item2 = await createNaturalHealingItem({
      name: 'Ginger',
      description: 'Warming spice',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [property2.id],
      use_ids: [use2.id],
      tag_ids: []
    });

    const protocol = await createProtocol({
      name: 'Multi-item Protocol',
      description: 'Protocol with multiple items',
      item_ids: [item1.id, item2.id]
    });

    const result = await getProtocols();

    expect(result).toHaveLength(1);
    
    const p = result[0];
    expect(p.name).toBe('Multi-item Protocol');
    expect(p.items).toHaveLength(2);
    
    // Check that all properties and uses are included in the items
    const allProperties = p.items.flatMap(item => item.properties);
    const allUses = p.items.flatMap(item => item.uses);
    
    expect(allProperties).toHaveLength(2);
    const propertyNames = allProperties.map(prop => prop.name).sort();
    expect(propertyNames).toEqual(['Anti-inflammatory', 'Digestive']);
    
    expect(allUses).toHaveLength(2);
    const useNames = allUses.map(use => use.name).sort();
    expect(useNames).toEqual(['Joint health', 'Nausea relief']);
  });
});