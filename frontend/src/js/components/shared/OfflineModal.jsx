import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import offlineActions, {
  propType as offlineProps,
} from 'js/redux/reducers/Offline';
import { withTranslation } from 'react-i18next';

import { Button, Modal, ModalHeader, ModalBody, Row, Col } from 'reactstrap';
import errorActions from 'js/redux/reducers/Errors';
import { offline_mode } from '../../Constants';

const propTypes = {
  t: PropTypes.func.isRequired,
  offline: offlineProps,
  showError: PropTypes.func.isRequired,
  startOfflineMode: PropTypes.func.isRequired,
  stopOfflineMode: PropTypes.func.isRequired,
  reTryRequest: PropTypes.func.isRequired,
  router: PropTypes.any,
};

const defaultProps = {};

class OfflineModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      countdown: 10,
    };
    this.countdownInterval = null;
  }

  componentDidMount() {
    this.checkAndStartCountdown();
  }

  componentDidUpdate(prevProps) {
    // If the modal was not shown before but is shown now, or if online mode became available
    if (
      (!prevProps.offline.show_modal && this.props.offline.show_modal) ||
      (!prevProps.offline.is_online_mode_available &&
        this.props.offline.is_online_mode_available) ||
      (offline_mode &&
        prevProps.router.location.pathname !==
          this.props.router.location.pathname)
    ) {
      this.checkAndStartCountdown();
    }
  }

  componentWillUnmount() {
    this.clearCountdown();
  }

  checkAndStartCountdown = () => {
    this.clearCountdown();

    // If online mode is available and modal is shown, start the countdown
    if (
      this.props.offline.is_online_mode_available &&
      this.props.offline.show_modal &&
      this.props.router.location.pathname === '/'
    ) {
      this.setState({ countdown: 10 });
      this.countdownInterval = setInterval(() => {
        this.setState((prevState) => {
          const newCountdown = prevState.countdown - 1;
          if (newCountdown <= 0) {
            this.clearCountdown();
            this.moveToOnline();
            return { countdown: 0 };
          }
          return { countdown: newCountdown };
        });
      }, 1000);
    }
  };

  clearCountdown = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  };

  moveToOffline = () => {
    this.clearCountdown();
    this.props.startOfflineMode();
  };

  moveToOnline = () => {
    this.clearCountdown();
    this.props.stopOfflineMode();
    window.location.href = this.props.offline.cloud_address;
  };

  continueInOffline = () => {
    this.clearCountdown();
    this.props.reTryRequest();
  };

  render() {
    const { t, reTryRequest, router, offline } = this.props;

    const show_modal =
      ((router.location.pathname === '/' &&
        offline.is_online_mode_available &&
        offline_mode) ||
        !offline.is_online_mode_available) &&
      offline.show_modal;

    return (
      <Modal isOpen={show_modal} centered fade zIndex={1060}>
        <ModalHeader style={{ backgroundColor: '#FF888899' }}>
          {t('fn.workOffline', 'Work offline')}
        </ModalHeader>
        <ModalBody>
          {!offline.is_online_mode_available && (
            <>
              <p>
                {t(
                  'msg.offlineConnectionLost',
                  'Connection to cloud server lost. Do you want to switch to offline mode?'
                )}
              </p>
              <Row>
                <Col>
                  <Button onClick={reTryRequest} color="warning">
                    {t('fn.retryOnline', 'Retry online')}
                  </Button>
                </Col>
                <Col />
                <Col>
                  <Button onClick={this.moveToOffline} color="info">
                    {t('fn.useOfflineMode', 'Use offline mode')}
                  </Button>
                </Col>
              </Row>
            </>
          )}
          {offline.is_online_mode_available && (
            <>
              <p>
                {t(
                  'msg.offlineConnectionResumed',
                  'Connection to cloud server is resumed. Do you want to switch to online mode?'
                )}
              </p>
              <Row>
                <Col>
                  <Button
                    size={'small'}
                    onClick={this.continueInOffline}
                    color="warning"
                    style={{ padding: '0.5rem', paddingBottom: '2.5rem' }}
                  >
                    {t('fn.continueOffline', 'Continue offline mode')}
                  </Button>
                </Col>
                <Col />
                <Col>
                  <Button onClick={this.moveToOnline} color="success">
                    {t('fn.switchToOnline', 'Switch to online')} (
                    {this.state.countdown}s)
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </ModalBody>
      </Modal>
    );
  }
}

OfflineModal.propTypes = propTypes;
OfflineModal.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    offline: store.offline,
    router: store.router,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      reTryRequest: offlineActions.reTryRequest,
      startOfflineMode: offlineActions.startOfflineMode,
      stopOfflineMode: offlineActions.stopOfflineMode,

      showError: errorActions.showCriticalError,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(OfflineModal)
);
