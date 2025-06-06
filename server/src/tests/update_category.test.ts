import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreateCategoryInput, type UpdateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { updateCategory } from '../handlers/update_category';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name and description', async () => {
    const createInput: CreateCategoryInput = {
      name: 'Original Name',
      description: 'Original description'
    };

    const originalCategory = await createCategory(createInput);

    const updateInput: UpdateCategoryInput = {
      id: originalCategory.id,
      name: 'Updated Name',
      description: 'Updated description'
    };

    const result = await updateCategory(updateInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Updated description');
    expect(result.id).toEqual(originalCategory.id);
    expect(result.created_at).toEqual(originalCategory.created_at);
  });

  it('should partially update category', async () => {
    const createInput: CreateCategoryInput = {
      name: 'Original Name',
      description: 'Original description'
    };

    const originalCategory = await createCategory(createInput);

    const updateInput: UpdateCategoryInput = {
      id: originalCategory.id,
      name: 'Updated Name Only'
    };

    const result = await updateCategory(updateInput);

    expect(result.name).toEqual('Updated Name Only');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
  });

  it('should throw error for non-existent category', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 999,
      name: 'Updated Name'
    };

    expect(updateCategory(updateInput)).rejects.toThrow(/Category not found/);
  });
});