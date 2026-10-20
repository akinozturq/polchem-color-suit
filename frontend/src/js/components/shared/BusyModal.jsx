import React, { Component } from 'react';
import { Modal, ModalBody } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import busyActions from 'js/redux/reducers/Busy';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

//import loader from 'img/loading-hourglass.gif';

const propTypes = {
  t: PropTypes.func.isRequired,
  setBusy: PropTypes.func.isRequired,
  busy: PropTypes.shape({
    busy: PropTypes.bool.isRequired,
  }),
  login: PropTypes.shape({
    site_logged_in: PropTypes.bool.isRequired,
  }).isRequired,
};

const defaultProps = {};

class BusyModal extends Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.props.setBusy(false);
  }

  render() {
    const { t } = this.props;

    return (
      <Modal
        data-testid="busyModal"
        backdrop="static"
        isOpen={this.props.busy.busy && this.props.login.site_logged_in}
        toggle={this.toggle}
        centered
        style={{ width: '288px', height: '288px', overflow: 'hidden' }}
        className="modal-dark-bg"
      >
        <ModalBody>
          <FontAwesomeIcon icon="spinner" spin style={{ fontSize: '15rem' }} />

          <div
            style={{
              position: 'absolute',
              top: '45%',
              width: '240px',
              textAlign: 'center',
            }}
          >
            {t('msg.loading.ellipsis', 'Loading...')}
          </div>
        </ModalBody>
      </Modal>
    );
  }
}

BusyModal.propTypes = propTypes;
BusyModal.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    busy: store.busy,
    login: store.login,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setBusy: busyActions.setBusy,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(BusyModal)
);
