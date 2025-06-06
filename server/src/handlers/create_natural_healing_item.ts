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
import { eq } from 'drizzle-orm';
import { type CreateNaturalHealingItemInput, type NaturalHealingItemWithRelations } from '../schema';

export const createNaturalHealingItem = async (input: CreateNaturalHealingItemInput): Promise<NaturalHealingItemWithRelations> => {
  try {
    // Verify category exists
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (category.length === 0) {
      throw new Error(`Category with id ${input.category_id} not found`);
    }

    // Verify all tags exist if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      for (const tagId of input.tag_ids) {
        const tag = await db.select()
          .from(tagsTable)
          .where(eq(tagsTable.id, tagId))
          .execute();
        if (tag.length === 0) {
          throw new Error(`Tag with id ${tagId} not found`);
        }
      }
    }

    // Verify all properties exist if provided
    if (input.property_ids && input.property_ids.length > 0) {
      for (const propertyId of input.property_ids) {
        const property = await db.select()
          .from(propertiesTable)
          .where(eq(propertiesTable.id, propertyId))
          .execute();
        if (property.length === 0) {
          throw new Error(`Property with id ${propertyId} not found`);
        }
      }
    }

    // Verify all uses exist if provided
    if (input.use_ids && input.use_ids.length > 0) {
      for (const useId of input.use_ids) {
        const use = await db.select()
          .from(usesTable)
          .where(eq(usesTable.id, useId))
          .execute();
        if (use.length === 0) {
          throw new Error(`Use with id ${useId} not found`);
        }
      }
    }

    // Insert natural healing item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: input.name,
        description: input.description,
        potential_side_effects: input.potential_side_effects,
        image_url: input.image_url,
        category_id: input.category_id
      })
      .returning()
      .execute();

    const newItem = itemResult[0];

    // Insert tag associations if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const tagAssociations = input.tag_ids.map(tagId => ({
        item_id: newItem.id,
        tag_id: tagId
      }));

      await db.insert(naturalHealingItemTagsTable)
        .values(tagAssociations)
        .execute();
    }

    // Insert property associations if provided
    if (input.property_ids && input.property_ids.length > 0) {
      const propertyAssociations = input.property_ids.map(propertyId => ({
        item_id: newItem.id,
        property_id: propertyId
      }));

      await db.insert(naturalHealingItemPropertiesTable)
        .values(propertyAssociations)
        .execute();
    }

    // Insert use associations if provided
    if (input.use_ids && input.use_ids.length > 0) {
      const useAssociations = input.use_ids.map(useId => ({
        item_id: newItem.id,
        use_id: useId
      }));

      await db.insert(naturalHealingItemUsesTable)
        .values(useAssociations)
        .execute();
    }

    // Fetch the complete item with relations
    const result = await db.select({
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
        created_at: categoriesTable.created_at
      }
    })
      .from(naturalHealingItemsTable)
      .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
      .where(eq(naturalHealingItemsTable.id, newItem.id))
      .execute();

    const itemWithCategory = result[0];

    // Fetch associated tags
    const tagResults = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      description: tagsTable.description,
      created_at: tagsTable.created_at
    })
      .from(tagsTable)
      .innerJoin(naturalHealingItemTagsTable, eq(tagsTable.id, naturalHealingItemTagsTable.tag_id))
      .where(eq(naturalHealingItemTagsTable.item_id, newItem.id))
      .execute();

    // Fetch associated properties
    const propertyResults = await db.select({
      id: propertiesTable.id,
      name: propertiesTable.name,
      source: propertiesTable.source,
      created_at: propertiesTable.created_at
    })
      .from(propertiesTable)
      .innerJoin(naturalHealingItemPropertiesTable, eq(propertiesTable.id, naturalHealingItemPropertiesTable.property_id))
      .where(eq(naturalHealingItemPropertiesTable.item_id, newItem.id))
      .execute();

    // Fetch associated uses
    const useResults = await db.select({
      id: usesTable.id,
      name: usesTable.name,
      source: usesTable.source,
      created_at: usesTable.created_at
    })
      .from(usesTable)
      .innerJoin(naturalHealingItemUsesTable, eq(usesTable.id, naturalHealingItemUsesTable.use_id))
      .where(eq(naturalHealingItemUsesTable.item_id, newItem.id))
      .execute();

    return {
      ...itemWithCategory,
      properties: propertyResults,
      uses: useResults,
      tags: tagResults
    };
  } catch (error) {
    console.error('Natural healing item creation failed:', error);
    throw error;
  }
};