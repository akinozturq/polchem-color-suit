/**
 * Shows Dispenser not connected message
 */

import React from 'react';
import { Modal, ModalBody, ModalHeader, ModalFooter, Button } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { selectors as machineSelectors } from 'js/redux/reducers/Machine';

const propTypes = {
  t: PropTypes.func.isRequired,
  isMachineMissing: PropTypes.bool,
};

class NoMachineModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { clicked: false };
  }

  handleClick = () => {
    this.setState({ clicked: true });
  };

  render() {
    const { t, isMachineMissing } = this.props;
    // Show nothing if not ready, if OK, or if user has already clicked this
    if (!isMachineMissing || this.state.clicked) return null;

    return (
      <Modal isOpen centered>
        <ModalHeader>
          {t(
            'lbl.dispenserNotConnected',
            'Dispenser not connected or configuration error'
          )}
        </ModalHeader>
        <ModalBody>
          {t(
            'msg.dispenserNotConnected',
            'Please check and make sure the auto tinter emergency power switch is engaged. Also check power source and machine connection cables.'
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={this.handleClick}>{t('fn.ok')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

NoMachineModal.propTypes = propTypes;

function mapStateToProps(state) {
  return {
    isMachineMissing: machineSelectors.isMachineMissing(state),
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(NoMachineModal)
);
