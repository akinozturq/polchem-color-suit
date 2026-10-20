import { selectors } from '../redux/reducers/User.js';
import { getState } from '../redux/storeRef.js';

export const hasPrivilege = (privilege) => {
  const state = getState();
  return selectors.has_privilege(state, privilege);
};

export const hasOneofPrivileges = (privileges) => {
  const state = getState();
  return privileges.some((privilege) =>
    selectors.has_privilege(state, privilege)
  );
};
