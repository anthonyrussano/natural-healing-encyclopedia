
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

// Natural healing items table
export const naturalHealingItemsTable = pgTable('natural_healing_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  properties: text('properties').notNull(),
  uses: text('uses').notNull(),
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

export const naturalHealingItemsRelations = relations(naturalHealingItemsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [naturalHealingItemsTable.category_id],
    references: [categoriesTable.id],
  }),
  itemTags: many(naturalHealingItemTagsTable),
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
  naturalHealingItems: naturalHealingItemsTable,
  naturalHealingItemTags: naturalHealingItemTagsTable,
  protocols: protocolsTable,
  protocolItems: protocolItemsTable,
};
