
import { db } from '../db';
import { protocolsTable, protocolItemsTable, naturalHealingItemsTable, categoriesTable, tagsTable, naturalHealingItemTagsTable } from '../db/schema';
import { type CreateProtocolInput, type ProtocolWithItems } from '../schema';
import { eq } from 'drizzle-orm';

export const createProtocol = async (input: CreateProtocolInput): Promise<ProtocolWithItems> => {
  try {
    // Verify all item_ids exist if provided
    if (input.item_ids && input.item_ids.length > 0) {
      const existingItems = await db.select({ id: naturalHealingItemsTable.id })
        .from(naturalHealingItemsTable)
        .where(eq(naturalHealingItemsTable.id, input.item_ids[0]))
        .execute();

      for (const itemId of input.item_ids) {
        const items = await db.select({ id: naturalHealingItemsTable.id })
          .from(naturalHealingItemsTable)
          .where(eq(naturalHealingItemsTable.id, itemId))
          .execute();
        
        if (items.length === 0) {
          throw new Error(`Natural healing item with id ${itemId} does not exist`);
        }
      }
    }

    // Insert protocol record
    const protocolResult = await db.insert(protocolsTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    const protocol = protocolResult[0];

    // Insert protocol-item relationships if item_ids provided
    if (input.item_ids && input.item_ids.length > 0) {
      const protocolItemValues = input.item_ids.map(itemId => ({
        protocol_id: protocol.id,
        item_id: itemId
      }));

      await db.insert(protocolItemsTable)
        .values(protocolItemValues)
        .execute();
    }

    // Fetch the complete protocol with items and their relations
    const protocolWithItemsResult = await db.select({
      protocol: protocolsTable,
      item: naturalHealingItemsTable,
      category: categoriesTable,
      tag: tagsTable
    })
      .from(protocolsTable)
      .leftJoin(protocolItemsTable, eq(protocolsTable.id, protocolItemsTable.protocol_id))
      .leftJoin(naturalHealingItemsTable, eq(protocolItemsTable.item_id, naturalHealingItemsTable.id))
      .leftJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
      .leftJoin(naturalHealingItemTagsTable, eq(naturalHealingItemsTable.id, naturalHealingItemTagsTable.item_id))
      .leftJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
      .where(eq(protocolsTable.id, protocol.id))
      .execute();

    // Group results by item to collect tags
    const itemsMap = new Map();
    
    for (const row of protocolWithItemsResult) {
      if (row.item) {
        if (!itemsMap.has(row.item.id)) {
          itemsMap.set(row.item.id, {
            ...row.item,
            category: row.category!,
            tags: []
          });
        }
        
        if (row.tag) {
          const item = itemsMap.get(row.item.id);
          if (!item.tags.some((tag: any) => tag.id === row.tag!.id)) {
            item.tags.push(row.tag);
          }
        }
      }
    }

    const items = Array.from(itemsMap.values());

    return {
      ...protocol,
      items
    };
  } catch (error) {
    console.error('Protocol creation failed:', error);
    throw error;
  }
};
