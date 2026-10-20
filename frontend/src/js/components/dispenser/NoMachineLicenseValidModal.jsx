/**
 * Shows Machine License status message
 */

import React from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import {
  MACHINE_LICENSE_DATE_ERROR,
  MACHINE_LICENSE_REG_FAILED,
  MACHINE_LICENSE_REG_OVER,
  MACHINE_LICENSE_REG_SUCCESS,
} from '../../Constants';

const propTypes = {
  t: PropTypes.func.isRequired,
  machines: PropTypes.object,
};

class NoMachineLicenseValidModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { clicked: [] };
  }

  handleClick = (index) => {
    let clicked = [...this.state.clicked];
    clicked[index] = true;
    this.setState({ clicked });
  };

  getRegistrationStatusMessage = (status) => {
    switch (status) {
      case MACHINE_LICENSE_REG_OVER:
        return this.props.t(
          'lbl.machineRegistrationOver',
          'Machine license registration is over.'
        );
      case MACHINE_LICENSE_REG_FAILED:
        return this.props.t(
          'lbl.machineRegistrationFailed',
          'Machine license registration has failed'
        );
      default:
        return null;
    }
  };

  render() {
    const { t, machines } = this.props;

    return Object.values(machines).map((machine, index) => {
      // Show nothing if  user has already clicked this

      if (this.state.clicked[index]) return null;

      const registrationStatus = machine.info?.registrationStatus;

      if (
        !registrationStatus ||
        registrationStatus === MACHINE_LICENSE_REG_SUCCESS ||
        registrationStatus === MACHINE_LICENSE_DATE_ERROR
      )
        return null;
      return (
        <Modal key={index} isOpen centered>
          <ModalHeader>
            {t('lbl.dispenserNotRegistered', 'Dispenser not registered')}
          </ModalHeader>
          <ModalBody>
            {this.getRegistrationStatusMessage(registrationStatus)}

            {t(
              'msg.dispenserNotRegisteredCheck',
              ' Please check and make sure the machine driver is registered or license is valid.'
            )}

            {machine?.info?.registrationExpiryDate &&
              t(
                'msg.dispenserLicenseExpire',
                ' \n Machine driver license expired on '
              ) + machine?.info?.registrationExpiryDate}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => this.handleClick(index)} autoFocus={true}>
              {t('fn.ok')}
            </Button>
          </ModalFooter>
        </Modal>
      );
    });
  }
}

NoMachineLicenseValidModal.propTypes = propTypes;

function mapStateToProps(state) {
  return {
    machines: machineSelectors.machines(state),
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(NoMachineLicenseValidModal)
);
