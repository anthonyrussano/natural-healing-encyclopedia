
import { db } from '../db';
import { protocolsTable, protocolItemsTable, naturalHealingItemsTable, categoriesTable, naturalHealingItemTagsTable, tagsTable } from '../db/schema';
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
      // Get items for this protocol with their categories and tags
      const protocolItemsQuery = await db.select({
        item_id: protocolItemsTable.item_id,
        item_name: naturalHealingItemsTable.name,
        item_description: naturalHealingItemsTable.description,
        item_properties: naturalHealingItemsTable.properties,
        item_uses: naturalHealingItemsTable.uses,
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

      // Get tags for each item
      const items = [];
      for (const itemData of protocolItemsQuery) {
        const itemTags = await db.select({
          tag_id: tagsTable.id,
          tag_name: tagsTable.name,
          tag_description: tagsTable.description,
          tag_created_at: tagsTable.created_at,
        })
          .from(naturalHealingItemTagsTable)
          .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
          .where(eq(naturalHealingItemTagsTable.item_id, itemData.item_id))
          .execute();

        items.push({
          id: itemData.item_id,
          name: itemData.item_name,
          description: itemData.item_description,
          properties: itemData.item_properties,
          uses: itemData.item_uses,
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
          tags: itemTags.map(tag => ({
            id: tag.tag_id,
            name: tag.tag_name,
            description: tag.tag_description,
            created_at: tag.tag_created_at,
          }))
        });
      }

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
