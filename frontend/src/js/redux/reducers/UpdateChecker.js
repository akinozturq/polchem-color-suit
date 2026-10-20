import { FRONT_END_VERSION } from '../../Constants';
import { globalizeSelectors } from '../Utils';

const types = {
  POLL_START: 'UPDATE_CHECKER/POLL_START',
  POLL_STOP: 'UPDATE_CHECKER/POLL_STOP',
  VERSION: 'UPDATE_CHECKER/VERSION',
  STATE: 'UPDATE_CHECKER/STATE',
  APPROVE_DOWNLOAD: 'UPDATE_CHECKER/APPROVE_DOWNLOAD',
  START_UPDATE: 'UPDATE_CHECKER/START_UPDATE',
  SW_VERSIONS: 'UPDATE_CHECKER/SW_VERSIONS',
};

const mountPath = 'update_checker'; // mount point in global state, must match root reducer

// See this
// https://hackernoon.com/my-journey-toward-a-maintainable-project-structure-for-react-redux-b05dfd999b5

const actions = {
  setSWupdateState: (state) => ({ type: types.STATE, payload: state }),
  setVersions: (state) => ({ type: types.SW_VERSIONS, payload: state }),
  startUpdateChecking: () => ({ type: types.POLL_START }),
  stopUpdateChecking: () => ({ type: types.POLL_STOP }),
  approveDownload: () => ({ type: types.APPROVE_DOWNLOAD }),
  startUpdate: () => ({ type: types.START_UPDATE }),
};

const initialState = {
  has_update: false,
  version_details: null,
  swupdate_state: null,
  sw_versions: null,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.VERSION: {
      return {
        ...state,
        version_details: action.payload,
        has_update: action.payload.front_version !== FRONT_END_VERSION,
      };
    }
    case types.STATE: {
      return {
        ...state,
        swupdate_state: action.payload,
      };
    }
    case types.SW_VERSIONS: {
      return {
        ...state,
        sw_versions: action.payload,
      };
    }
    default: {
      return state;
    }
  }
}

//export { types as actionTypes, actions as default, reducer };

const localSelectors = {
  version_details: (state) => state.version_details,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, selectors, reducer };
