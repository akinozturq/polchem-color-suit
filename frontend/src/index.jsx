import './css/styles.scss';
/**
 * test for animations
 * NOTE part of the animation code copied into here as otherwice the page style breaks down!
 *
 */
// Confirm modal css
import './js/ext/react-confirm-alert/react-confirm-alert.css'; // Import css

import 'animate.css';
//import 'mdbreact/dist/css/mdb.css';
// Bootstrap table 2 styles
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

// Sliding pane css
import 'react-sliding-pane/dist/react-sliding-pane.css';

import { ConnectedRouter } from 'connected-react-router';

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import Favicon from 'react-favicon';
// translation
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import 'typeface-noto-sans';

import icon_128 from './img/appIcons/Polchem_blue.svg';
import i18n from './js/localization/i18n';

// import machineActions from './js/redux/reducers/Machine';
import store, { history } from './js/redux/Store';

import updateActions from './js/redux/reducers/UpdateChecker';
import replicationActions from './js/redux/reducers/Replication';
import configActions from 'js/redux/reducers/Configuration';
import userActions from 'js/redux/reducers/User';
import loginActions from 'js/redux/reducers/Login';
import offlineActions from 'js/redux/reducers/Offline';
import posAppPermissionActions from 'js/redux/reducers/PosAppPermissions';

import standalone2cloudApi from './js/api/Standalone2Cloud';
import spectroApi from './js/api/Spectro';

import offlineAPI from './js/api/Offline';
import machineAPI from './js/api/Machine';
import transferAPI from './js/api/Transfer';
import updateAPI from './js/api/SWUpdateApi';
import maintenanceAPI from './js/api/Maintenance';
import posAppPermissionAPI from './js/api/PosAppPermissions';
import tokenApi from './js/api/AccessToken';
import remoteSupportApi from './js/api/RemoteSupport';
import minigdataApi from './js/api/MiniGData';

// Service worker
import * as serviceWorker from './serviceWorker';

// ICONS
import registerIcons from './js/redux/RegisterIcon';

import ErrorBoundary from './js/components/shared/ErrorBoundaryModal';
// needed for react-modal to work correctly
import Modal from 'react-modal';
import App from './App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CURRENT_VERSION } from './version';
import { configureHotKeys } from './js/HotKeyConfig';
import { detectMobile } from './js/mylib/Utils';
import { formatStackTrace } from 'polchem_base/common/ErrorUtils';
import { offline_mode } from './js/Constants';
import { setBackgroundImage } from './backgroundImage.js';
// import { SignalSwitch, createAppSideProxy } from './js/mylib/AppSide';
Modal.setAppElement('#root');

async function loadPolyfills() {
  const tasks = [];

  if (!('replaceAll' in String.prototype)) {
    tasks.push(import('core-js/actual/string/replace-all'));
  }

  await Promise.all(tasks);
}

// END ICONS
registerIcons();

// Configure hotkeys
configureHotKeys();

