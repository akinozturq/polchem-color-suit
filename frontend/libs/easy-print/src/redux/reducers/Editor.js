// Keeps editors state that does not need to be saved with the label layout,
// for example which item is currently selected

import { globalizeSelectors } from '../Utils';

const types = {
  SELECT_ITEM: 'EDITOR/SELECT_ITEM',
  UPDATE_MOVEITEM: 'EDITOR/UPDATE_MOVEITEM',
  TOGGLE_NEW_MODAL: 'EDITOR/TOGGLE_NEW_MODAL',
};

const actions = {
  selectItem: (itemid) => ({ type: types.SELECT_ITEM, payload: itemid }),
  updateMoveItem: (item) => ({ type: types.UPDATE_MOVEITEM, payload: item }),
  toggleNewModal: (show) => ({ type: types.TOGGLE_NEW_MODAL, payload: show }),
};

const mountPath = 'editor'; // mount point in global state, must match root reducer

const initial_state = {
  selected_itemid: null,
  move: false,
  newModalOpen: false,
};

function reducer(state = initial_state, action) {
  switch (action.type) {
    case types.SELECT_ITEM: {
      if (action.payload === state.selected_itemid) {
        return state;
      }
      return { ...state, selected_itemid: action.payload, move: true };
    }
    case types.UPDATE_MOVEITEM: {
      return {
        ...state,
        move: action.payload,
      };
    }
    case types.TOGGLE_NEW_MODAL: {
      return {
        ...state,
        newModalOpen: action.payload,
      };
    }
    default:
      return state;
  }
}

const localSelectors = {
  selectedItemId: (state) => state.selected_itemid,
  move: (state) => state.move,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  //  propType,
  selectors,
  reducer,
};
