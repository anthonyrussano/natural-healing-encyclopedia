import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreatePropertyInput, type UpdatePropertyInput } from '../schema';
import { createProperty } from '../handlers/create_property';
import { updateProperty } from '../handlers/update_property';

describe('updateProperty', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update property name and source', async () => {
    const createInput: CreatePropertyInput = {
      name: 'Original Property',
      source: 'Original source'
    };

    const originalProperty = await createProperty(createInput);

    const updateInput: UpdatePropertyInput = {
      id: originalProperty.id,
      name: 'Updated Property',
      source: 'Updated source'
    };

    const result = await updateProperty(updateInput);

    expect(result.name).toEqual('Updated Property');
    expect(result.source).toEqual('Updated source');
    expect(result.id).toEqual(originalProperty.id);
    expect(result.created_at).toEqual(originalProperty.created_at);
  });

  it('should partially update property', async () => {
    const createInput: CreatePropertyInput = {
      name: 'Original Property',
      source: 'Original source'
    };

    const originalProperty = await createProperty(createInput);

    const updateInput: UpdatePropertyInput = {
      id: originalProperty.id,
      name: 'Updated Property Only'
    };

    const result = await updateProperty(updateInput);

    expect(result.name).toEqual('Updated Property Only');
    expect(result.source).toEqual('Original source'); // Should remain unchanged
  });

  it('should throw error for non-existent property', async () => {
    const updateInput: UpdatePropertyInput = {
      id: 999,
      name: 'Updated Property'
    };

    expect(updateProperty(updateInput)).rejects.toThrow(/Property not found/);
  });
});