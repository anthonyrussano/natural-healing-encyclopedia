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
import { type UpdateNaturalHealingItemInput, type NaturalHealingItemWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNaturalHealingItem = async (input: UpdateNaturalHealingItemInput): Promise<NaturalHealingItemWithRelations> => {
  try {
    // First check if the item exists
    const existingItem = await db.select()
      .from(naturalHealingItemsTable)
      .where(eq(naturalHealingItemsTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Natural healing item with id ${input.id} not found`);
    }

    // If category_id is being updated, validate it exists
    if (input.category_id !== undefined) {
      const category = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (category.length === 0) {
        throw new Error(`Category with id ${input.category_id} not found`);
      }
    }

    // If tag_ids are being updated, validate they exist
    if (input.tag_ids !== undefined) {
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

    // If property_ids are being updated, validate they exist
    if (input.property_ids !== undefined) {
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

    // If use_ids are being updated, validate they exist
    if (input.use_ids !== undefined) {
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

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.potential_side_effects !== undefined) updateData.potential_side_effects = input.potential_side_effects;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    if (input.category_id !== undefined) updateData.category_id = input.category_id;

    // Update the natural healing item
    const result = await db.update(naturalHealingItemsTable)
      .set(updateData)
      .where(eq(naturalHealingItemsTable.id, input.id))
      .returning()
      .execute();

    const updatedItem = result[0];

    // Handle tag updates if provided
    if (input.tag_ids !== undefined) {
      // Delete existing tag associations
      await db.delete(naturalHealingItemTagsTable)
        .where(eq(naturalHealingItemTagsTable.item_id, input.id))
        .execute();

      // Insert new tag associations
      if (input.tag_ids.length > 0) {
        await db.insert(naturalHealingItemTagsTable)
          .values(input.tag_ids.map(tagId => ({
            item_id: input.id,
            tag_id: tagId
          })))
          .execute();
      }
    }

    // Handle property updates if provided
    if (input.property_ids !== undefined) {
      // Delete existing property associations
      await db.delete(naturalHealingItemPropertiesTable)
        .where(eq(naturalHealingItemPropertiesTable.item_id, input.id))
        .execute();

      // Insert new property associations
      if (input.property_ids.length > 0) {
        await db.insert(naturalHealingItemPropertiesTable)
          .values(input.property_ids.map(propertyId => ({
            item_id: input.id,
            property_id: propertyId
          })))
          .execute();
      }
    }

    // Handle use updates if provided
    if (input.use_ids !== undefined) {
      // Delete existing use associations
      await db.delete(naturalHealingItemUsesTable)
        .where(eq(naturalHealingItemUsesTable.item_id, input.id))
        .execute();

      // Insert new use associations
      if (input.use_ids.length > 0) {
        await db.insert(naturalHealingItemUsesTable)
          .values(input.use_ids.map(useId => ({
            item_id: input.id,
            use_id: useId
          })))
          .execute();
      }
    }

    // Fetch the complete item with relations
    const itemWithCategory = await db.select()
      .from(naturalHealingItemsTable)
      .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
      .where(eq(naturalHealingItemsTable.id, input.id))
      .execute();

    const itemData = itemWithCategory[0];

    // Fetch associated tags
    const itemTags = await db.select({
      tag: {
        id: tagsTable.id,
        name: tagsTable.name,
        description: tagsTable.description,
        created_at: tagsTable.created_at
      }
    })
      .from(naturalHealingItemTagsTable)
      .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
      .where(eq(naturalHealingItemTagsTable.item_id, input.id))
      .execute();

    // Fetch associated properties
    const itemProperties = await db.select({
      property: {
        id: propertiesTable.id,
        name: propertiesTable.name,
        source: propertiesTable.source,
        created_at: propertiesTable.created_at
      }
    })
      .from(naturalHealingItemPropertiesTable)
      .innerJoin(propertiesTable, eq(naturalHealingItemPropertiesTable.property_id, propertiesTable.id))
      .where(eq(naturalHealingItemPropertiesTable.item_id, input.id))
      .execute();

    // Fetch associated uses
    const itemUses = await db.select({
      use: {
        id: usesTable.id,
        name: usesTable.name,
        source: usesTable.source,
        created_at: usesTable.created_at
      }
    })
      .from(naturalHealingItemUsesTable)
      .innerJoin(usesTable, eq(naturalHealingItemUsesTable.use_id, usesTable.id))
      .where(eq(naturalHealingItemUsesTable.item_id, input.id))
      .execute();

    return {
      id: itemData.natural_healing_items.id,
      name: itemData.natural_healing_items.name,
      description: itemData.natural_healing_items.description,
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
      properties: itemProperties.map(item => item.property),
      uses: itemUses.map(item => item.use),
      tags: itemTags.map(item => item.tag)
    };
  } catch (error) {
    console.error('Natural healing item update failed:', error);
    throw error;
  }
};