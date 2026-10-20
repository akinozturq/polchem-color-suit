import { call, put, select, takeLatest } from 'redux-saga/effects';
import emailActions, { actionTypes } from '../reducers/Email';

import EmailAPI from '../../api/Email';
import {
  selectors as configSelectors,
  actionTypes as configActionTypes,
} from 'js/redux/reducers/Configuration';
import { selectors as orderSelectors } from '../reducers/Order';
import { actionTypes as printTaskActionTypes } from '../reducers/PrintTask';
import { MailTemplateToHtml } from 'easy-mail';
import EPValues from '../selectors/EPValues';
import errorActions from '../reducers/Errors';
import i18n from '../../localization/i18n';
import WebRequest from './WebRequest';
import { fulfilled, rejected } from '../factories/ApiCall';

function* check_after_each_can(action) {
  try {
    const reduxState = action.payload;
    const config_values = configSelectors.config_values(reduxState);
    if (!config_values['email_config.autosend_email']) {
      // Nothing to do as auto send email is disabled
      return;
    }
    let template = configSelectors.email_templates(reduxState);

    template = template.find(
      (x) => x.name === config_values['email_config.order_done_template']
    );

    if (!template) {
      // Nothing to do as no template found!
      console.log(
        'No template found! ',
        config_values['email_config.order_done_template']
      );
      return;
    }

    //const subject = config_values['email_config.order_done_subject'];
    const order = orderSelectors.order(reduxState);

    // email_config.order_done_subject: "Polchem Color Suit order ([orderID])"
    // email_config.order_done_template: "Test"

    const labeldata = EPValues(reduxState);
    const ei_values = Object.entries(labeldata).map(([key, value]) => ({
      key: key,
      value: value,
    }));

    const preview = MailTemplateToHtml(
      template.data?.template || '',
      ei_values
    );

    const subject = MailTemplateToHtml(
      template.data?.subject || 'Polchem Color Suit - order([orderID])',
      ei_values
    );

    if (order?.customer?.email) {
      yield put(emailActions.sendEmail(subject, preview, order.customer.email));
    }
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToSendEmail', 'Unable to send email'),
        e
      )
    );
  }
}

export function* send_email(action) {
  try {
    const config_values = yield select(configSelectors.config_values);

    const params = {
      ...action.payload,
      from_email: config_values['email_config.from_email'],
      from_name: config_values['email_config.from_name'],
    };

    const { data } = yield call(WebRequest, EmailAPI.send_email(params));
    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.ErrorInServerConnection',
          'Unable to load data. Check connection to server.'
        ),
        e.response?.data?.error || e.response || e
      )
    );
  }
}

export function* send_test_email(action) {
  try {
    const config_values = yield select(configSelectors.config_values);

    const params = {
      ...action.payload,
      from_email: config_values['email_config.from_email'],
      from_name: config_values['email_config.from_name'],
    };

    const { data } = yield call(WebRequest, EmailAPI.send_test_email(params));
    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.ErrorInServerConnection',
          'Unable to load data. Check connection to server.'
        ),
        e.response?.data?.error || e.response || e
      )
    );
  }
}
export default function* saga() {
  yield takeLatest(actionTypes.SEND_EMAIL, send_email);
  yield takeLatest(
    printTaskActionTypes.PROCESS_TASKS_AFTER_CAN,
    check_after_each_can
  );
  yield takeLatest(configActionTypes.SEND_TEST_EMAIL, send_test_email);
}
