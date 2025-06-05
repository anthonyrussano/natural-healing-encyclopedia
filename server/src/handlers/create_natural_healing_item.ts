
import { db } from '../db';
import { naturalHealingItemsTable, naturalHealingItemTagsTable, categoriesTable, tagsTable } from '../db/schema';
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
      const existingTags = await db.select()
        .from(tagsTable)
        .where(eq(tagsTable.id, input.tag_ids[0])) // Start with first tag
        .execute();

      // Check all tag IDs exist
      const foundTagIds = new Set();
      for (const tagId of input.tag_ids) {
        const tag = await db.select()
          .from(tagsTable)
          .where(eq(tagsTable.id, tagId))
          .execute();
        if (tag.length === 0) {
          throw new Error(`Tag with id ${tagId} not found`);
        }
        foundTagIds.add(tagId);
      }
    }

    // Insert natural healing item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: input.name,
        description: input.description,
        properties: input.properties,
        uses: input.uses,
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

    // Fetch the complete item with relations
    const result = await db.select({
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

    return {
      ...itemWithCategory,
      tags: tagResults
    };
  } catch (error) {
    console.error('Natural healing item creation failed:', error);
    throw error;
  }
};
