import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { protocolItemsTable } from '../db/schema';
import { type UpdateProtocolInput } from '../schema';
import { updateProtocol } from '../handlers/update_protocol';
import { createCategory } from '../handlers/create_category';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { createProtocol } from '../handlers/create_protocol';
import { eq } from 'drizzle-orm';

describe('updateProtocol', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update protocol name and description', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Natural herbs' });
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
      tag_ids: []
    });

    const protocol = await createProtocol({
      name: 'Original Protocol',
      description: 'Original description',
      item_ids: [item.id]
    });

    const updateInput: UpdateProtocolInput = {
      id: protocol.id,
      name: 'Updated Protocol',
      description: 'Updated description'
    };

    const result = await updateProtocol(updateInput);

    expect(result.name).toBe('Updated Protocol');
    expect(result.description).toBe('Updated description');
    expect(result.id).toBe(protocol.id);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify items are still associated
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Turmeric');
  });

  it('should update protocol items', async () => {
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
      name: 'Test Protocol',
      description: 'Test description',
      item_ids: [item1.id]
    });

    const updateInput: UpdateProtocolInput = {
      id: protocol.id,
      item_ids: [item2.id] // Replace with second item
    };

    const result = await updateProtocol(updateInput);

    expect(result.name).toBe('Test Protocol'); // Name unchanged
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Ginger'); // Different item now

    // Verify old association was removed
    const protocolItems = await db.select()
      .from(protocolItemsTable)
      .where(eq(protocolItemsTable.protocol_id, protocol.id))
      .execute();

    expect(protocolItems).toHaveLength(1);
    expect(protocolItems[0].item_id).toBe(item2.id);
  });

  it('should update both name and items simultaneously', async () => {
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
      name: 'Original Protocol',
      description: 'Original description',
      item_ids: []
    });

    const updateInput: UpdateProtocolInput = {
      id: protocol.id,
      name: 'Comprehensive Update',
      description: 'Updated with new name and items',
      item_ids: [item1.id, item2.id]
    };

    const result = await updateProtocol(updateInput);

    expect(result.name).toBe('Comprehensive Update');
    expect(result.description).toBe('Updated with new name and items');
    expect(result.items).toHaveLength(2);
    
    const itemNames = result.items.map(item => item.name).sort();
    expect(itemNames).toEqual(['Ginger', 'Turmeric']);
  });

  it('should throw error for non-existent protocol', async () => {
    const updateInput: UpdateProtocolInput = {
      id: 999,
      name: 'Non-existent update'
    };

    expect(updateProtocol(updateInput)).rejects.toThrow(/Protocol with id 999 not found/);
  });

  it('should throw error for non-existent item_id', async () => {
    const protocol = await createProtocol({
      name: 'Test Protocol',
      description: 'Test description',
      item_ids: []
    });

    const updateInput: UpdateProtocolInput = {
      id: protocol.id,
      item_ids: [999] // Non-existent item
    };

    expect(updateProtocol(updateInput)).rejects.toThrow(/Natural healing items with ids 999 not found/);
  });
});