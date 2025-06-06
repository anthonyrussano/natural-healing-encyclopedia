import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreatePropertyInput } from '../schema';
import { createProperty } from '../handlers/create_property';
import { getProperties } from '../handlers/get_properties';

describe('getProperties', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no properties exist', async () => {
    const result = await getProperties();
    expect(result).toEqual([]);
  });

  it('should return all properties ordered by name', async () => {
    // Create test properties
    await createProperty({ name: 'Zinc', source: 'Study A' });
    await createProperty({ name: 'Anti-inflammatory', source: null });
    await createProperty({ name: 'Wound healing', source: 'Study B' });

    const result = await getProperties();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Anti-inflammatory');
    expect(result[1].name).toEqual('Wound healing');
    expect(result[2].name).toEqual('Zinc');
  });
});