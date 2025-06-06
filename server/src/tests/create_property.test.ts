import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreatePropertyInput } from '../schema';
import { createProperty } from '../handlers/create_property';

const testInput: CreatePropertyInput = {
  name: 'Anti-inflammatory',
  source: 'Clinical research study 2023'
};

describe('createProperty', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a property', async () => {
    const result = await createProperty(testInput);

    expect(result.name).toEqual('Anti-inflammatory');
    expect(result.source).toEqual('Clinical research study 2023');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a property without source', async () => {
    const inputWithoutSource: CreatePropertyInput = {
      name: 'Antibacterial',
      source: null
    };

    const result = await createProperty(inputWithoutSource);

    expect(result.name).toEqual('Antibacterial');
    expect(result.source).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});