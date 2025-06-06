import { db } from '../db';
import { 
  naturalHealingItemsTable, 
  naturalHealingItemTagsTable, 
  naturalHealingItemPropertiesTable,
  naturalHealingItemUsesTable,
  categoriesTable, 
  tagsTable,
  propertiesTable,
  usesTable
} from '../db/schema';
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

    const itemIds = results.map(result => result.item.id);
    
    if (itemIds.length === 0) {
      return [];
    }

    // Get all related data for these items
    const itemTagsResults = await db.select({
      item_id: naturalHealingItemTagsTable.item_id,
      tag: tagsTable,
    })
    .from(naturalHealingItemTagsTable)
    .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
    .execute();

    const itemPropertiesResults = await db.select({
      item_id: naturalHealingItemPropertiesTable.item_id,
      property: propertiesTable,
    })
    .from(naturalHealingItemPropertiesTable)
    .innerJoin(propertiesTable, eq(naturalHealingItemPropertiesTable.property_id, propertiesTable.id))
    .execute();

    const itemUsesResults = await db.select({
      item_id: naturalHealingItemUsesTable.item_id,
      use: usesTable,
    })
    .from(naturalHealingItemUsesTable)
    .innerJoin(usesTable, eq(naturalHealingItemUsesTable.use_id, usesTable.id))
    .execute();

    // Group by item_id
    const tagsByItemId: Record<number, any[]> = {};
    const propertiesByItemId: Record<number, any[]> = {};
    const usesByItemId: Record<number, any[]> = {};

    itemTagsResults.forEach(result => {
      if (!tagsByItemId[result.item_id]) tagsByItemId[result.item_id] = [];
      tagsByItemId[result.item_id].push(result.tag);
    });

    itemPropertiesResults.forEach(result => {
      if (!propertiesByItemId[result.item_id]) propertiesByItemId[result.item_id] = [];
      propertiesByItemId[result.item_id].push(result.property);
    });

    itemUsesResults.forEach(result => {
      if (!usesByItemId[result.item_id]) usesByItemId[result.item_id] = [];
      usesByItemId[result.item_id].push(result.use);
    });

    // Map results to the expected format
    return results.map(result => ({
      ...result.item,
      properties: propertiesByItemId[result.item.id] || [],
      uses: usesByItemId[result.item.id] || [],
      category: result.category,
      tags: tagsByItemId[result.item.id] || []
    }));
  } catch (error) {
    console.error('Get items by tag failed:', error);
    throw error;
  }
};