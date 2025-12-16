import { getDisplayName, getMaidDisplayName, getSponsorDisplayName, getAgencyDisplayName } from '../displayName';

describe('displayName helpers', () => {
  test('getDisplayName prefers full_name', () => {
    expect(getDisplayName({ full_name: 'Jane Doe' })).toBe('Jane Doe');
  });

  test('falls back to fullName then name', () => {
    expect(getDisplayName({ fullName: 'John Smith' })).toBe('John Smith');
    expect(getDisplayName({ name: 'Acme Inc.' })).toBe('Acme Inc.');
  });

  test('builds from legacy parts', () => {
    expect(getDisplayName({ firstName: 'A', middleName: 'B', lastName: 'C' })).toBe('A B C');
    expect(getDisplayName({ firstName: 'A', lastName: 'C' })).toBe('A C');
  });

  test('fallback to Someone when nothing present', () => {
    expect(getDisplayName({})).toBe('Someone');
    expect(getDisplayName(null)).toBe('Someone');
  });

  test('fallback to email username when name not present', () => {
    expect(getDisplayName({ email: 'john.doe@example.com' })).toBe('John');
    expect(getDisplayName({ email: 'JANE@test.org' })).toBe('JANE');
  });

  test('proxy helpers delegate to getDisplayName', () => {
    expect(getMaidDisplayName({ full_name: 'Maid One' })).toBe('Maid One');
    expect(getSponsorDisplayName({ name: 'Sponsor Co' })).toBe('Sponsor Co');
    expect(getAgencyDisplayName({ agencyName: 'Agency ABC' })).toBe('Agency ABC');
  });
});

