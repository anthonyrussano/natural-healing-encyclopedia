
import { db } from '../db';
import { protocolsTable, protocolItemsTable, naturalHealingItemsTable, categoriesTable, naturalHealingItemTagsTable, tagsTable } from '../db/schema';
import { type UpdateProtocolInput, type ProtocolWithItems } from '../schema';
import { eq, and } from 'drizzle-orm';

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

    // Get tags for each item
    const items = [];
    for (const result of protocolItemsResult) {
      const item = result.natural_healing_items;
      const category = result.categories;

      // Fetch tags for this item
      const itemTagsResult = await db.select()
        .from(naturalHealingItemTagsTable)
        .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
        .where(eq(naturalHealingItemTagsTable.item_id, item.id))
        .execute();

      const tags = itemTagsResult.map(tagResult => tagResult.tags);

      items.push({
        ...item,
        category,
        tags
      });
    }

    return {
      ...protocol,
      items
    };
  } catch (error) {
    console.error('Protocol update failed:', error);
    throw error;
  }
};
