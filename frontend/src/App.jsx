import React from 'react';
import { HashRouter, Route } from 'react-router-dom';
import HomePage from './js/components/homepage/HomePage';
import OrderPage from './js/components/orderpage/OrderPage';
import ConfigPage from './js/components/config/ConfigPage';
import MachinePage from './js/components/dispenser/machinePage/MachinePage';
import MachineModal from './js/components/dispenser/MachineModal';
import NoMachineModal from './js/components/dispenser/NoMachineModal';
import TopMenu from './TopMenu';
import CriticalModal from './js/components/shared/CriticalModal';
import HistoryPage from './js/components/historypage/HistoryPage';
//import CustomerPage from './js/components/customerpage/CustomerPage';
import CustomerSearchPage from './js/components/customerpage/CustomerSearchPage';
import MatchingPage from './js/components/matchingpage/MatchingPage';
import LocalFormulaPage from './js/components/localformulaPage/LocalFormulaPage';
import StatisticsPage from './js/components/statisticspage/StatisticsPage';
import ErrorBoundary from './js/components/shared/ErrorBoundaryModal';
import BusyModal from './js/components/shared/BusyModal';
import TranslateModal from 'js/mylib/TranslateModal';
import SpectroModal from 'js/components/shared/SpectroModal';
import GlossCompensationModal from './js/components/shared/GlossCompensationModal';
import OrderQueuePage from 'js/components/orderqueue/OrderQueuePage';
import Protection from 'js/components/protection/Protection';
import { EasyPrint } from 'e-p';
import PrintPreviewModal from './js/components/shared/PrintPreviewModal';
import BarcodeModal from './js/components/shared/BarcodeModal';
import ShoppingCart from './js/components/shared/order/ShoppingCart';
import ReplicationModal from './js/components/shared/ReplicationModal';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import PrivateRoute from './js/components/shared/PrivateRoute';
import OfflineModal from './js/components/shared/OfflineModal';
import { selectors as machineSelectors } from './js/redux/reducers/Machine';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import ForgotPassword from './js/ForgotPassword';
import { hasPrivilege } from './js/mylib/Privileges';
import BarcodeRejectedModal from './js/components/shared/BarcodeRejectedModal';
import NoMachineLicenseValidModal from './js/components/dispenser/NoMachineLicenseValidModal';

import { MailEditor } from 'easy-mail';
import VersionModal from './js/components/shared/VersionModal';
import CustomerPage from './js/components/customerpage/CustomerPage';
import { offline_mode } from './js/Constants';
import { detectMobile } from './js/mylib/Utils';
import { tr } from 'date-fns/locale';

class PinnedViewportGuard extends React.Component {
  scrollResetFrame = null;
  previousScrollRestoration = null;
  scrollLockEnabled = false;

  componentDidMount() {
    this.updateScrollLock();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.updateScrollLock();
    }
  }

  componentWillUnmount() {
    this.disableScrollLock();
  }

  updateScrollLock = () => {
    if (!detectMobile()) {
      this.enableScrollLock();
      return;
    }

    this.disableScrollLock();
  };

  enableScrollLock = () => {
    if (this.scrollLockEnabled) {
      this.scrollToTop();
      return;
    }

    if ('scrollRestoration' in window.history) {
      this.previousScrollRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
    }

    this.scrollLockEnabled = true;
    this.scrollToTop();
    window.addEventListener('scroll', this.handleWindowScroll, {
      passive: true,
    });
  };

  disableScrollLock = () => {
    if (!this.scrollLockEnabled) {
      return;
    }

    window.removeEventListener('scroll', this.handleWindowScroll);

    if (this.scrollResetFrame != null) {
      window.cancelAnimationFrame(this.scrollResetFrame);
      this.scrollResetFrame = null;
    }

    if (
      this.previousScrollRestoration != null &&
      'scrollRestoration' in window.history
    ) {
      window.history.scrollRestoration = this.previousScrollRestoration;
      this.previousScrollRestoration = null;
    }

    this.scrollLockEnabled = false;
  };

  handleWindowScroll = () => {
    if (
      !this.scrollLockEnabled ||
      (window.scrollX === 0 && window.scrollY === 0)
    ) {
      return;
    }

    if (this.scrollResetFrame != null) {
      return;
    }

    this.scrollResetFrame = window.requestAnimationFrame(() => {
      this.scrollResetFrame = null;
      this.scrollToTop();
    });
  };

  scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  render() {
    return null;
  }
}

PinnedViewportGuard.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

