
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  protocolsTable, 
  protocolItemsTable, 
  categoriesTable, 
  naturalHealingItemsTable 
} from '../db/schema';
import { deleteProtocol } from '../handlers/delete_protocol';
import { eq } from 'drizzle-orm';

describe('deleteProtocol', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete protocol successfully', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const protocolResult = await db.insert(protocolsTable)
      .values({
        name: 'Test Protocol',
        description: 'A protocol for testing'
      })
      .returning()
      .execute();

    const protocolId = protocolResult[0].id;

    // Verify protocol exists before deletion
    const protocolsBefore = await db.select()
      .from(protocolsTable)
      .where(eq(protocolsTable.id, protocolId))
      .execute();

    expect(protocolsBefore).toHaveLength(1);

    // Delete protocol
    await deleteProtocol(protocolId);

    // Verify protocol is deleted
    const protocolsAfter = await db.select()
      .from(protocolsTable)
      .where(eq(protocolsTable.id, protocolId))
      .execute();

    expect(protocolsAfter).toHaveLength(0);
  });

  it('should delete protocol and its item associations', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const itemResult = await db.insert(naturalHealingItemsTable)
      .values({
        name: 'Test Item',
        description: 'A test healing item',
        potential_side_effects: null,
        image_url: null,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const protocolResult = await db.insert(protocolsTable)
      .values({
        name: 'Test Protocol',
        description: 'A protocol for testing'
      })
      .returning()
      .execute();

    const protocolId = protocolResult[0].id;
    const itemId = itemResult[0].id;

    // Create protocol-item association
    await db.insert(protocolItemsTable)
      .values({
        protocol_id: protocolId,
        item_id: itemId
      })
      .execute();

    // Verify association exists before deletion
    const associationsBefore = await db.select()
      .from(protocolItemsTable)
      .where(eq(protocolItemsTable.protocol_id, protocolId))
      .execute();

    expect(associationsBefore).toHaveLength(1);

    // Delete protocol
    await deleteProtocol(protocolId);

    // Verify protocol is deleted
    const protocolsAfter = await db.select()
      .from(protocolsTable)
      .where(eq(protocolsTable.id, protocolId))
      .execute();

    expect(protocolsAfter).toHaveLength(0);

    // Verify associations are deleted
    const associationsAfter = await db.select()
      .from(protocolItemsTable)
      .where(eq(protocolItemsTable.protocol_id, protocolId))
      .execute();

    expect(associationsAfter).toHaveLength(0);

    // Verify item still exists (should not be deleted)
    const itemsAfter = await db.select()
      .from(naturalHealingItemsTable)
      .where(eq(naturalHealingItemsTable.id, itemId))
      .execute();

    expect(itemsAfter).toHaveLength(1);
  });

  it('should handle deletion of non-existent protocol gracefully', async () => {
    const nonExistentId = 99999;

    // Should not throw error when deleting non-existent protocol
    await expect(deleteProtocol(nonExistentId)).resolves.toBeUndefined();

    // Verify no protocols were affected
    const allProtocols = await db.select()
      .from(protocolsTable)
      .execute();

    expect(allProtocols).toHaveLength(0);
  });
});
