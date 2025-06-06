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

    // Get all item-property relationships
    const itemProperties = await db.select()
      .from(naturalHealingItemPropertiesTable)
      .innerJoin(propertiesTable, eq(naturalHealingItemPropertiesTable.property_id, propertiesTable.id))
      .execute();

    // Get all item-use relationships
    const itemUses = await db.select()
      .from(naturalHealingItemUsesTable)
      .innerJoin(usesTable, eq(naturalHealingItemUsesTable.use_id, usesTable.id))
      .execute();

    // Build the result with relations
    const result: NaturalHealingItemWithRelations[] = itemsWithCategories.map(row => {
      const item = row.natural_healing_items;
      const category = row.categories;

      // Find tags for this item
      const itemTagsForThisItem = itemTags
        .filter(tagRow => tagRow.natural_healing_item_tags.item_id === item.id)
        .map(tagRow => tagRow.tags);

      // Find properties for this item
      const itemPropertiesForThisItem = itemProperties
        .filter(propertyRow => propertyRow.natural_healing_item_properties.item_id === item.id)
        .map(propertyRow => propertyRow.properties);

      // Find uses for this item
      const itemUsesForThisItem = itemUses
        .filter(useRow => useRow.natural_healing_item_uses.item_id === item.id)
        .map(useRow => useRow.uses);

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        properties: itemPropertiesForThisItem,
        uses: itemUsesForThisItem,
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