class App extends React.Component {
  render() {
    let login_required = !this.props.is_standalone && !offline_mode;
    const section = window.location.hash.split('?')[0];
    if (['#/validate_email', '#/reset_password'].includes(section)) {
      login_required = false;
    }

    return (
      <HashRouter>
        <React.Fragment>
          <TopMenu login_required={login_required} />
          <Route render={(props) => <PinnedViewportGuard {...props} />} />
          <React.Fragment>
            <Route
              exact
              path="/"
              render={(props) => (
                <HomePage
                  {...props}
                  machine={this.props.machine}
                  warning_batch={this.props.warning_batch}
                />
              )}
            />
            <Route path="/orderpage" component={OrderPage} />
            <PrivateRoute
              path="/config/:configPath?"
              hasPrivilege={hasPrivilege('tools_and_settings')}
              component={ConfigPage}
            />
            <PrivateRoute
              path="/history"
              hasPrivilege={hasPrivilege('history_items')}
              component={HistoryPage}
            />
            <PrivateRoute
              path="/statistics"
              hasPrivilege={hasPrivilege('detailed_stats')}
              component={StatisticsPage}
              showDatePickers={true}
            />
            <PrivateRoute
              path="/customers"
              hasPrivilege={hasPrivilege('history_view_customer')}
              component={CustomerSearchPage}
            />
            <PrivateRoute
              path="/customer"
              hasPrivilege={hasPrivilege('history_view_customer')}
              component={CustomerPage}
            />
            <Route path="/matching" component={MatchingPage} />
            <PrivateRoute
              hasPrivilege={hasPrivilege('order_new')}
              path="/localformula"
              component={LocalFormulaPage}
            />
            <PrivateRoute
              hasPrivilege={hasPrivilege('order_new')}
              path="/freedispense"
              component={LocalFormulaPage}
            />
            <PrivateRoute
              hasPrivilege={hasPrivilege('order_queue')}
              path="/order-queue"
              component={OrderQueuePage}
            />
            <Route exact path="/reset_password" component={ForgotPassword} />
            <ErrorBoundary>
              <Route path="/easy-print" component={EasyPrint} />
            </ErrorBoundary>
            <ErrorBoundary>
              <Route path="/easy-mail" component={MailEditor} />
            </ErrorBoundary>
            <ErrorBoundary>
              <Route path="/machine" component={MachinePage} />
            </ErrorBoundary>
            <ErrorBoundary>
              <Route path="/protection" component={Protection} />
            </ErrorBoundary>
            <ErrorBoundary>
              <Route path="/shopping-cart" component={ShoppingCart} />
            </ErrorBoundary>
          </React.Fragment>
          {/* Machine modal is introduced here so that popup always comes up*/}
          <MachineModal />
          <NoMachineModal />
          <NoMachineLicenseValidModal />
          <CriticalModal />
          {/** Spectro modal to handle calibration and measurement */}
          <SpectroModal />
          <GlossCompensationModal />
          {/* Maybe refresh the translations after saving */}
          {hasPrivilege('translate') &&
            this.props.site &&
            (this.props.is_cloud ||
              this.props.replication_details?.data?.has_replication ||
              false) && (
              <TranslateModal
                forceUpdate={() => this.forceUpdate()}
                siteid={this.props.site.siteid}
                machines={this.props.machines}
              />
            )}
          {this.props.is_pro && <BarcodeModal />}
          <BusyModal />
          <OfflineModal />
          <PrintPreviewModal />
          <ReplicationModal />
          <BarcodeRejectedModal />

          <VersionModal />
        </React.Fragment>
      </HashRouter>
    );
  }
}

App.propTypes = {
  site: PropTypes.shape({ siteid: PropTypes.number }),
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  is_standalone: PropTypes.bool.isRequired,
  warning_batch: PropTypes.array,
  machine: PropTypes.object,
  machines: PropTypes.object,
  is_pro: PropTypes.bool,
  is_cloud: PropTypes.bool,
  replication_details: PropTypes.shape({
    data: PropTypes.shape({
      has_replication: PropTypes.bool,
    }),
  }),
};

function mapStateToProps(store) {
  return {
    site: store.configurations.site,
    privileges: store.user.current_user.privileges,
    is_standalone: store.configurations.is_standalone,
    machine: machineSelectors.current_machine(store),
    replication_details: store.replication.details,
    machines: machineSelectors.machines(store),
    is_pro: protectionSelectors.is_pro(store),
    is_cloud: protectionSelectors.is_cloud(store),
    warning_batch: machineSelectors.warning_batch(store),
  };
}

export default connect(mapStateToProps)(App);
