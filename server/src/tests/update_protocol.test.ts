
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, naturalHealingItemsTable, protocolsTable, protocolItemsTable, naturalHealingItemTagsTable } from '../db/schema';
import { type UpdateProtocolInput } from '../schema';
import { updateProtocol } from '../handlers/update_protocol';

describe('updateProtocol', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let tagId: number;
  let itemId1: number;
  let itemId2: number;
  let protocolId: number;

  beforeEach(async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Herbs',
        description: 'Herbal remedies'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Anti-inflammatory',
        description: 'Reduces inflammation'
      })
      .returning()
      .execute();
    tagId = tagResult[0].id;

    // Create test natural healing items
    const item1Result = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Turmeric',
        description: 'Golden spice with healing properties',
        properties: 'Anti-inflammatory, antioxidant',
        uses: 'Joint pain, inflammation',
        potential_side_effects: 'May cause stomach upset',
        category_id: categoryId
      })
      .returning()
      .execute();
    itemId1 = item1Result[0].id;

    const item2Result = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Ginger',
        description: 'Root with warming properties',
        properties: 'Anti-nausea, warming',
        uses: 'Nausea, digestion',
        potential_side_effects: 'May increase bleeding risk',
        category_id: categoryId
      })
      .returning()
      .execute();
    itemId2 = item2Result[0].id;

    // Create item-tag association
    await db.insert(naturalHealingItemTagsTable)
      .values({
        item_id: itemId1,
        tag_id: tagId
      })
      .execute();

    // Create test protocol
    const protocolResult = await db.insert(protocolsTable)
      .values({
        name: 'Inflammation Protocol',
        description: 'Protocol for reducing inflammation'
      })
      .returning()
      .execute();
    protocolId = protocolResult[0].id;

    // Add initial protocol item
    await db.insert(protocolItemsTable)
      .values({
        protocol_id: protocolId,
        item_id: itemId1
      })
      .execute();
  });

  it('should update protocol name and description', async () => {
    const input: UpdateProtocolInput = {
      id: protocolId,
      name: 'Updated Inflammation Protocol',
      description: 'Updated protocol for reducing inflammation'
    };

    const result = await updateProtocol(input);

    expect(result.name).toEqual('Updated Inflammation Protocol');
    expect(result.description).toEqual('Updated protocol for reducing inflammation');
    expect(result.id).toEqual(protocolId);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Should still have the original item
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toEqual('Turmeric');
  });

  it('should update protocol items', async () => {
    const input: UpdateProtocolInput = {
      id: protocolId,
      item_ids: [itemId2]
    };

    const result = await updateProtocol(input);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toEqual('Ginger');
    expect(result.items[0].id).toEqual(itemId2);
    expect(result.items[0].category).toBeDefined();
    expect(result.items[0].category.name).toEqual('Herbs');
    expect(result.items[0].tags).toEqual([]);
  });

  it('should update protocol with multiple items', async () => {
    const input: UpdateProtocolInput = {
      id: protocolId,
      name: 'Multi-Item Protocol',
      item_ids: [itemId1, itemId2]
    };

    const result = await updateProtocol(input);

    expect(result.name).toEqual('Multi-Item Protocol');
    expect(result.items).toHaveLength(2);
    
    const itemNames = result.items.map(item => item.name).sort();
    expect(itemNames).toEqual(['Ginger', 'Turmeric']);
    
    // Check that items have proper relations
    result.items.forEach(item => {
      expect(item.category).toBeDefined();
      expect(item.category.name).toEqual('Herbs');
      expect(item.tags).toBeDefined();
    });

    // Turmeric should have the tag, Ginger should not
    const turmericItem = result.items.find(item => item.name === 'Turmeric');
    const gingerItem = result.items.find(item => item.name === 'Ginger');
    
    expect(turmericItem?.tags).toHaveLength(1);
    expect(turmericItem?.tags[0].name).toEqual('Anti-inflammatory');
    expect(gingerItem?.tags).toHaveLength(0);
  });

  it('should clear protocol items when empty array provided', async () => {
    const input: UpdateProtocolInput = {
      id: protocolId,
      item_ids: []
    };

    const result = await updateProtocol(input);

    expect(result.items).toHaveLength(0);
  });

  it('should throw error for non-existent protocol', async () => {
    const input: UpdateProtocolInput = {
      id: 999,
      name: 'Non-existent Protocol'
    };

    expect(updateProtocol(input)).rejects.toThrow(/Protocol with id 999 not found/i);
  });

  it('should throw error for non-existent item ids', async () => {
    const input: UpdateProtocolInput = {
      id: protocolId,
      item_ids: [999, 1000]
    };

    expect(updateProtocol(input)).rejects.toThrow(/Natural healing items with ids 999, 1000 not found/i);
  });

  it('should update only specified fields', async () => {
    const input: UpdateProtocolInput = {
      id: protocolId,
      name: 'Updated Name Only'
    };

    const result = await updateProtocol(input);

    expect(result.name).toEqual('Updated Name Only');
    expect(result.description).toEqual('Protocol for reducing inflammation'); // Should remain unchanged
    expect(result.items).toHaveLength(1); // Items should remain unchanged
    expect(result.items[0].name).toEqual('Turmeric');
  });
});
