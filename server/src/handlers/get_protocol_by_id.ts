import { db } from '../db';
import { 
  protocolsTable, 
  protocolItemsTable, 
  naturalHealingItemsTable, 
  naturalHealingItemTagsTable,
  naturalHealingItemPropertiesTable,
  naturalHealingItemUsesTable,
  categoriesTable,
  tagsTable,
  propertiesTable,
  usesTable
} from '../db/schema';
import { type ProtocolWithMetadata, type NaturalHealingItemWithRelations, type Category, type Tag, type Property, type Use } from '../schema';
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

    const itemIds = itemsQuery.map(result => result.item.id);
    let itemTagsMap: Map<number, Tag[]> = new Map();
    let itemPropertiesMap: Map<number, Property[]> = new Map();
    let itemUsesMap: Map<number, Use[]> = new Map();

    if (itemIds.length > 0) {
      // Get all tags for all items in this protocol
      const itemTagsQuery = await db.select({
        item_id: naturalHealingItemTagsTable.item_id,
        tag: tagsTable
      })
        .from(naturalHealingItemTagsTable)
        .innerJoin(tagsTable, eq(naturalHealingItemTagsTable.tag_id, tagsTable.id))
        .execute();

      // Get all properties for all items in this protocol
      const itemPropertiesQuery = await db.select({
        item_id: naturalHealingItemPropertiesTable.item_id,
        property: propertiesTable
      })
        .from(naturalHealingItemPropertiesTable)
        .innerJoin(propertiesTable, eq(naturalHealingItemPropertiesTable.property_id, propertiesTable.id))
        .execute();

      // Get all uses for all items in this protocol
      const itemUsesQuery = await db.select({
        item_id: naturalHealingItemUsesTable.item_id,
        use: usesTable
      })
        .from(naturalHealingItemUsesTable)
        .innerJoin(usesTable, eq(naturalHealingItemUsesTable.use_id, usesTable.id))
        .execute();

      // Group tags by item_id
      itemTagsQuery.forEach(result => {
        if (!itemTagsMap.has(result.item_id)) {
          itemTagsMap.set(result.item_id, []);
        }
        itemTagsMap.get(result.item_id)!.push(result.tag);
      });

      // Group properties by item_id
      itemPropertiesQuery.forEach(result => {
        if (!itemPropertiesMap.has(result.item_id)) {
          itemPropertiesMap.set(result.item_id, []);
        }
        itemPropertiesMap.get(result.item_id)!.push(result.property);
      });

      // Group uses by item_id
      itemUsesQuery.forEach(result => {
        if (!itemUsesMap.has(result.item_id)) {
          itemUsesMap.set(result.item_id, []);
        }
        itemUsesMap.get(result.item_id)!.push(result.use);
      });
    }

    // Build items with relations
    const itemsWithRelations: NaturalHealingItemWithRelations[] = itemsQuery.map(result => ({
      ...result.item,
      properties: itemPropertiesMap.get(result.item.id) || [],
      uses: itemUsesMap.get(result.item.id) || [],
      category: result.category,
      tags: itemTagsMap.get(result.item.id) || []
    }));

    // Generate aggregated metadata
    const allPropertiesMap = new Map<number, Property>();
    const allUsesMap = new Map<number, Use>();
    const allSideEffects = new Set<string>();
    const allCategories = new Map<number, Category>();
    const allTags = new Map<number, Tag>();

    itemsWithRelations.forEach(item => {
      // Collect unique properties
      item.properties.forEach(property => {
        allPropertiesMap.set(property.id, property);
      });

      // Collect unique uses
      item.uses.forEach(use => {
        allUsesMap.set(use.id, use);
      });

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
        common_properties: Array.from(allPropertiesMap.values()),
        common_uses: Array.from(allUsesMap.values()),
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