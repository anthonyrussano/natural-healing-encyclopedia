
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  categoriesTable, 
  tagsTable, 
  naturalHealingItemsTable, 
  protocolsTable,
  protocolItemsTable,
  naturalHealingItemTagsTable 
} from '../db/schema';
import { getProtocolById } from '../handlers/get_protocol_by_id';

describe('getProtocolById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent protocol', async () => {
    const result = await getProtocolById(999);
    expect(result).toBeNull();
  });

  it('should return protocol with empty items list', async () => {
    // Create a protocol without any items
    const protocolResult = await db.insert(protocolsTable)
      .values({
        name: 'Empty Protocol',
        description: 'A protocol with no items'
      })
      .returning()
      .execute();

    const protocol = protocolResult[0];
    const result = await getProtocolById(protocol.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(protocol.id);
    expect(result!.name).toEqual('Empty Protocol');
    expect(result!.description).toEqual('A protocol with no items');
    expect(result!.items).toHaveLength(0);
    expect(result!.aggregated_metadata.common_properties).toHaveLength(0);
    expect(result!.aggregated_metadata.common_uses).toHaveLength(0);
    expect(result!.aggregated_metadata.all_side_effects).toHaveLength(0);
    expect(result!.aggregated_metadata.categories).toHaveLength(0);
    expect(result!.aggregated_metadata.tags).toHaveLength(0);
  });

  it('should return complete protocol with items and metadata', async () => {
    // Create test data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Herbs',
        description: 'Natural herbs'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'Anti-inflammatory', description: 'Reduces inflammation' },
        { name: 'Digestive', description: 'Aids digestion' }
      ])
      .returning()
      .execute();
    const [tag1, tag2] = tagResults;

    const itemResults = await db.insert(naturalHealingItemsTable)
      .values([
        {
          name: 'Turmeric',
          description: 'Golden spice',
          properties: 'anti-inflammatory, antioxidant',
          uses: 'joint pain, digestion',
          potential_side_effects: 'stomach upset, blood thinning',
          image_url: 'https://example.com/turmeric.jpg',
          category_id: category.id
        },
        {
          name: 'Ginger',
          description: 'Root spice',
          properties: 'warming, digestive',
          uses: 'nausea, inflammation',
          potential_side_effects: 'heartburn',
          image_url: null,
          category_id: category.id
        }
      ])
      .returning()
      .execute();
    const [item1, item2] = itemResults;

    // Create item-tag associations
    await db.insert(naturalHealingItemTagsTable)
      .values([
        { item_id: item1.id, tag_id: tag1.id },
        { item_id: item1.id, tag_id: tag2.id },
        { item_id: item2.id, tag_id: tag2.id }
      ])
      .execute();

    const protocolResult = await db.insert(protocolsTable)
      .values({
        name: 'Inflammation Protocol',
        description: 'Natural anti-inflammatory protocol'
      })
      .returning()
      .execute();
    const protocol = protocolResult[0];

    // Associate items with protocol
    await db.insert(protocolItemsTable)
      .values([
        { protocol_id: protocol.id, item_id: item1.id },
        { protocol_id: protocol.id, item_id: item2.id }
      ])
      .execute();

    const result = await getProtocolById(protocol.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(protocol.id);
    expect(result!.name).toEqual('Inflammation Protocol');
    expect(result!.description).toEqual('Natural anti-inflammatory protocol');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Check items
    expect(result!.items).toHaveLength(2);
    
    const turmericItem = result!.items.find(item => item.name === 'Turmeric');
    expect(turmericItem).toBeDefined();
    expect(turmericItem!.description).toEqual('Golden spice');
    expect(turmericItem!.properties).toEqual('anti-inflammatory, antioxidant');
    expect(turmericItem!.uses).toEqual('joint pain, digestion');
    expect(turmericItem!.potential_side_effects).toEqual('stomach upset, blood thinning');
    expect(turmericItem!.image_url).toEqual('https://example.com/turmeric.jpg');
    expect(turmericItem!.category.name).toEqual('Herbs');
    expect(turmericItem!.tags).toHaveLength(2);
    
    const gingerItem = result!.items.find(item => item.name === 'Ginger');
    expect(gingerItem).toBeDefined();
    expect(gingerItem!.tags).toHaveLength(1);
    expect(gingerItem!.tags[0].name).toEqual('Digestive');

    // Check aggregated metadata
    expect(result!.aggregated_metadata.common_properties).toContain('anti-inflammatory');
    expect(result!.aggregated_metadata.common_properties).toContain('antioxidant');
    expect(result!.aggregated_metadata.common_properties).toContain('warming');
    expect(result!.aggregated_metadata.common_properties).toContain('digestive');

    expect(result!.aggregated_metadata.common_uses).toContain('joint pain');
    expect(result!.aggregated_metadata.common_uses).toContain('digestion');
    expect(result!.aggregated_metadata.common_uses).toContain('nausea');
    expect(result!.aggregated_metadata.common_uses).toContain('inflammation');

    expect(result!.aggregated_metadata.all_side_effects).toContain('stomach upset');
    expect(result!.aggregated_metadata.all_side_effects).toContain('blood thinning');
    expect(result!.aggregated_metadata.all_side_effects).toContain('heartburn');

    expect(result!.aggregated_metadata.categories).toHaveLength(1);
    expect(result!.aggregated_metadata.categories[0].name).toEqual('Herbs');

    expect(result!.aggregated_metadata.tags).toHaveLength(2);
    const tagNames = result!.aggregated_metadata.tags.map(tag => tag.name);
    expect(tagNames).toContain('Anti-inflammatory');
    expect(tagNames).toContain('Digestive');
  });

  it('should handle items with no tags', async () => {
    // Create test data without tags
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Supplements',
        description: 'Dietary supplements'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Vitamin C',
        description: 'Essential vitamin',
        properties: 'antioxidant, immune support',
        uses: 'immune system, skin health',
        potential_side_effects: null,
        image_url: null,
        category_id: category.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    const protocolResult = await db.insert(protocolsTable)
      .values({
        name: 'Immune Support',
        description: null
      })
      .returning()
      .execute();
    const protocol = protocolResult[0];

    await db.insert(protocolItemsTable)
      .values({ protocol_id: protocol.id, item_id: item.id })
      .execute();

    const result = await getProtocolById(protocol.id);

    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].tags).toHaveLength(0);
    expect(result!.aggregated_metadata.tags).toHaveLength(0);
    expect(result!.aggregated_metadata.all_side_effects).toHaveLength(0);
  });
});
