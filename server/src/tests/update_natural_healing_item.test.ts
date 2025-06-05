
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, naturalHealingItemsTable, naturalHealingItemTagsTable } from '../db/schema';
import { type UpdateNaturalHealingItemInput, type CreateCategoryInput, type CreateTagInput } from '../schema';
import { updateNaturalHealingItem } from '../handlers/update_natural_healing_item';
import { eq } from 'drizzle-orm';

describe('updateNaturalHealingItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic natural healing item fields', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Original Item',
        description: 'Original description',
        properties: 'Original properties',
        uses: 'Original uses',
        potential_side_effects: 'Original side effects',
        image_url: 'https://example.com/original.jpg',
        category_id: category.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    const updateInput: UpdateNaturalHealingItemInput = {
      id: item.id,
      name: 'Updated Item',
      description: 'Updated description',
      properties: 'Updated properties',
      uses: 'Updated uses',
      potential_side_effects: 'Updated side effects',
      image_url: 'https://example.com/updated.jpg'
    };

    const result = await updateNaturalHealingItem(updateInput);

    expect(result.id).toEqual(item.id);
    expect(result.name).toEqual('Updated Item');
    expect(result.description).toEqual('Updated description');
    expect(result.properties).toEqual('Updated properties');
    expect(result.uses).toEqual('Updated uses');
    expect(result.potential_side_effects).toEqual('Updated side effects');
    expect(result.image_url).toEqual('https://example.com/updated.jpg');
    expect(result.category_id).toEqual(category.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > item.updated_at).toBe(true);
  });

  it('should update category_id', async () => {
    // Create test categories
    const category1Result = await db.insert(categoriesTable)
      .values({
        name: 'Category 1',
        description: 'First category'
      })
      .returning()
      .execute();
    const category1 = category1Result[0];

    const category2Result = await db.insert(categoriesTable)
      .values({
        name: 'Category 2',
        description: 'Second category'
      })
      .returning()
      .execute();
    const category2 = category2Result[0];

    // Create test item with first category
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'Test description',
        properties: 'Test properties',
        uses: 'Test uses',
        category_id: category1.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    const updateInput: UpdateNaturalHealingItemInput = {
      id: item.id,
      category_id: category2.id
    };

    const result = await updateNaturalHealingItem(updateInput);

    expect(result.category_id).toEqual(category2.id);
    expect(result.category.id).toEqual(category2.id);
    expect(result.category.name).toEqual('Category 2');
  });

  it('should update tag associations', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        name: 'Tag 1',
        description: 'First tag'
      })
      .returning()
      .execute();
    const tag1 = tag1Result[0];

    const tag2Result = await db.insert(tagsTable)
      .values({
        name: 'Tag 2',
        description: 'Second tag'
      })
      .returning()
      .execute();
    const tag2 = tag2Result[0];

    const tag3Result = await db.insert(tagsTable)
      .values({
        name: 'Tag 3',
        description: 'Third tag'
      })
      .returning()
      .execute();
    const tag3 = tag3Result[0];

    // Create test item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'Test description',
        properties: 'Test properties',
        uses: 'Test uses',
        category_id: category.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    // Add initial tags
    await db.insert(naturalHealingItemTagsTable)
      .values([
        { item_id: item.id, tag_id: tag1.id },
        { item_id: item.id, tag_id: tag2.id }
      ])
      .execute();

    // Update with different tags
    const updateInput: UpdateNaturalHealingItemInput = {
      id: item.id,
      tag_ids: [tag2.id, tag3.id]
    };

    const result = await updateNaturalHealingItem(updateInput);

    expect(result.tags).toHaveLength(2);
    const tagIds = result.tags.map(tag => tag.id);
    expect(tagIds).toContain(tag2.id);
    expect(tagIds).toContain(tag3.id);
    expect(tagIds).not.toContain(tag1.id);
  });

  it('should clear all tags when empty array provided', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        description: 'A tag for testing'
      })
      .returning()
      .execute();
    const tag = tagResult[0];

    // Create test item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'Test description',
        properties: 'Test properties',
        uses: 'Test uses',
        category_id: category.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    // Add initial tag
    await db.insert(naturalHealingItemTagsTable)
      .values({ item_id: item.id, tag_id: tag.id })
      .execute();

    // Update with empty tag array
    const updateInput: UpdateNaturalHealingItemInput = {
      id: item.id,
      tag_ids: []
    };

    const result = await updateNaturalHealingItem(updateInput);

    expect(result.tags).toHaveLength(0);
  });

  it('should throw error for non-existent item', async () => {
    const updateInput: UpdateNaturalHealingItemInput = {
      id: 999,
      name: 'Updated Item'
    };

    await expect(updateNaturalHealingItem(updateInput)).rejects.toThrow(/item with id 999 not found/i);
  });

  it('should throw error for non-existent category', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'Test description',
        properties: 'Test properties',
        uses: 'Test uses',
        category_id: category.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    const updateInput: UpdateNaturalHealingItemInput = {
      id: item.id,
      category_id: 999
    };

    await expect(updateNaturalHealingItem(updateInput)).rejects.toThrow(/category with id 999 not found/i);
  });

  it('should throw error for non-existent tag', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'Test description',
        properties: 'Test properties',
        uses: 'Test uses',
        category_id: category.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    const updateInput: UpdateNaturalHealingItemInput = {
      id: item.id,
      tag_ids: [999]
    };

    await expect(updateNaturalHealingItem(updateInput)).rejects.toThrow(/tag with id 999 not found/i);
  });

  it('should update only provided fields, leaving others unchanged', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test item
    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Original Item',
        description: 'Original description',
        properties: 'Original properties',
        uses: 'Original uses',
        potential_side_effects: 'Original side effects',
        image_url: 'https://example.com/original.jpg',
        category_id: category.id
      })
      .returning()
      .execute();
    const item = itemResult[0];

    // Update only name and description
    const updateInput: UpdateNaturalHealingItemInput = {
      id: item.id,
      name: 'Updated Item',
      description: 'Updated description'
    };

    const result = await updateNaturalHealingItem(updateInput);

    expect(result.name).toEqual('Updated Item');
    expect(result.description).toEqual('Updated description');
    expect(result.properties).toEqual('Original properties');
    expect(result.uses).toEqual('Original uses');
    expect(result.potential_side_effects).toEqual('Original side effects');
    expect(result.image_url).toEqual('https://example.com/original.jpg');
  });
});
