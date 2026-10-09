import { z } from 'zod';

const strongPassword = z.string()
  .min(10, 'Use at least 10 characters.')
  .max(256, 'Password must be 256 characters or fewer.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/[0-9]/, 'Include a number.');

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.').max(256),
  newPassword: strongPassword,
  confirmPassword: z.string().min(1, 'Confirm your new password.').max(256),
}).superRefine((input, context) => {
  if (input.newPassword !== input.confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'The new passwords do not match.' });
  }
  if (input.currentPassword === input.newPassword) {
    context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Choose a password different from your current password.' });
  }
});
