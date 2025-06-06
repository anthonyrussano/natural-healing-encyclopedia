import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreateUseInput } from '../schema';
import { createUse } from '../handlers/create_use';

const testInput: CreateUseInput = {
  name: 'Pain relief',
  source: 'Traditional medicine practices'
};

describe('createUse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a use', async () => {
    const result = await createUse(testInput);

    expect(result.name).toEqual('Pain relief');
    expect(result.source).toEqual('Traditional medicine practices');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a use without source', async () => {
    const inputWithoutSource: CreateUseInput = {
      name: 'Digestive aid',
      source: null
    };

    const result = await createUse(inputWithoutSource);

    expect(result.name).toEqual('Digestive aid');
    expect(result.source).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});