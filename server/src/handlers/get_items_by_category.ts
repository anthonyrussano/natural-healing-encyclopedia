import { db } from '../db';
import { 
  naturalHealingItemsTable, 
  categoriesTable, 
  naturalHealingItemTagsTable, 
  naturalHealingItemPropertiesTable,
  naturalHealingItemUsesTable,
  tagsTable,
  propertiesTable,
  usesTable
} from '../db/schema';
import { type NaturalHealingItemWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getItemsByCategory = async (categoryId: number): Promise<NaturalHealingItemWithRelations[]> => {
  try {
    // Get items with their category
    const itemsWithCategory = await db.select({
      id: naturalHealingItemsTable.id,
      name: naturalHealingItemsTable.name,
      description: naturalHealingItemsTable.description,
      potential_side_effects: naturalHealingItemsTable.potential_side_effects,
      image_url: naturalHealingItemsTable.image_url,
      category_id: naturalHealingItemsTable.category_id,
      created_at: naturalHealingItemsTable.created_at,
      updated_at: naturalHealingItemsTable.updated_at,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        description: categoriesTable.description,
        created_at: categoriesTable.created_at,
      }
    })
    .from(naturalHealingItemsTable)
    .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
    .where(eq(naturalHealingItemsTable.category_id, categoryId))
    .execute();

    const itemIds = itemsWithCategory.map(item => item.id);
    
    let itemTags: Array<{item_id: number; tag: any}> = [];
    let itemProperties: Array<{item_id: number; property: any}> = [];
    let itemUses: Array<{item_id: number; use: any}> = [];

    if (itemIds.length > 0) {
      // Get all tags for these items
      itemTags = await db.select({
        item_id: naturalHealingItemTagsTable.item_id,
        tag: {
          id: tagsTable.id,
          name: tagsTable.name,
          description: tagsTable.description,
          created_at: tagsTable.created_at,
        }
      })
      .from(naturalHealingItemTagsTable)
      .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
      .execute();

      // Get all properties for these items
      itemProperties = await db.select({
        item_id: naturalHealingItemPropertiesTable.item_id,
        property: {
          id: propertiesTable.id,
          name: propertiesTable.name,
          source: propertiesTable.source,
          created_at: propertiesTable.created_at,
        }
      })
      .from(naturalHealingItemPropertiesTable)
      .innerJoin(propertiesTable, eq(naturalHealingItemPropertiesTable.property_id, propertiesTable.id))
      .execute();

      // Get all uses for these items
      itemUses = await db.select({
        item_id: naturalHealingItemUsesTable.item_id,
        use: {
          id: usesTable.id,
          name: usesTable.name,
          source: usesTable.source,
          created_at: usesTable.created_at,
        }
      })
      .from(naturalHealingItemUsesTable)
      .innerJoin(usesTable, eq(naturalHealingItemUsesTable.use_id, usesTable.id))
      .execute();
    }

    // Group by item ID
    const tagsByItemId = itemTags.reduce((acc, { item_id, tag }) => {
      if (!acc[item_id]) acc[item_id] = [];
      acc[item_id].push(tag);
      return acc;
    }, {} as Record<number, any[]>);

    const propertiesByItemId = itemProperties.reduce((acc, { item_id, property }) => {
      if (!acc[item_id]) acc[item_id] = [];
      acc[item_id].push(property);
      return acc;
    }, {} as Record<number, any[]>);

    const usesByItemId = itemUses.reduce((acc, { item_id, use }) => {
      if (!acc[item_id]) acc[item_id] = [];
      acc[item_id].push(use);
      return acc;
    }, {} as Record<number, any[]>);

    // Filter items by category and combine with relations
    return itemsWithCategory
      .filter(item => item.category_id === categoryId)
      .map(item => ({
        ...item,
        properties: propertiesByItemId[item.id] || [],
        uses: usesByItemId[item.id] || [],
        tags: tagsByItemId[item.id] || []
      }));
  } catch (error) {
    console.error('Get items by category failed:', error);
    throw error;
  }
};