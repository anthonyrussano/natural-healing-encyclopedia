import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type CreateUseInput } from '../schema';
import { createUse } from '../handlers/create_use';
import { getUses } from '../handlers/get_uses';

describe('getUses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no uses exist', async () => {
    const result = await getUses();
    expect(result).toEqual([]);
  });

  it('should return all uses ordered by name', async () => {
    // Create test uses
    await createUse({ name: 'Wound healing', source: 'Study A' });
    await createUse({ name: 'Digestive aid', source: null });
    await createUse({ name: 'Pain relief', source: 'Study B' });

    const result = await getUses();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Digestive aid');
    expect(result[1].name).toEqual('Pain relief');
    expect(result[2].name).toEqual('Wound healing');
  });
});