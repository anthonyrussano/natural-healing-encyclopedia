import { db } from '../db';
import { 
  protocolsTable, 
  protocolItemsTable, 
  naturalHealingItemsTable, 
  categoriesTable, 
  naturalHealingItemTagsTable, 
  naturalHealingItemPropertiesTable,
  naturalHealingItemUsesTable,
  tagsTable,
  propertiesTable,
  usesTable
} from '../db/schema';
import { type ProtocolWithItems } from '../schema';
import { eq } from 'drizzle-orm';

export const getProtocols = async (): Promise<ProtocolWithItems[]> => {
  try {
    // Get all protocols
    const protocols = await db.select()
      .from(protocolsTable)
      .execute();

    // Build the result with related data
    const result: ProtocolWithItems[] = [];

    for (const protocol of protocols) {
      // Get items for this protocol with their categories
      const protocolItemsQuery = await db.select({
        item_id: protocolItemsTable.item_id,
        item_name: naturalHealingItemsTable.name,
        item_description: naturalHealingItemsTable.description,
        item_potential_side_effects: naturalHealingItemsTable.potential_side_effects,
        item_image_url: naturalHealingItemsTable.image_url,
        item_category_id: naturalHealingItemsTable.category_id,
        item_created_at: naturalHealingItemsTable.created_at,
        item_updated_at: naturalHealingItemsTable.updated_at,
        category_id: categoriesTable.id,
        category_name: categoriesTable.name,
        category_description: categoriesTable.description,
        category_created_at: categoriesTable.created_at,
      })
        .from(protocolItemsTable)
        .innerJoin(naturalHealingItemsTable, eq(protocolItemsTable.item_id, naturalHealingItemsTable.id))
        .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
        .where(eq(protocolItemsTable.protocol_id, protocol.id))
        .execute();

      // Get all related data for these items
      const itemIds = protocolItemsQuery.map(item => item.item_id);
      let itemTags: any[] = [];
      let itemProperties: any[] = [];
      let itemUses: any[] = [];

      if (itemIds.length > 0) {
        itemTags = await db.select({
          item_id: naturalHealingItemTagsTable.item_id,
          tag: tagsTable,
        })
          .from(naturalHealingItemTagsTable)
          .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
          .execute();

        itemProperties = await db.select({
          item_id: naturalHealingItemPropertiesTable.item_id,
          property: propertiesTable,
        })
          .from(naturalHealingItemPropertiesTable)
          .innerJoin(propertiesTable, eq(naturalHealingItemPropertiesTable.property_id, propertiesTable.id))
          .execute();

        itemUses = await db.select({
          item_id: naturalHealingItemUsesTable.item_id,
          use: usesTable,
        })
          .from(naturalHealingItemUsesTable)
          .innerJoin(usesTable, eq(naturalHealingItemUsesTable.use_id, usesTable.id))
          .execute();
      }

      // Group by item ID
      const tagsByItemId: Record<number, any[]> = {};
      const propertiesByItemId: Record<number, any[]> = {};
      const usesByItemId: Record<number, any[]> = {};

      itemTags.forEach(result => {
        if (itemIds.includes(result.item_id)) {
          if (!tagsByItemId[result.item_id]) tagsByItemId[result.item_id] = [];
          tagsByItemId[result.item_id].push(result.tag);
        }
      });

      itemProperties.forEach(result => {
        if (itemIds.includes(result.item_id)) {
          if (!propertiesByItemId[result.item_id]) propertiesByItemId[result.item_id] = [];
          propertiesByItemId[result.item_id].push(result.property);
        }
      });

      itemUses.forEach(result => {
        if (itemIds.includes(result.item_id)) {
          if (!usesByItemId[result.item_id]) usesByItemId[result.item_id] = [];
          usesByItemId[result.item_id].push(result.use);
        }
      });

      const items = protocolItemsQuery.map(itemData => ({
        id: itemData.item_id,
        name: itemData.item_name,
        description: itemData.item_description,
        properties: propertiesByItemId[itemData.item_id] || [],
        uses: usesByItemId[itemData.item_id] || [],
        potential_side_effects: itemData.item_potential_side_effects,
        image_url: itemData.item_image_url,
        category_id: itemData.item_category_id,
        created_at: itemData.item_created_at,
        updated_at: itemData.item_updated_at,
        category: {
          id: itemData.category_id,
          name: itemData.category_name,
          description: itemData.category_description,
          created_at: itemData.category_created_at,
        },
        tags: tagsByItemId[itemData.item_id] || []
      }));

      result.push({
        id: protocol.id,
        name: protocol.name,
        description: protocol.description,
        created_at: protocol.created_at,
        updated_at: protocol.updated_at,
        items: items
      });
    }

    return result;
  } catch (error) {
    console.error('Get protocols failed:', error);
    throw error;
  }
};