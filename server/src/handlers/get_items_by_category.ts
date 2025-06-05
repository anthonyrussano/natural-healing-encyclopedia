
import { db } from '../db';
import { naturalHealingItemsTable, categoriesTable, naturalHealingItemTagsTable, tagsTable } from '../db/schema';
import { type NaturalHealingItemWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getItemsByCategory = async (categoryId: number): Promise<NaturalHealingItemWithRelations[]> => {
  try {
    // Get items with their category
    const itemsWithCategory = await db.select({
      id: naturalHealingItemsTable.id,
      name: naturalHealingItemsTable.name,
      description: naturalHealingItemsTable.description,
      properties: naturalHealingItemsTable.properties,
      uses: naturalHealingItemsTable.uses,
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

    // Get tags for each item
    const itemIds = itemsWithCategory.map(item => item.id);
    
    let itemTags: Array<{
      item_id: number;
      tag: {
        id: number;
        name: string;
        description: string | null;
        created_at: Date;
      };
    }> = [];

    if (itemIds.length > 0) {
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
      .where(eq(naturalHealingItemTagsTable.item_id, itemIds[0]))
      .execute();

      // Get tags for remaining items if there are more
      for (let i = 1; i < itemIds.length; i++) {
        const additionalTags = await db.select({
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
        .where(eq(naturalHealingItemTagsTable.item_id, itemIds[i]))
        .execute();
        
        itemTags.push(...additionalTags);
      }
    }

    // Group tags by item ID
    const tagsByItemId = itemTags.reduce((acc, { item_id, tag }) => {
      if (!acc[item_id]) {
        acc[item_id] = [];
      }
      acc[item_id].push(tag);
      return acc;
    }, {} as Record<number, typeof itemTags[0]['tag'][]>);

    // Combine items with their tags
    return itemsWithCategory.map(item => ({
      ...item,
      tags: tagsByItemId[item.id] || []
    }));
  } catch (error) {
    console.error('Get items by category failed:', error);
    throw error;
  }
};