async function bootstrapApp() {
  await loadPolyfills();

  /**
   * Connect qt signals here. Any other location might cause multi connect --> multi results!
   */
  if (window.qtside) {
    console.log('!!!!!!!!!!!!!! qtside available here !!!!!!!!!!!!!!!!!!!');
    machineAPI.connect(window.qtside.tmachine, store);
    offlineAPI.connect(window.qtside.offline, store);
    standalone2cloudApi.connect(
      window.qtside.standalone2cloud,
      store
    );
    if (window.qtside.access_tokens_v2) {
      tokenApi.connect(window.qtside.access_tokens_v2, 2);
    } else {
      tokenApi.connect(window.qtside.access_tokens);
    }
    minigdataApi.connect(window.qtside.minigdata);
    spectroApi.connect(window.qtside.spectro);
    transferAPI.connect(window.qtside.transfer, store);
    maintenanceAPI.connect(window.qtside.maintenance);
    posAppPermissionAPI.connect(window.qtside.pos_app_permissions);
    updateAPI.connect(window.qtside.swupdate, store);
    remoteSupportApi.connect(window.qtside.remote_support, store);

    /**
     * If in offline mode init the offline mode token
     */
    if (offline_mode) {
      store.dispatch(loginActions.loadOfflineToken());
    }

    try {
      window.qtside.bridge.updateConfig.connect((key, value) => {
        store.dispatch(configActions.setConfig(key, value));
      });
    } catch (e) {
      console.log(e);
    }

    try {
      window.qtside.bridge.isStartedAsAdmin.connect((value) => {
        store.dispatch(userActions.setStartedAsAdmin(value));
      });
      window.qtside.bridge.is_started_as_admin();
    } catch (e) {
      console.log(e);
    }
    try {
      // Loading datetimeformats
      window.qtside.bridge.dateTimeFormats.connect((value) => {
        window.dateTimeFormats = JSON.parse(value);
      });
      window.qtside.bridge.get_datetime_formats();
    } catch (e) {
      console.log(e);
    }

    window.onerror = function (msg, url, lineNo, columnNo, error) {
      formatStackTrace(error)
        .then(({ message, stack }) => {
          window.qtside.bridge.reportBug(message, stack, '', CURRENT_VERSION);
        })
        .catch((e) => {
          console.log('Error in stack trace generation:', e);
        });
    };
  }

/* Starting point for PyWebview connection.

// import { SignalSwitch, createAppSideProxy } from './js/mylib/AppSide';

else {
  window.addEventListener('pywebviewready', function () {
    console.log('!!!!!! pywebview ready here !!!!!!!');
    window.appSignal = new SignalSwitch();
    console.log(window.pywebview);
    if (!window.pywebview.api.spectro) {
      throw new Error('Spectro api not available!');
    }
    spectroApi.connect(
      createAppSideProxy(window.pywebview.api.spectro, window.appSignal)
    );
  });
}
*/

  /**
   * Loading initial data. Maybe need to have some loading indicator when everything is ready...
   * Successfull fetch of zones will cause loading of the rest of the data
   */
  store.dispatch(configActions.initializeApp(true));

  // Move the fetching to redux to fetch after config is fetched due to fetch_combined_machine_list requires config.
  // store.dispatch(machineActions.fetchMachinesList());

  /**
   * Update checking
   */
  store.dispatch(updateActions.startUpdateChecking());

  /**
   * Replication status checking
   */
  store.dispatch(replicationActions.startStatusChecking());

  /**
   * Getting cloud server address
   */
  store.dispatch(offlineActions.getCloudServerAddress());

  store.dispatch(posAppPermissionActions.getState());

  //if using mobile, pages will be scrollable and background is repeating.
  if (detectMobile()) {
    document.getElementsByTagName('body')[0].style.overflow = 'scroll';
    document.getElementsByTagName('body')[0].style.backgroundRepeat = 'repeat';
  }

  setBackgroundImage(undefined);

  // eslint-disable-next-line react/no-deprecated
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Suspense
          fallback={
            <div
              className="width100 height100"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '10rem',
              }}
            >
              <FontAwesomeIcon
                style={{ margin: 'auto', color: 'white', fontSize: '15rem' }}
                icon="spinner"
                spin
              />
            </div>
          }
        >
          <I18nextProvider i18n={i18n}>
            <React.Fragment>
              <Favicon url={icon_128} />
              {/** Still here, but hidden so can be found from source if needed.
               This is also read by the error reporting modal */}
              <div className="build-date" style={{ display: 'none' }}>
                Build Date: <div id="build_datetime">{CURRENT_VERSION}</div>
              </div>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </React.Fragment>
          </I18nextProvider>
        </Suspense>
      </ConnectedRouter>
    </Provider>,
    document.getElementById('root')
  );

  if (window.Cypress || import.meta.env.PROD) {
    window.store = store;
  }

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: http://bit.ly/CRA-PWA
  serviceWorker.register();
}

bootstrapApp().catch((error) => {
  // Ensure startup failures (e.g. polyfill loading issues) are surfaced
  // instead of resulting in an unhandled promise rejection.
  console.error('Failed to bootstrap application', error);

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML =
      '<div style="padding: 1rem; font-family: sans-serif;">' +
      '<h1>Application failed to start</h1>' +
      '<p>Please check your network connection and reload the page.</p>' +
      '</div>';
  }
});
