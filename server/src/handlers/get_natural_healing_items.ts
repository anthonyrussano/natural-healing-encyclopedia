
import { db } from '../db';
import { naturalHealingItemsTable, categoriesTable, naturalHealingItemTagsTable, tagsTable } from '../db/schema';
import { type NaturalHealingItemWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getNaturalHealingItems = async (): Promise<NaturalHealingItemWithRelations[]> => {
  try {
    // Get all natural healing items with their categories
    const itemsWithCategories = await db.select()
      .from(naturalHealingItemsTable)
      .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
      .execute();

    // Get all item-tag relationships
    const itemTags = await db.select()
      .from(naturalHealingItemTagsTable)
      .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
      .execute();

    // Build the result with relations
    const result: NaturalHealingItemWithRelations[] = itemsWithCategories.map(row => {
      const item = row.natural_healing_items;
      const category = row.categories;

      // Find tags for this item
      const itemTagsForThisItem = itemTags
        .filter(tagRow => tagRow.natural_healing_item_tags.item_id === item.id)
        .map(tagRow => tagRow.tags);

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        properties: item.properties,
        uses: item.uses,
        potential_side_effects: item.potential_side_effects,
        image_url: item.image_url,
        category_id: item.category_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          created_at: category.created_at
        },
        tags: itemTagsForThisItem
      };
    });

    return result;
  } catch (error) {
    console.error('Failed to get natural healing items:', error);
    throw error;
  }
};
