// Demo role model. Access is enforced in code (can/assertCan), not just hidden UI.
export const ROLE = Object.freeze({ USER: "user", ADMIN: "admin" });

const PERMISSIONS = Object.freeze({
  [ROLE.USER]: ["wallet:connect", "payments:view"],
  [ROLE.ADMIN]: ["merchant:onboard", "merchant:view", "payments:view", "payment:simulate"],
});

export function can(role, permission) {
  return (PERMISSIONS[role] || []).includes(permission);
}

export function assertCan(role, permission) {
  if (!can(role, permission)) {
    throw new Error(`Role "${role}" is not allowed to ${permission}`);
  }
}

export function permissionsFor(role) {
  return [...(PERMISSIONS[role] || [])];
}
