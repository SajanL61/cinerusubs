import { describe, expect, it } from 'vitest';
import { ROLE_PERMISSIONS } from '../src/types/auth';

describe('role permissions', () => {
  it('keeps public users outside the admin boundary', () => {
    expect(ROLE_PERMISSIONS.user).toEqual([]);
    expect(ROLE_PERMISSIONS.viewer).toContain('admin.access');
  });

  it('limits translators to content visibility and subtitle work', () => {
    expect(ROLE_PERMISSIONS.translator).toContain('subtitles.create');
    expect(ROLE_PERMISSIONS.translator).not.toContain('settings.update');
    expect(ROLE_PERMISSIONS.translator).not.toContain('users.roles');
    expect(ROLE_PERMISSIONS.translator).not.toContain('media.upload');
  });

  it('reserves role assignment for super administrators', () => {
    expect(ROLE_PERMISSIONS.super_admin).toContain('users.roles');
    expect(ROLE_PERMISSIONS.admin).not.toContain('users.roles');
    expect(ROLE_PERMISSIONS.moderator).toContain('moderation.update');
    expect(ROLE_PERMISSIONS.moderator).not.toContain('settings.update');
  });
});
