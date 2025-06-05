
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    
    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Herbs',
          description: 'Natural herbs for healing'
        },
        {
          name: 'Essential Oils',
          description: 'Concentrated plant extracts'
        },
        {
          name: 'Supplements',
          description: null
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Check that all expected categories are returned
    const categoryNames = result.map(cat => cat.name);
    expect(categoryNames).toContain('Herbs');
    expect(categoryNames).toContain('Essential Oils');
    expect(categoryNames).toContain('Supplements');

    // Verify structure of returned data
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(typeof category.id).toBe('number');
      expect(typeof category.name).toBe('string');
      expect(category.created_at).toBeInstanceOf(Date);
      // description can be null or string
      expect(category.description === null || typeof category.description === 'string').toBe(true);
    });
  });

  it('should return categories with correct field types', async () => {
    // Create one category
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test description'
      })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];
    
    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(typeof category.description).toBe('string');
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.name).toBe('Test Category');
    expect(category.description).toBe('Test description');
  });
});
