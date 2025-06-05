
import { db } from '../db';
import { protocolsTable, protocolItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteProtocol = async (id: number): Promise<void> => {
  try {
    // First delete all protocol-item associations
    await db.delete(protocolItemsTable)
      .where(eq(protocolItemsTable.protocol_id, id))
      .execute();

    // Then delete the protocol itself
    await db.delete(protocolsTable)
      .where(eq(protocolsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Protocol deletion failed:', error);
    throw error;
  }
};
