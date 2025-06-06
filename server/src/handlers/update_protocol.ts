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
import { type UpdateProtocolInput, type ProtocolWithItems } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProtocol = async (input: UpdateProtocolInput): Promise<ProtocolWithItems> => {
  try {
    // Verify protocol exists
    const existingProtocol = await db.select()
      .from(protocolsTable)
      .where(eq(protocolsTable.id, input.id))
      .execute();

    if (existingProtocol.length === 0) {
      throw new Error(`Protocol with id ${input.id} not found`);
    }

    // If item_ids provided, verify all items exist
    if (input.item_ids) {
      const existingItems = await db.select()
        .from(naturalHealingItemsTable)
        .execute();
      
      const existingItemIds = existingItems.map(item => item.id);
      const invalidItemIds = input.item_ids.filter(id => !existingItemIds.includes(id));
      
      if (invalidItemIds.length > 0) {
        throw new Error(`Natural healing items with ids ${invalidItemIds.join(', ')} not found`);
      }
    }

    // Update protocol fields if provided
    if (input.name !== undefined || input.description !== undefined) {
      const updateData: any = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      
      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      updateData.updated_at = new Date();

      await db.update(protocolsTable)
        .set(updateData)
        .where(eq(protocolsTable.id, input.id))
        .execute();
    }

    // Update protocol items if provided
    if (input.item_ids !== undefined) {
      // Remove existing protocol items
      await db.delete(protocolItemsTable)
        .where(eq(protocolItemsTable.protocol_id, input.id))
        .execute();

      // Add new protocol items
      if (input.item_ids.length > 0) {
        const protocolItemsData = input.item_ids.map(itemId => ({
          protocol_id: input.id,
          item_id: itemId
        }));

        await db.insert(protocolItemsTable)
          .values(protocolItemsData)
          .execute();
      }
    }

    // Fetch updated protocol with items and relations
    const protocolResult = await db.select()
      .from(protocolsTable)
      .where(eq(protocolsTable.id, input.id))
      .execute();

    const protocol = protocolResult[0];

    // Fetch protocol items with full relations
    const protocolItemsResult = await db.select()
      .from(protocolItemsTable)
      .innerJoin(naturalHealingItemsTable, eq(protocolItemsTable.item_id, naturalHealingItemsTable.id))
      .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
      .where(eq(protocolItemsTable.protocol_id, input.id))
      .execute();

    const itemIds = protocolItemsResult.map(result => result.natural_healing_items.id);
    let itemTags: any[] = [];
    let itemProperties: any[] = [];
    let itemUses: any[] = [];

    if (itemIds.length > 0) {
      // Get all related data for these items
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

    const items = protocolItemsResult.map(result => {
      const item = result.natural_healing_items;
      const category = result.categories;

      return {
        ...item,
        properties: propertiesByItemId[item.id] || [],
        uses: usesByItemId[item.id] || [],
        category,
        tags: tagsByItemId[item.id] || []
      };
    });

    return {
      ...protocol,
      items
    };
  } catch (error) {
    console.error('Protocol update failed:', error);
    throw error;
  }
};