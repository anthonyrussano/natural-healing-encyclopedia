
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing'
};

const testInputWithNullDescription: CreateCategoryInput = {
  name: 'Test Category 2',
  description: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with description', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.description).toEqual('A category for testing');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category with null description', async () => {
    const result = await createCategory(testInputWithNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Test Category 2');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].description).toEqual('A category for testing');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple categories', async () => {
    const result1 = await createCategory(testInput);
    const result2 = await createCategory(testInputWithNullDescription);

    // Verify both categories exist
    const categories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(categories).toHaveLength(2);
    
    // Verify categories have different IDs
    expect(result1.id).not.toEqual(result2.id);
    
    // Verify both categories are in the database
    const categoryNames = categories.map(c => c.name);
    expect(categoryNames).toContain('Test Category');
    expect(categoryNames).toContain('Test Category 2');
  });
});
