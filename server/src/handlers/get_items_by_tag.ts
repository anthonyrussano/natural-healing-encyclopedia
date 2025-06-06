
import { db } from '../db';
import { naturalHealingItemsTable, naturalHealingItemTagsTable, categoriesTable, tagsTable } from '../db/schema';
import { type NaturalHealingItemWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getItemsByTag = async (tagId: number): Promise<NaturalHealingItemWithRelations[]> => {
  try {
    // Get items that have the specified tag through the junction table
    const results = await db.select({
      item: naturalHealingItemsTable,
      category: categoriesTable,
    })
    .from(naturalHealingItemsTable)
    .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
    .innerJoin(naturalHealingItemTagsTable, eq(naturalHealingItemsTable.id, naturalHealingItemTagsTable.item_id))
    .where(eq(naturalHealingItemTagsTable.tag_id, tagId))
    .execute();

    // Get all tags for each item
    const itemIds = results.map(result => result.item.id);
    
    if (itemIds.length === 0) {
      return [];
    }

    // Get all tags for all items in one query
    const itemTagsResults = await db.select({
      item_id: naturalHealingItemTagsTable.item_id,
      tag: tagsTable,
    })
    .from(naturalHealingItemTagsTable)
    .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
    .where(eq(naturalHealingItemTagsTable.item_id, itemIds[0]))
    .execute();

    // Get tags for all items if there are multiple
    let allItemTags = itemTagsResults;
    if (itemIds.length > 1) {
      for (let i = 1; i < itemIds.length; i++) {
        const moreTags = await db.select({
          item_id: naturalHealingItemTagsTable.item_id,
          tag: tagsTable,
        })
        .from(naturalHealingItemTagsTable)
        .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
        .where(eq(naturalHealingItemTagsTable.item_id, itemIds[i]))
        .execute();
        
        allItemTags = [...allItemTags, ...moreTags];
      }
    }

    // Group tags by item_id
    const tagsByItemId: Record<number, any[]> = {};
    allItemTags.forEach(result => {
      if (!tagsByItemId[result.item_id]) {
        tagsByItemId[result.item_id] = [];
      }
      tagsByItemId[result.item_id].push(result.tag);
    });

    // Map results to the expected format
    return results.map(result => ({
      ...result.item,
      category: result.category,
      tags: tagsByItemId[result.item.id] || []
    }));
  } catch (error) {
    console.error('Get items by tag failed:', error);
    throw error;
  }
};
