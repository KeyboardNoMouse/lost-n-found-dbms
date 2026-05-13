import { describe, it, expect } from 'vitest';
import { validateItemInput, validateClaimInput } from '../lib/validation';

const BASE_ITEM = {
  title: 'Blue Backpack',
  description: 'Navy blue JanSport backpack with a broken zipper',
  type: 'lost',
  category: 'Other',
  location: 'Library',
  date: new Date(Date.now() - 60_000).toISOString(), // 1 min ago
  phone: '',
};

describe('validateItemInput', () => {
  it('passes for valid input', () => {
    expect(validateItemInput(BASE_ITEM)).toHaveLength(0);
  });

  it('requires title', () => {
    const errs = validateItemInput({ ...BASE_ITEM, title: '' });
    expect(errs.some((e) => e.field === 'title')).toBe(true);
  });

  it('rejects title over 100 chars', () => {
    const errs = validateItemInput({ ...BASE_ITEM, title: 'x'.repeat(101) });
    expect(errs.some((e) => e.field === 'title')).toBe(true);
  });

  it('requires description', () => {
    const errs = validateItemInput({ ...BASE_ITEM, description: '' });
    expect(errs.some((e) => e.field === 'description')).toBe(true);
  });

  it('rejects unknown type', () => {
    const errs = validateItemInput({ ...BASE_ITEM, type: 'stolen' });
    expect(errs.some((e) => e.field === 'type')).toBe(true);
  });

  it('rejects invalid category', () => {
    const errs = validateItemInput({ ...BASE_ITEM, category: 'Food' });
    expect(errs.some((e) => e.field === 'category')).toBe(true);
  });

  it('rejects unknown campus location', () => {
    const errs = validateItemInput({ ...BASE_ITEM, location: 'Random Street' });
    expect(errs.some((e) => e.field === 'location')).toBe(true);
  });

  it('accepts valid campus location', () => {
    const errs = validateItemInput({ ...BASE_ITEM, location: 'Main Block' });
    expect(errs.some((e) => e.field === 'location')).toBe(false);
  });

  it('rejects future date', () => {
    const errs = validateItemInput({ ...BASE_ITEM, date: new Date(Date.now() + 86_400_000).toISOString() });
    expect(errs.some((e) => e.field === 'date')).toBe(true);
  });

  it('rejects invalid phone format', () => {
    const errs = validateItemInput({ ...BASE_ITEM, phone: 'notaphone!!' });
    expect(errs.some((e) => e.field === 'phone')).toBe(true);
  });

  it('accepts valid Indian phone number', () => {
    const errs = validateItemInput({ ...BASE_ITEM, phone: '+91 9876543210' });
    expect(errs.some((e) => e.field === 'phone')).toBe(false);
  });
});

describe('validateClaimInput', () => {
  it('passes for valid message', () => {
    expect(validateClaimInput({ message: 'This is my backpack, I can describe it.' })).toHaveLength(0);
  });

  it('requires message', () => {
    const errs = validateClaimInput({ message: '' });
    expect(errs.some((e) => e.field === 'message')).toBe(true);
  });

  it('rejects message over 500 chars', () => {
    const errs = validateClaimInput({ message: 'x'.repeat(501) });
    expect(errs.some((e) => e.field === 'message')).toBe(true);
  });
});
