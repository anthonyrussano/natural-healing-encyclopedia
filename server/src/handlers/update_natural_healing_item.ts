
import { db } from '../db';
import { naturalHealingItemsTable, naturalHealingItemTagsTable, categoriesTable, tagsTable } from '../db/schema';
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

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.properties !== undefined) updateData.properties = input.properties;
    if (input.uses !== undefined) updateData.uses = input.uses;
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

    return {
      id: itemData.natural_healing_items.id,
      name: itemData.natural_healing_items.name,
      description: itemData.natural_healing_items.description,
      properties: itemData.natural_healing_items.properties,
      uses: itemData.natural_healing_items.uses,
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
      tags: itemTags.map(item => item.tag)
    };
  } catch (error) {
    console.error('Natural healing item update failed:', error);
    throw error;
  }
};
