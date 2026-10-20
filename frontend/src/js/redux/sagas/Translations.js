import { call, put, takeLatest } from 'redux-saga/effects';
import WebRequest from './WebRequest';
import translationsAPI from 'js/api/Translations';
import errorActions from '../reducers/Errors';
import { actionTypes } from '../reducers/Translations';
import { fulfilled, rejected } from '../factories/ApiCall';
import i18n from '../../localization/i18n';
import { DEV_MODE } from '../../Constants';

function getLoadPath(siteid) {
  const prefix = siteid ? `/site/${siteid}` : '';
  return `${DEV_MODE ? '/dev_api' : ''}${prefix}/translations/{{lng}}/{{ns}}`;
}

function* saveTranslations(action) {
  const proposals = action.payload?.data || {};
  if (Object.keys(proposals).length === 0) {
    return;
  }

  try {
    const loadPath = getLoadPath(action.payload?.siteid);
    i18n.options.backend.loadPath = loadPath;
    yield call(WebRequest, translationsAPI.proposeTranslations(proposals));
    yield call(() =>
      i18n
        .reloadResources([i18n.language])
        .then(() => i18n.changeLanguage(i18n.language))
    );
    alert('Translations proposals saved');
    yield put({ type: fulfilled(action.type) });
  } catch (e) {
    yield put(errorActions.showCriticalError('Error saving translations', e));
    yield put({ type: rejected(action.type), payload: e });
  }
}

function* loadProposals(action) {
  try {
    const language = action.payload?.language;
    const { data } = yield call(
      WebRequest,
      translationsAPI.loadProposals(language)
    );
    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

export default function* saga() {
  yield takeLatest(actionTypes.SAVE_TRANSLATIONS, saveTranslations);
  yield takeLatest(actionTypes.LOAD_TRANSLATION_PROPOSALS, loadProposals);
}
