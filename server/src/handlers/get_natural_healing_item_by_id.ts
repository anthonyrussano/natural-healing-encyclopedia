import { db } from '../db';
import { 
  naturalHealingItemsTable, 
  categoriesTable, 
  tagsTable, 
  propertiesTable,
  usesTable,
  naturalHealingItemTagsTable,
  naturalHealingItemPropertiesTable,
  naturalHealingItemUsesTable
} from '../db/schema';
import { type NaturalHealingItemWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getNaturalHealingItemById = async (id: number): Promise<NaturalHealingItemWithRelations | null> => {
  try {
    // Get the item with its category
    const itemResults = await db.select()
      .from(naturalHealingItemsTable)
      .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
      .where(eq(naturalHealingItemsTable.id, id))
      .execute();

    if (itemResults.length === 0) {
      return null;
    }

    const itemData = itemResults[0];

    // Get the tags for this item
    const tagResults = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      description: tagsTable.description,
      created_at: tagsTable.created_at
    })
      .from(tagsTable)
      .innerJoin(naturalHealingItemTagsTable, eq(tagsTable.id, naturalHealingItemTagsTable.tag_id))
      .where(eq(naturalHealingItemTagsTable.item_id, id))
      .execute();

    // Get the properties for this item
    const propertyResults = await db.select({
      id: propertiesTable.id,
      name: propertiesTable.name,
      source: propertiesTable.source,
      created_at: propertiesTable.created_at
    })
      .from(propertiesTable)
      .innerJoin(naturalHealingItemPropertiesTable, eq(propertiesTable.id, naturalHealingItemPropertiesTable.property_id))
      .where(eq(naturalHealingItemPropertiesTable.item_id, id))
      .execute();

    // Get the uses for this item
    const useResults = await db.select({
      id: usesTable.id,
      name: usesTable.name,
      source: usesTable.source,
      created_at: usesTable.created_at
    })
      .from(usesTable)
      .innerJoin(naturalHealingItemUsesTable, eq(usesTable.id, naturalHealingItemUsesTable.use_id))
      .where(eq(naturalHealingItemUsesTable.item_id, id))
      .execute();

    return {
      id: itemData.natural_healing_items.id,
      name: itemData.natural_healing_items.name,
      description: itemData.natural_healing_items.description,
      properties: propertyResults,
      uses: useResults,
      potential_side_effects: itemData.natural_healing_items.potential_side_effects,
      image_url: itemData.natural_healing_items.image_url,
      category_id: itemData.natural_healing_items.category_id,
      created_at: itemData.natural_healing_items.created_at,
      updated_at: itemData.natural_healing_items.updated_at,
      category: {
        id: itemData.categories.id,
        name: itemData.categories.name,
        description: itemData.categories.description,
        created_at: itemData.categories.created_at
      },
      tags: tagResults
    };
  } catch (error) {
    console.error('Get natural healing item by ID failed:', error);
    throw error;
  }
};