
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { protocolsTable, protocolItemsTable, categoriesTable, naturalHealingItemsTable, tagsTable, naturalHealingItemTagsTable } from '../db/schema';
import { type CreateProtocolInput } from '../schema';
import { createProtocol } from '../handlers/create_protocol';
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
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Herbs', description: 'Herbal remedies' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const tagResult = await db.insert(tagsTable)
      .values({ name: 'Anti-inflammatory', description: 'Reduces inflammation' })
      .returning()
      .execute();
    const tagId = tagResult[0].id;

    const itemResult = await db.insert(naturalHealingItemsTable)
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
    const itemId = itemResult[0].id;

    // Link item to tag
    await db.insert(naturalHealingItemTagsTable)
      .values({ item_id: itemId, tag_id: tagId })
      .execute();

    const testInput: CreateProtocolInput = {
      name: 'Inflammation Protocol',
      description: 'Protocol for reducing inflammation',
      item_ids: [itemId]
    };

    const result = await createProtocol(testInput);

    expect(result.name).toEqual('Inflammation Protocol');
    expect(result.description).toEqual('Protocol for reducing inflammation');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toEqual('Turmeric');
    expect(result.items[0].category.name).toEqual('Herbs');
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
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Supplements', description: 'Nutritional supplements' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const itemResults = await db.insert(naturalHealingItemsTable)
      .values([
        {
          name: 'Vitamin C',
          description: 'Essential vitamin',
          properties: 'Antioxidant, immune support',
          uses: 'Immune system, skin health',
          category_id: categoryId
        },
        {
          name: 'Zinc',
          description: 'Essential mineral',
          properties: 'Immune support, wound healing',
          uses: 'Immune system, wound healing',
          category_id: categoryId
        }
      ])
      .returning()
      .execute();

    const itemIds = itemResults.map(item => item.id);

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
