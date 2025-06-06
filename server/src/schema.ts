import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

export const createTagInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const updateTagInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

// Property schema
export const propertySchema = z.object({
  id: z.number(),
  name: z.string(),
  source: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Property = z.infer<typeof propertySchema>;

export const createPropertyInputSchema = z.object({
  name: z.string().min(1),
  source: z.string().nullable()
});

export type CreatePropertyInput = z.infer<typeof createPropertyInputSchema>;

export const updatePropertyInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  source: z.string().nullable().optional()
});

export type UpdatePropertyInput = z.infer<typeof updatePropertyInputSchema>;

// Use schema
export const useSchema = z.object({
  id: z.number(),
  name: z.string(),
  source: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Use = z.infer<typeof useSchema>;

export const createUseInputSchema = z.object({
  name: z.string().min(1),
  source: z.string().nullable()
});

export type CreateUseInput = z.infer<typeof createUseInputSchema>;

export const updateUseInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  source: z.string().nullable().optional()
});

export type UpdateUseInput = z.infer<typeof updateUseInputSchema>;

// Natural healing item schema (updated with new structure)
export const naturalHealingItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  properties: z.array(propertySchema),
  uses: z.array(useSchema),
  potential_side_effects: z.string().nullable(),
  image_url: z.string().nullable(),
  category_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type NaturalHealingItem = z.infer<typeof naturalHealingItemSchema>;

export const createNaturalHealingItemInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  potential_side_effects: z.string().nullable(),
  image_url: z.string().url().nullable(),
  category_id: z.number(),
  tag_ids: z.array(z.number()).optional(),
  property_ids: z.array(z.number()).optional(),
  use_ids: z.array(z.number()).optional()
});

export type CreateNaturalHealingItemInput = z.infer<typeof createNaturalHealingItemInputSchema>;

export const updateNaturalHealingItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  potential_side_effects: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  category_id: z.number().optional(),
  tag_ids: z.array(z.number()).optional(),
  property_ids: z.array(z.number()).optional(),
  use_ids: z.array(z.number()).optional()
});

export type UpdateNaturalHealingItemInput = z.infer<typeof updateNaturalHealingItemInputSchema>;

// Protocol schema
export const protocolSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Protocol = z.infer<typeof protocolSchema>;

export const createProtocolInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  item_ids: z.array(z.number()).optional()
});

export type CreateProtocolInput = z.infer<typeof createProtocolInputSchema>;

export const updateProtocolInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  item_ids: z.array(z.number()).optional()
});

export type UpdateProtocolInput = z.infer<typeof updateProtocolInputSchema>;

// Enhanced schemas with relations
export const naturalHealingItemWithRelationsSchema = naturalHealingItemSchema.extend({
  category: categorySchema,
  tags: z.array(tagSchema)
});

export type NaturalHealingItemWithRelations = z.infer<typeof naturalHealingItemWithRelationsSchema>;

export const protocolWithItemsSchema = protocolSchema.extend({
  items: z.array(naturalHealingItemWithRelationsSchema)
});

export type ProtocolWithItems = z.infer<typeof protocolWithItemsSchema>;

// Aggregated metadata schema for protocols (updated with new structure)
export const protocolAggregatedMetadataSchema = z.object({
  common_properties: z.array(propertySchema),
  common_uses: z.array(useSchema),
  all_side_effects: z.array(z.string()),
  categories: z.array(categorySchema),
  tags: z.array(tagSchema)
});

export type ProtocolAggregatedMetadata = z.infer<typeof protocolAggregatedMetadataSchema>;

export const protocolWithMetadataSchema = protocolWithItemsSchema.extend({
  aggregated_metadata: protocolAggregatedMetadataSchema
});

export type ProtocolWithMetadata = z.infer<typeof protocolWithMetadataSchema>;