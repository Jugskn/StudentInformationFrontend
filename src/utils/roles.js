export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  REGISTRAR: 'Registrar/Staff',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
}

export function hasRole(roles = [], ...roleNames) {
  return roleNames.some((role) => roles.includes(role))
}

export function isStaff(roles = []) {
  return hasRole(roles, ROLES.ADMINISTRATOR, ROLES.REGISTRAR)
}

export function canManageCatalog(roles = []) {
  return isStaff(roles)
}

export function canViewCatalog(roles = []) {
  return isStaff(roles) || hasRole(roles, ROLES.INSTRUCTOR)
}

export function canManageStudents(roles = []) {
  return isStaff(roles)
}

export function canViewStudents(roles = []) {
  return isStaff(roles) || hasRole(roles, ROLES.INSTRUCTOR) || hasRole(roles, ROLES.STUDENT)
}

export function canManageOfferings(roles = []) {
  return isStaff(roles)
}

export function canViewOfferings(roles = []) {
  return isStaff(roles) || hasRole(roles, ROLES.INSTRUCTOR)
}

export function canManageEnrollments(roles = []) {
  return isStaff(roles)
}

export function canViewEnrollments(roles = []) {
  return isStaff(roles) || hasRole(roles, ROLES.INSTRUCTOR) || hasRole(roles, ROLES.STUDENT)
}

export function canManageGrades(roles = []) {
  return isStaff(roles) || hasRole(roles, ROLES.INSTRUCTOR)
}

export function canViewGrades(roles = []) {
  return isStaff(roles) || hasRole(roles, ROLES.INSTRUCTOR) || hasRole(roles, ROLES.STUDENT)
}

export function canViewAcademicRecords(roles = []) {
  return isStaff(roles) || hasRole(roles, ROLES.INSTRUCTOR) || hasRole(roles, ROLES.STUDENT)
}

export function primaryRoleLabel(roles = []) {
  if (hasRole(roles, ROLES.ADMINISTRATOR)) return ROLES.ADMINISTRATOR
  if (hasRole(roles, ROLES.REGISTRAR)) return ROLES.REGISTRAR
  if (hasRole(roles, ROLES.INSTRUCTOR)) return ROLES.INSTRUCTOR
  if (hasRole(roles, ROLES.STUDENT)) return ROLES.STUDENT
  return 'User'
}
