
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, naturalHealingItemsTable, protocolsTable, protocolItemsTable, naturalHealingItemTagsTable } from '../db/schema';
import { getProtocols } from '../handlers/get_protocols';

describe('getProtocols', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no protocols exist', async () => {
    const result = await getProtocols();
    expect(result).toEqual([]);
  });

  it('should return protocols with items and relations', async () => {
    // Create test data
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Herbs',
        description: 'Natural herbs'
      })
      .returning()
      .execute();

    const tag = await db.insert(tagsTable)
      .values({
        name: 'Anti-inflammatory',
        description: 'Reduces inflammation'
      })
      .returning()
      .execute();

    const item = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Turmeric',
        description: 'Golden spice with healing properties',
        properties: 'Anti-inflammatory, antioxidant',
        uses: 'Joint pain, inflammation',
        potential_side_effects: 'May cause stomach upset',
        image_url: 'https://example.com/turmeric.jpg',
        category_id: category[0].id
      })
      .returning()
      .execute();

    const protocol = await db.insert(protocolsTable)
      .values({
        name: 'Anti-Inflammation Protocol',
        description: 'Protocol for reducing inflammation'
      })
      .returning()
      .execute();

    // Link item to protocol
    await db.insert(protocolItemsTable)
      .values({
        protocol_id: protocol[0].id,
        item_id: item[0].id
      })
      .execute();

    // Link item to tag
    await db.insert(naturalHealingItemTagsTable)
      .values({
        item_id: item[0].id,
        tag_id: tag[0].id
      })
      .execute();

    const result = await getProtocols();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(protocol[0].id);
    expect(result[0].name).toEqual('Anti-Inflammation Protocol');
    expect(result[0].description).toEqual('Protocol for reducing inflammation');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check items
    expect(result[0].items).toHaveLength(1);
    const resultItem = result[0].items[0];
    expect(resultItem.id).toEqual(item[0].id);
    expect(resultItem.name).toEqual('Turmeric');
    expect(resultItem.description).toEqual('Golden spice with healing properties');
    expect(resultItem.properties).toEqual('Anti-inflammatory, antioxidant');
    expect(resultItem.uses).toEqual('Joint pain, inflammation');
    expect(resultItem.potential_side_effects).toEqual('May cause stomach upset');
    expect(resultItem.image_url).toEqual('https://example.com/turmeric.jpg');
    expect(resultItem.category_id).toEqual(category[0].id);

    // Check category
    expect(resultItem.category.id).toEqual(category[0].id);
    expect(resultItem.category.name).toEqual('Herbs');
    expect(resultItem.category.description).toEqual('Natural herbs');

    // Check tags
    expect(resultItem.tags).toHaveLength(1);
    expect(resultItem.tags[0].id).toEqual(tag[0].id);
    expect(resultItem.tags[0].name).toEqual('Anti-inflammatory');
    expect(resultItem.tags[0].description).toEqual('Reduces inflammation');
  });

  it('should return protocol with no items when protocol has no items', async () => {
    const protocol = await db.insert(protocolsTable)
      .values({
        name: 'Empty Protocol',
        description: 'Protocol with no items'
      })
      .returning()
      .execute();

    const result = await getProtocols();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(protocol[0].id);
    expect(result[0].name).toEqual('Empty Protocol');
    expect(result[0].items).toEqual([]);
  });

  it('should return multiple protocols correctly', async () => {
    // Create categories and items
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Herbs',
        description: 'Natural herbs'
      })
      .returning()
      .execute();

    const item1 = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Turmeric',
        description: 'Golden spice',
        properties: 'Anti-inflammatory',
        uses: 'Joint pain',
        category_id: category[0].id
      })
      .returning()
      .execute();

    const item2 = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Ginger',
        description: 'Spicy root',
        properties: 'Anti-nausea',
        uses: 'Digestive issues',
        category_id: category[0].id
      })
      .returning()
      .execute();

    // Create protocols
    const protocol1 = await db.insert(protocolsTable)
      .values({
        name: 'Protocol 1',
        description: 'First protocol'
      })
      .returning()
      .execute();

    const protocol2 = await db.insert(protocolsTable)
      .values({
        name: 'Protocol 2',
        description: 'Second protocol'
      })
      .returning()
      .execute();

    // Link items to protocols
    await db.insert(protocolItemsTable)
      .values({
        protocol_id: protocol1[0].id,
        item_id: item1[0].id
      })
      .execute();

    await db.insert(protocolItemsTable)
      .values({
        protocol_id: protocol2[0].id,
        item_id: item2[0].id
      })
      .execute();

    const result = await getProtocols();

    expect(result).toHaveLength(2);
    
    const firstProtocol = result.find(p => p.name === 'Protocol 1');
    const secondProtocol = result.find(p => p.name === 'Protocol 2');
    
    expect(firstProtocol).toBeDefined();
    expect(firstProtocol!.items).toHaveLength(1);
    expect(firstProtocol!.items[0].name).toEqual('Turmeric');
    
    expect(secondProtocol).toBeDefined();
    expect(secondProtocol!.items).toHaveLength(1);
    expect(secondProtocol!.items[0].name).toEqual('Ginger');
  });
});
