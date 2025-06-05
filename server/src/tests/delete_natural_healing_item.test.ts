
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  categoriesTable, 
  tagsTable, 
  naturalHealingItemsTable, 
  naturalHealingItemTagsTable,
  protocolsTable,
  protocolItemsTable
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteNaturalHealingItem } from '../handlers/delete_natural_healing_item';

describe('deleteNaturalHealingItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a natural healing item', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'A test item',
        properties: 'Test properties',
        uses: 'Test uses',
        potential_side_effects: 'Test side effects',
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const itemId = itemResult[0].id;

    // Delete the item
    await deleteNaturalHealingItem(itemId);

    // Verify item was deleted
    const items = await db.select()
      .from(naturalHealingItemsTable)
      .where(eq(naturalHealingItemsTable.id, itemId))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should delete related tag associations', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        description: 'A test tag'
      })
      .returning()
      .execute();

    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'A test item',
        properties: 'Test properties',
        uses: 'Test uses',
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Create tag association
    await db.insert(naturalHealingItemTagsTable)
      .values({
        item_id: itemResult[0].id,
        tag_id: tagResult[0].id
      })
      .execute();

    // Delete the item
    await deleteNaturalHealingItem(itemResult[0].id);

    // Verify tag associations were deleted
    const tagAssociations = await db.select()
      .from(naturalHealingItemTagsTable)
      .where(eq(naturalHealingItemTagsTable.item_id, itemResult[0].id))
      .execute();

    expect(tagAssociations).toHaveLength(0);
  });

  it('should delete related protocol associations', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const protocolResult = await db.insert(protocolsTable)
      .values({
        name: 'Test Protocol',
        description: 'A test protocol'
      })
      .returning()
      .execute();

    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'A test item',
        properties: 'Test properties',
        uses: 'Test uses',
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Create protocol association
    await db.insert(protocolItemsTable)
      .values({
        protocol_id: protocolResult[0].id,
        item_id: itemResult[0].id
      })
      .execute();

    // Delete the item
    await deleteNaturalHealingItem(itemResult[0].id);

    // Verify protocol associations were deleted
    const protocolAssociations = await db.select()
      .from(protocolItemsTable)
      .where(eq(protocolItemsTable.item_id, itemResult[0].id))
      .execute();

    expect(protocolAssociations).toHaveLength(0);
  });

  it('should handle deletion of non-existent item gracefully', async () => {
    const nonExistentId = 99999;

    // Should not throw an error even if item doesn't exist
    await expect(deleteNaturalHealingItem(nonExistentId)).resolves.toBeUndefined();
  });
});
