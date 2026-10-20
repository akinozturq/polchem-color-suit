import { globalizeSelectors } from '../Utils';
import PropTypes from 'prop-types';

/*
 * action types
 */

const types = {
  ADD_LOCAL_USER: 'USER/ADD_LOCAL_USER',
  ADD_LOCAL_USER_PENDING: 'USER/ADD_LOCAL_USER_PENDING',
  ADD_LOCAL_USER_FULFILLED: 'USER/ADD_LOCAL_USER_FULFILLED',
  ADD_LOCAL_USER_REJECTED: 'USER/ADD_LOCAL_USER_REJECTED',

  DELETE_LOCAL_USER: 'USER/DELETE_LOCAL_USER',
  DELETE_LOCAL_USER_PENDING: 'USER/DELETE_LOCAL_USER_PENDING',
  DELETE_LOCAL_USER_FULFILLED: 'USER/DELETE_LOCAL_USER_FULFILLED',
  DELETE_LOCAL_USER_REJECTED: 'USER/DELETE_LOCAL_USER_REJECTED',

  EDIT_LOCAL_USER_GROUP: 'USER/EDIT_LOCAL_USER_GROUP',
  EDIT_LOCAL_USER_GROUP_PENDING: 'USER/EDIT_LOCAL_USER_GROUP_PENDING',
  EDIT_LOCAL_USER_GROUP_FULFILLED: 'USER/EDIT_LOCAL_USER_GROUP_FULFILLED',
  EDIT_LOCAL_USER_GROUP_REJECTED: 'USER/EDIT_LOCAL_USER_GROUP_REJECTED',

  EDIT_LOCAL_USER_PASSWORD: 'USER/EDIT_LOCAL_USER_PASSWORD',
  EDIT_LOCAL_USER_PASSWORD_PENDING: 'USER/EDIT_LOCAL_USER_PASSWORD_PENDING',
  EDIT_LOCAL_USER_PASSWORD_FULFILLED: 'USER/EDIT_LOCAL_USER_PASSWORD_FULFILLED',
  EDIT_LOCAL_USER_PASSWORD_REJECTED: 'USER/EDIT_LOCAL_USER_PASSWORD_REJECTED',

  FETCH_SITE_USERS: 'USER/FETCH_SITE_USERS',
  FETCH_SITE_USERS_PENDING: 'USER/FETCH_SITE_USERS_PENDING',
  FETCH_SITE_USERS_FULFILLED: 'USER/FETCH_SITE_USERS_FULFILLED',
  FETCH_SITE_USERS_REJECTED: 'USER/FETCH_SITE_USERS_REJECTED',

  LOGIN_USER: 'USER/LOGIN_USER',
  LOGIN_USER_PENDING: 'USER/LOGIN_USER_PENDING',
  LOGIN_USER_FULFILLED: 'USER/LOGIN_USER_FULFILLED',
  LOGIN_USER_REJECTED: 'USER/LOGIN_USER_REJECTED',
  SHOW_LOGIN_USER: 'USER/SHOW_LOGIN_USER',

  IS_STARTED_AS_ADMIN: 'USER/IS_STARTED_AS_ADMIN',
};

const mountPath = 'user'; // mount point in global state, must match root reducer

/*
 * action creators
 */

const actions = {
  addLocalUser: (user) => ({ type: types.ADD_LOCAL_USER, payload: user }),
  editLocalUserGroup: (user) => ({
    type: types.EDIT_LOCAL_USER_GROUP,
    payload: user,
  }),
  showLoginUser: () => ({
    type: types.SHOW_LOGIN_USER,
  }),
  editLocalUserPassword: (user) => ({
    type: types.EDIT_LOCAL_USER_PASSWORD,
    payload: user,
  }),
  deleteLocalUser: (id) => ({ type: types.DELETE_LOCAL_USER, payload: id }),
  fetchSiteUsers: () => ({ type: types.FETCH_SITE_USERS }),
  loginUser: (user) => ({
    type: types.LOGIN_USER,
    payload: user,
  }),
  setStartedAsAdmin: (isadmin) => ({
    type: types.IS_STARTED_AS_ADMIN,
    payload: isadmin,
  }),
};

/*
 * state shape
 */
const UserType = PropTypes.shape({
  localuserid: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired,
  posuserid: PropTypes.number,
  privileges: PropTypes.arrayOf(PropTypes.string),
  deleted: PropTypes.bool,
});

const propType = PropTypes.shape({
  users: PropTypes.arrayOf(UserType),
  current_user: UserType,
  deleted_users: PropTypes.arrayOf(UserType),
  groups: PropTypes.arrayOf(PropTypes.string),
  fetch_site_users_error: PropTypes.string,
  fetch_site_users_start: PropTypes.bool,
  add_local_user_pending: PropTypes.bool,
  add_local_user_rejected: PropTypes.string,
  delete_local_user_pending: PropTypes.bool,
  delete_local_user_rejected: PropTypes.string,
  edit_local_user_group_pending: PropTypes.bool,
  edit_local_user_group_rejected: PropTypes.string,
  edit_local_user_password_pending: PropTypes.bool,
  edit_local_user_password_rejected: PropTypes.string,
  user_login_pending: PropTypes.bool,
  user_login_rejected: PropTypes.string,
});

