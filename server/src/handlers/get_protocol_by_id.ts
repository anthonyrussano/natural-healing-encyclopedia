
import { db } from '../db';
import { 
  protocolsTable, 
  protocolItemsTable, 
  naturalHealingItemsTable, 
  naturalHealingItemTagsTable,
  categoriesTable,
  tagsTable 
} from '../db/schema';
import { type ProtocolWithMetadata, type NaturalHealingItemWithRelations, type Category, type Tag } from '../schema';
import { eq } from 'drizzle-orm';

export const getProtocolById = async (id: number): Promise<ProtocolWithMetadata | null> => {
  try {
    // First, get the protocol
    const protocols = await db.select()
      .from(protocolsTable)
      .where(eq(protocolsTable.id, id))
      .execute();

    if (protocols.length === 0) {
      return null;
    }

    const protocol = protocols[0];

    // Get all items for this protocol with their categories
    const itemsQuery = await db.select({
      item: naturalHealingItemsTable,
      category: categoriesTable
    })
      .from(protocolItemsTable)
      .innerJoin(naturalHealingItemsTable, eq(protocolItemsTable.item_id, naturalHealingItemsTable.id))
      .innerJoin(categoriesTable, eq(naturalHealingItemsTable.category_id, categoriesTable.id))
      .where(eq(protocolItemsTable.protocol_id, id))
      .execute();

    // Get all tags for all items in this protocol
    const itemIds = itemsQuery.map(result => result.item.id);
    let itemTagsMap: Map<number, Tag[]> = new Map();

    if (itemIds.length > 0) {
      const itemTagsQuery = await db.select({
        item_id: naturalHealingItemTagsTable.item_id,
        tag: tagsTable
      })
        .from(naturalHealingItemTagsTable)
        .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
        .execute();

      // Group tags by item_id
      itemTagsQuery.forEach(result => {
        if (!itemTagsMap.has(result.item_id)) {
          itemTagsMap.set(result.item_id, []);
        }
        itemTagsMap.get(result.item_id)!.push(result.tag);
      });
    }

    // Build items with relations
    const itemsWithRelations: NaturalHealingItemWithRelations[] = itemsQuery.map(result => ({
      ...result.item,
      category: result.category,
      tags: itemTagsMap.get(result.item.id) || []
    }));

    // Generate aggregated metadata
    const allProperties = new Set<string>();
    const allUses = new Set<string>();
    const allSideEffects = new Set<string>();
    const allCategories = new Map<number, Category>();
    const allTags = new Map<number, Tag>();

    itemsWithRelations.forEach(item => {
      // Extract properties (assume comma-separated)
      if (item.properties) {
        item.properties.split(',').forEach(prop => {
          const trimmed = prop.trim();
          if (trimmed) allProperties.add(trimmed);
        });
      }

      // Extract uses (assume comma-separated)
      if (item.uses) {
        item.uses.split(',').forEach(use => {
          const trimmed = use.trim();
          if (trimmed) allUses.add(trimmed);
        });
      }

      // Extract side effects (assume comma-separated)
      if (item.potential_side_effects) {
        item.potential_side_effects.split(',').forEach(effect => {
          const trimmed = effect.trim();
          if (trimmed) allSideEffects.add(trimmed);
        });
      }

      // Collect unique categories
      allCategories.set(item.category.id, item.category);

      // Collect unique tags
      item.tags.forEach(tag => {
        allTags.set(tag.id, tag);
      });
    });

    const protocolWithMetadata: ProtocolWithMetadata = {
      ...protocol,
      items: itemsWithRelations,
      aggregated_metadata: {
        common_properties: Array.from(allProperties),
        common_uses: Array.from(allUses),
        all_side_effects: Array.from(allSideEffects),
        categories: Array.from(allCategories.values()),
        tags: Array.from(allTags.values())
      }
    };

    return protocolWithMetadata;
  } catch (error) {
    console.error('Failed to get protocol by id:', error);
    throw error;
  }
};
