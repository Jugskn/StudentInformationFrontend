import { describe, expect, it } from 'vitest'
import {
  canManageCatalog,
  canManageStudents,
  canViewCatalog,
  canViewGrades,
  hasRole,
  isStaff,
  primaryRoleLabel,
  ROLES,
} from './roles'

describe('roles helpers', () => {
  it('detects staff roles', () => {
    expect(isStaff([ROLES.ADMINISTRATOR])).toBe(true)
    expect(isStaff([ROLES.REGISTRAR])).toBe(true)
    expect(isStaff([ROLES.INSTRUCTOR])).toBe(false)
    expect(isStaff([ROLES.STUDENT])).toBe(false)
  })

  it('supports catalog and student permissions', () => {
    expect(canManageCatalog([ROLES.REGISTRAR])).toBe(true)
    expect(canViewCatalog([ROLES.INSTRUCTOR])).toBe(true)
    expect(canViewCatalog([ROLES.STUDENT])).toBe(false)
    expect(canManageStudents([ROLES.ADMINISTRATOR])).toBe(true)
    expect(canManageStudents([ROLES.STUDENT])).toBe(false)
  })

  it('allows grade viewing for instructors and students', () => {
    expect(canViewGrades([ROLES.INSTRUCTOR])).toBe(true)
    expect(canViewGrades([ROLES.STUDENT])).toBe(true)
    expect(hasRole([ROLES.STUDENT], ROLES.STUDENT)).toBe(true)
  })

  it('returns primary role label', () => {
    expect(primaryRoleLabel([ROLES.STUDENT, ROLES.INSTRUCTOR])).toBe(ROLES.INSTRUCTOR)
    expect(primaryRoleLabel([ROLES.ADMINISTRATOR])).toBe(ROLES.ADMINISTRATOR)
  })
})
