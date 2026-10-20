import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal, ModalBody, Button, ModalHeader } from 'reactstrap';
import spectroActions, { selectors } from 'js/redux/reducers/Spectro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { consts } from 'js/api/Spectro';

const propTypes = {
  t: PropTypes.func.isRequired,
  calibProceed: PropTypes.func.isRequired,
  spectro_dialog: PropTypes.object,
  spectro_busy: PropTypes.bool.isRequired,
};

const defaultProps = {};
/**
 * Handles spectro calibration / measurement
 */
class SpectroModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.okButtonRef = React.createRef(); // Create a ref
  }

  componentDidUpdate() {
    // Always focus to the button when the modal is opened
    setTimeout(() => {
      if (typeof this.okButtonRef?.focus === 'function') {
        this.okButtonRef.focus();
      }
    }, 100);
  }

  getModalContent = () => {
    const { t, spectro_dialog, spectro_busy } = this.props;
    return (
      spectro_dialog.showButton && (
        <Button
          onClick={this.props.calibProceed}
          disabled={spectro_busy}
          innerRef={(ref) => {
            if (ref) this.okButtonRef = ref;
          }}
        >
          {spectro_busy && <FontAwesomeIcon icon="spinner" spin />}{' '}
          {spectro_dialog.finished
            ? t('fn.close', 'Close')
            : t('fn.proceed', 'Proceed')}
        </Button>
      )
    );
  };

  render() {
    const { t, spectro_dialog } = this.props;
    return (
      spectro_dialog && (
        <Modal className="customer-width" isOpen={true} centered fade={true}>
          <ModalHeader>{t(spectro_dialog.messageKey, '')}</ModalHeader>
          <ModalBody>{this.getModalContent()}</ModalBody>
        </Modal>
      )
    );
  }
}

SpectroModal.propTypes = propTypes;
SpectroModal.defaultProps = defaultProps;

const mapStateToProps = (state) => ({
  spectro_dialog: selectors.dialog(state),
  spectro_busy: selectors.busy(state),
});

const mapDispatchToProps = {
  calibProceed: spectroActions.calibProceed,
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(SpectroModal)
);
