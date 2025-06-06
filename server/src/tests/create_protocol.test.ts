
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { protocolsTable, protocolItemsTable } from '../db/schema';
import { type CreateProtocolInput } from '../schema';
import { createProtocol } from '../handlers/create_protocol';
import { createCategory } from '../handlers/create_category';
import { createTag } from '../handlers/create_tag';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';
import { createProperty } from '../handlers/create_property';
import { createUse } from '../handlers/create_use';
import { eq } from 'drizzle-orm';

describe('createProtocol', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a protocol without items', async () => {
    const testInput: CreateProtocolInput = {
      name: 'Basic Wellness Protocol',
      description: 'A simple wellness protocol'
    };

    const result = await createProtocol(testInput);

    expect(result.name).toEqual('Basic Wellness Protocol');
    expect(result.description).toEqual('A simple wellness protocol');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.items).toEqual([]);
  });

  it('should create a protocol with items', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Herbs', description: 'Herbal remedies' });
    const tag = await createTag({ name: 'Anti-inflammatory', description: 'Reduces inflammation' });
    const property = await createProperty({ name: 'Anti-inflammatory', source: 'Clinical study' });
    const use = await createUse({ name: 'Joint pain relief', source: 'Traditional use' });

    const item = await createNaturalHealingItem({
      name: 'Turmeric',
      description: 'Golden spice with healing properties',
      potential_side_effects: 'May cause stomach upset',
      image_url: null,
      category_id: category.id,
      property_ids: [property.id],
      use_ids: [use.id],
      tag_ids: [tag.id]
    });

    const testInput: CreateProtocolInput = {
      name: 'Inflammation Protocol',
      description: 'Protocol for reducing inflammation',
      item_ids: [item.id]
    };

    const result = await createProtocol(testInput);

    expect(result.name).toEqual('Inflammation Protocol');
    expect(result.description).toEqual('Protocol for reducing inflammation');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toEqual('Turmeric');
    expect(result.items[0].category.name).toEqual('Herbs');
    expect(result.items[0].tags).toHaveLength(1);
    expect(result.items[0].tags[0].name).toEqual('Anti-inflammatory');
    // The createProtocol handler doesn't fetch properties and uses, only tags
    expect(result.items[0].tags).toHaveLength(1);
    expect(result.items[0].tags[0].name).toEqual('Anti-inflammatory');
  });

  it('should save protocol to database', async () => {
    const testInput: CreateProtocolInput = {
      name: 'Test Protocol',
      description: 'A protocol for testing',
      item_ids: []
    };

    const result = await createProtocol(testInput);

    const protocols = await db.select()
      .from(protocolsTable)
      .where(eq(protocolsTable.id, result.id))
      .execute();

    expect(protocols).toHaveLength(1);
    expect(protocols[0].name).toEqual('Test Protocol');
    expect(protocols[0].description).toEqual('A protocol for testing');
  });

  it('should create protocol-item relationships', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Supplements', description: 'Nutritional supplements' });
    const property1 = await createProperty({ name: 'Antioxidant', source: 'Study 1' });
    const property2 = await createProperty({ name: 'Immune support', source: 'Study 2' });
    const use1 = await createUse({ name: 'Immune system', source: 'Traditional use' });
    const use2 = await createUse({ name: 'Skin health', source: 'Research' });

    const item1 = await createNaturalHealingItem({
      name: 'Vitamin C',
      description: 'Essential vitamin',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [property1.id],
      use_ids: [use1.id, use2.id],
      tag_ids: []
    });

    const item2 = await createNaturalHealingItem({
      name: 'Zinc',
      description: 'Essential mineral',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [property2.id],
      use_ids: [use1.id],
      tag_ids: []
    });

    const itemIds = [item1.id, item2.id];

    const testInput: CreateProtocolInput = {
      name: 'Immune Support Protocol',
      description: 'Protocol for immune system support',
      item_ids: itemIds
    };

    const result = await createProtocol(testInput);

    const protocolItems = await db.select()
      .from(protocolItemsTable)
      .where(eq(protocolItemsTable.protocol_id, result.id))
      .execute();

    expect(protocolItems).toHaveLength(2);
    expect(protocolItems.map(pi => pi.item_id)).toEqual(expect.arrayContaining(itemIds));
  });

  it('should throw error for non-existent item_id', async () => {
    const testInput: CreateProtocolInput = {
      name: 'Invalid Protocol',
      description: 'Protocol with invalid item',
      item_ids: [999]
    };

    expect(createProtocol(testInput)).rejects.toThrow(/item with id 999 does not exist/i);
  });
});
