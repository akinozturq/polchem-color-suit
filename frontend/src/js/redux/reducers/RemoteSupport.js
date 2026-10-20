/*
 * action types
 */

import { fulfilled, pending } from '../factories/ApiCall';

const types = {
  OPEN_TEAMVIEWER: 'REMOTE_SUPPORT/OPEN_TEAMVIEWER',
  IS_REMOTE_SUPPORT_AVAILABLE: 'REMOTE_SUPPORT/IS_REMOTE_SUPPORT_AVAILABLE',
};

/*
 * action creators
 */

const actions = {
  openTeamViewer: () => ({ type: types.OPEN_TEAMVIEWER }),
  checkIsRemoteSupportAvailable: () => ({
    type: types.IS_REMOTE_SUPPORT_AVAILABLE,
  }),
};

const initialState = {
  is_remote_support_available: false,
  opening: false,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case pending(types.OPEN_TEAMVIEWER): {
      return { ...state, opening: true };
    }
    case fulfilled(types.OPEN_TEAMVIEWER): {
      return { ...state, opening: false };
    }
    case fulfilled(types.IS_REMOTE_SUPPORT_AVAILABLE): {
      return { ...state, is_remote_support_available: action.payload };
    }
    default: {
      return state;
    }
  }
}

export { types as actionTypes, actions as default, reducer };
