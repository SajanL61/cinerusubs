import { describe, expect, it } from 'vitest';
import { passwordChangeSchema } from '../src/lib/validation/password';

const validInput = {
  currentPassword: 'TemporaryPassword7',
  newPassword: 'PermanentPassword8',
  confirmPassword: 'PermanentPassword8',
};

describe('password change validation', () => {
  it('accepts a matching strong replacement password', () => {
    expect(passwordChangeSchema.parse(validInput)).toEqual(validInput);
  });

  it.each([
    'Short7A',
    'NineChr7A',
    'alllowercasepassword7',
    'ALLUPPERCASEPASSWORD7',
    'PasswordWithoutNumber',
  ])('rejects a weak replacement password: %s', (newPassword) => {
    expect(() => passwordChangeSchema.parse({ ...validInput, newPassword, confirmPassword: newPassword })).toThrow();
  });

  it('rejects mismatched confirmation and password reuse', () => {
    expect(() => passwordChangeSchema.parse({ ...validInput, confirmPassword: 'DifferentPassword9' })).toThrow();
    expect(() => passwordChangeSchema.parse({ ...validInput, newPassword: validInput.currentPassword, confirmPassword: validInput.currentPassword })).toThrow();
  });
});
