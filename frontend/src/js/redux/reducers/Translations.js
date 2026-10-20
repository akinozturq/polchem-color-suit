import { globalizeSelectors } from '../Utils';
import { fulfilled, rejected } from '../factories/ApiCall';

const types = {
  SAVE_TRANSLATIONS: 'TRANSLATIONS/SAVE_TRANSLATIONS',
  LOAD_TRANSLATION_PROPOSALS: 'TRANSLATIONS/LOAD_TRANSLATION_PROPOSALS',
};

const actions = {
  saveTranslations: ({ siteid, data }) => ({
    type: types.SAVE_TRANSLATIONS,
    payload: { siteid, data },
  }),
  loadProposals: (language) => ({
    type: types.LOAD_TRANSLATION_PROPOSALS,
    payload: { language },
  }),
};

const mountPath = 'translations';

const initialState = {
  pending: false,
  error: null,
  proposals: [],
  proposals_pending: false,
  proposals_error: null,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.SAVE_TRANSLATIONS: {
      return { ...state, pending: true, error: null };
    }
    case fulfilled(types.SAVE_TRANSLATIONS): {
      return { ...state, pending: false };
    }
    case rejected(types.SAVE_TRANSLATIONS): {
      return { ...state, pending: false, error: action.payload };
    }
    case types.LOAD_TRANSLATION_PROPOSALS: {
      return {
        ...state,
        proposals_pending: true,
        proposals_error: null,
      };
    }
    case fulfilled(types.LOAD_TRANSLATION_PROPOSALS): {
      return {
        ...state,
        proposals: action.payload || [],
        proposals_pending: false,
      };
    }
    case rejected(types.LOAD_TRANSLATION_PROPOSALS): {
      return {
        ...state,
        proposals_pending: false,
        proposals_error: action.payload,
      };
    }
    default:
      return state;
  }
}

const localSelectors = {
  pending: (state) => state.pending,
  error: (state) => state.error,
  proposals: (state) => state.proposals,
  proposals_pending: (state) => state.proposals_pending,
  proposals_error: (state) => state.proposals_error,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, selectors, reducer };
