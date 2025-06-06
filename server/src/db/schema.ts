import { serial, text, pgTable, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Properties table
export const propertiesTable = pgTable('properties', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  source: text('source'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Uses table
export const usesTable = pgTable('uses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  source: text('source'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Natural healing items table (removed properties and uses text fields)
export const naturalHealingItemsTable = pgTable('natural_healing_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  potential_side_effects: text('potential_side_effects'),
  image_url: text('image_url'),
  category_id: integer('category_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table for natural healing items and tags (many-to-many)
export const naturalHealingItemTagsTable = pgTable('natural_healing_item_tags', {
  item_id: integer('item_id').notNull(),
  tag_id: integer('tag_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.item_id, table.tag_id] })
}));

// Junction table for natural healing items and properties (many-to-many)
export const naturalHealingItemPropertiesTable = pgTable('natural_healing_item_properties', {
  item_id: integer('item_id').notNull(),
  property_id: integer('property_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.item_id, table.property_id] })
}));

// Junction table for natural healing items and uses (many-to-many)
export const naturalHealingItemUsesTable = pgTable('natural_healing_item_uses', {
  item_id: integer('item_id').notNull(),
  use_id: integer('use_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.item_id, table.use_id] })
}));

// Protocols table
export const protocolsTable = pgTable('protocols', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table for protocols and natural healing items (many-to-many)
export const protocolItemsTable = pgTable('protocol_items', {
  protocol_id: integer('protocol_id').notNull(),
  item_id: integer('item_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.protocol_id, table.item_id] })
}));

// Relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  items: many(naturalHealingItemsTable),
}));

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  itemTags: many(naturalHealingItemTagsTable),
}));

export const propertiesRelations = relations(propertiesTable, ({ many }) => ({
  itemProperties: many(naturalHealingItemPropertiesTable),
}));

export const usesRelations = relations(usesTable, ({ many }) => ({
  itemUses: many(naturalHealingItemUsesTable),
}));

export const naturalHealingItemsRelations = relations(naturalHealingItemsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [naturalHealingItemsTable.category_id],
    references: [categoriesTable.id],
  }),
  itemTags: many(naturalHealingItemTagsTable),
  itemProperties: many(naturalHealingItemPropertiesTable),
  itemUses: many(naturalHealingItemUsesTable),
  protocolItems: many(protocolItemsTable),
}));

export const naturalHealingItemTagsRelations = relations(naturalHealingItemTagsTable, ({ one }) => ({
  item: one(naturalHealingItemsTable, {
    fields: [naturalHealingItemTagsTable.item_id],
    references: [naturalHealingItemsTable.id],
  }),
  tag: one(tagsTable, {
    fields: [naturalHealingItemTagsTable.tag_id],
    references: [tagsTable.id],
  }),
}));

export const naturalHealingItemPropertiesRelations = relations(naturalHealingItemPropertiesTable, ({ one }) => ({
  item: one(naturalHealingItemsTable, {
    fields: [naturalHealingItemPropertiesTable.item_id],
    references: [naturalHealingItemsTable.id],
  }),
  property: one(propertiesTable, {
    fields: [naturalHealingItemPropertiesTable.property_id],
    references: [propertiesTable.id],
  }),
}));

export const naturalHealingItemUsesRelations = relations(naturalHealingItemUsesTable, ({ one }) => ({
  item: one(naturalHealingItemsTable, {
    fields: [naturalHealingItemUsesTable.item_id],
    references: [naturalHealingItemsTable.id],
  }),
  use: one(usesTable, {
    fields: [naturalHealingItemUsesTable.use_id],
    references: [usesTable.id],
  }),
}));

export const protocolsRelations = relations(protocolsTable, ({ many }) => ({
  protocolItems: many(protocolItemsTable),
}));

export const protocolItemsRelations = relations(protocolItemsTable, ({ one }) => ({
  protocol: one(protocolsTable, {
    fields: [protocolItemsTable.protocol_id],
    references: [protocolsTable.id],
  }),
  item: one(naturalHealingItemsTable, {
    fields: [protocolItemsTable.item_id],
    references: [naturalHealingItemsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  categories: categoriesTable,
  tags: tagsTable,
  properties: propertiesTable,
  uses: usesTable,
  naturalHealingItems: naturalHealingItemsTable,
  naturalHealingItemTags: naturalHealingItemTagsTable,
  naturalHealingItemProperties: naturalHealingItemPropertiesTable,  
  naturalHealingItemUses: naturalHealingItemUsesTable,
  protocols: protocolsTable,
  protocolItems: protocolItemsTable,
};