const initialState = {
  users: [],
  deleted_users: [],
  add_local_user_pending: false,
  add_local_user_rejected: null,
  delete_local_user_pending: false,
  delete_local_user_rejected: null,
  edit_local_user_group_pending: false,
  edit_local_user_group_rejected: null,
  edit_local_user_password_pending: false,
  edit_local_user_password_rejected: null,

  groups: [],
  fetch_site_users_error: null,
  fetch_site_users_start: false,

  current_user: { privileges: [] },
  user_login_pending: false,
  user_login_rejected: null,
  isStartedAsAdmin: null,
  show_login_user: false,
};

/*
 * reducer
 */
function reducer(state = initialState, action) {
  switch (action.type) {
    case types.SHOW_LOGIN_USER: {
      return { ...state, show_login_user: !state.show_login_user };
    }
    case types.IS_STARTED_AS_ADMIN: {
      return { ...state, isStartedAsAdmin: action.payload };
    }
    case types.ADD_LOCAL_USER_PENDING: {
      return {
        ...state,
        add_local_user_pending: action.payload,
      };
    }
    case types.ADD_LOCAL_USER_FULFILLED: {
      return {
        ...state,
        add_local_user_pending: false,
        add_local_user_rejected: null,
        users: [...state.users, action.payload],
      };
    }
    case types.ADD_LOCAL_USER_REJECTED: {
      return {
        ...state,
        add_local_user_pending: false,
        add_local_user_rejected: action.payload,
      };
    }
    case types.DELETE_LOCAL_USER_PENDING: {
      return {
        ...state,
        delete_local_user_pending: action.payload,
      };
    }
    case types.DELETE_LOCAL_USER_FULFILLED: {
      return {
        ...state,
        delete_local_user_pending: false,
        delete_local_user_rejected: null,
        users: state.users.filter((u) => u.localuserid !== action.payload),
      };
    }
    case types.DELETE_LOCAL_USER_REJECTED: {
      return {
        ...state,
        delete_local_user_pending: false,
        delete_local_user_rejected: action.payload,
      };
    }
    case types.EDIT_LOCAL_USER_GROUP_PENDING: {
      return {
        ...state,
        edit_local_user_group_pending: action.payload,
      };
    }
    case types.EDIT_LOCAL_USER_GROUP_FULFILLED: {
      return {
        ...state,
        edit_local_user_group_pending: false,
        edit_local_user_group_rejected: null,
        users: state.users.map((u) => {
          if (u.localuserid === action.payload.localuserid)
            return action.payload;
          return u;
        }),
      };
    }
    case types.EDIT_LOCAL_USER_GROUP_REJECTED: {
      return {
        ...state,
        edit_local_user_group_pending: false,
        edit_local_user_group_rejected: action.payload,
      };
    }
    case types.EDIT_LOCAL_USER_PASSWORD_PENDING: {
      return {
        ...state,
        edit_local_user_password_pending: true,
      };
    }
    case types.EDIT_LOCAL_USER_PASSWORD_FULFILLED: {
      return {
        ...state,
        edit_local_user_password_pending: false,
        edit_local_user_password_rejected: null,
      };
    }
    case types.EDIT_LOCAL_USER_PASSWORD_REJECTED: {
      return {
        ...state,
        edit_local_user_password_pending: false,
        edit_local_user_password_rejected: action.payload,
      };
    }
    case types.LOGIN_USER_PENDING: {
      return {
        ...state,
        user_login_pending: true,
        user_login_rejected: null,
      };
    }
    case types.LOGIN_USER_REJECTED: {
      return {
        ...state,
        user_login_pending: false,
        current_user: { privileges: [...state.current_user.privileges] },
        user_login_rejected: action.payload,
        show_login_user: false,
      };
    }
    case types.LOGIN_USER_FULFILLED: {
      return {
        ...state,
        user_login_pending: false,
        current_user: action.payload,
        user_login_rejected: null,
        show_login_user: false,
      };
    }
    case types.FETCH_SITE_USERS_PENDING: {
      return {
        ...state,
        fetch_site_users_start: true,
        fetch_site_users_error: null,
      };
    }
    case types.FETCH_SITE_USERS_REJECTED: {
      return {
        ...state,
        fetch_site_users_start: false,
        users: [],
        deleted_users: [],
        groups: [],
        fetch_site_users_error: action.payload,
      };
    }
    case types.FETCH_SITE_USERS_FULFILLED: {
      return {
        ...state,
        fetch_site_users_start: false,
        users: action.payload.users.filter((u) => !u.deleted),
        deleted_users: action.payload.users.filter((u) => u.deleted),
        groups: action.payload.groups,
        fetch_site_users_error: null,
      };
    }

    default: {
      return state;
    }
  }
}

/*
 * Selectors
 */
const localSelectors = {
  current_user: (state) => state.current_user,
  users: (state) => state.users,
  groups: (state) => state.groups,
  localuserid: (state) => state.current_user.localuserid,
  privileges: (state) => state.current_user.privileges,
  posuserid: (state) => state.current_user.posuserid,
  add_local_user_pending: (state) => state.add_local_user_pending,
  add_local_user_rejected: (state) => state.add_local_user_rejected,
  delete_local_user_pending: (state) => state.delete_local_user_pending,
  delete_local_user_rejected: (state) => state.delete_local_user_rejected,
  edit_local_user_password_pending: (state) =>
    state.edit_local_user_password_pending,
  edit_local_user_password_rejected: (state) =>
    state.edit_local_user_password_rejected,
  edit_local_user_group_pending: (state) => state.edit_local_user_group_pending,
  edit_local_user_group_rejected: (state) =>
    state.edit_local_user_group_rejected,
  started_as_admin: (state) => state.isStartedAsAdmin,
  has_privilege: (state, privilege) =>
    !!state.current_user?.privileges?.includes(privilege),
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};
