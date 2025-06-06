
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  naturalHealingItemsTable,
  naturalHealingItemTagsTable,
  protocolItemsTable
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteNaturalHealingItem } from '../handlers/delete_natural_healing_item';
import { createCategory } from '../handlers/create_category';
import { createTag } from '../handlers/create_tag';
import { createProtocol } from '../handlers/create_protocol';
import { createNaturalHealingItem } from '../handlers/create_natural_healing_item';

describe('deleteNaturalHealingItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a natural healing item', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Test Category', description: 'A test category' });

    const item = await createNaturalHealingItem({
      name: 'Test Item',
      description: 'A test item',
      potential_side_effects: 'Test side effects',
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: []
    });

    // Delete the item
    await deleteNaturalHealingItem(item.id);

    // Verify item was deleted by trying to get it (this should throw or return null depending on implementation)
    // Since we don't have a get handler, we'll test via the database directly
    const items = await db.select()
      .from(naturalHealingItemsTable)
      .where(eq(naturalHealingItemsTable.id, item.id))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should delete related tag associations', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Test Category', description: 'A test category' });
    const tag = await createTag({ name: 'Test Tag', description: 'A test tag' });

    const item = await createNaturalHealingItem({
      name: 'Test Item',
      description: 'A test item',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: [tag.id]
    });

    // Delete the item
    await deleteNaturalHealingItem(item.id);

    // Verify tag associations were deleted
    const tagAssociations = await db.select()
      .from(naturalHealingItemTagsTable)
      .where(eq(naturalHealingItemTagsTable.item_id, item.id))
      .execute();

    expect(tagAssociations).toHaveLength(0);
  });

  it('should delete related protocol associations', async () => {
    // Create prerequisite data using handlers
    const category = await createCategory({ name: 'Test Category', description: 'A test category' });

    const item = await createNaturalHealingItem({
      name: 'Test Item',
      description: 'A test item',
      potential_side_effects: null,
      image_url: null,
      category_id: category.id,
      property_ids: [],
      use_ids: [],
      tag_ids: []
    });

    const protocol = await createProtocol({
      name: 'Test Protocol',
      description: 'A test protocol',
      item_ids: [item.id]
    });

    // Delete the item
    await deleteNaturalHealingItem(item.id);

    // Verify protocol associations were deleted
    const protocolAssociations = await db.select()
      .from(protocolItemsTable)
      .where(eq(protocolItemsTable.item_id, item.id))
      .execute();

    expect(protocolAssociations).toHaveLength(0);
  });

  it('should handle deletion of non-existent item gracefully', async () => {
    const nonExistentId = 99999;

    // Should not throw an error even if item doesn't exist
    await expect(deleteNaturalHealingItem(nonExistentId)).resolves.toBeUndefined();
  });
});
