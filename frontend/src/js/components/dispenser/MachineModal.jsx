/**
 * Shows modals of the machine if mandatory purge is requested
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalBody, ModalHeader } from 'reactstrap';

import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  MACHINE_PROGRESS_PURGE,
  MACHINE_PROGRESS_PURGE_ALL,
  MACHINE_PROGRESS_PURGE_AUTOMATIC,
} from 'js/Constants';
import {
  selectors as machineSelectors,
  propType as machineType,
} from 'js/redux/reducers/Machine';
import { selectors as orderSelectors } from 'js/redux/reducers/Order';
import { selectors as loginSelectors } from 'js/redux/reducers/Login';
import MachineModalCard from './MachineModalCard';
import userActions, {
  selectors as userSelectors,
} from '../../redux/reducers/User';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MACHINE_PROGRESS_TINT } from '../../Constants';
import { rightToLeft } from '../../mylib/Utils';

const propTypes = {
  t: PropTypes.func.isRequired,
  loginUser: PropTypes.func.isRequired,
  machines: PropTypes.objectOf(machineType).isRequired,
  dispIDs: PropTypes.array.isRequired,
  user_privileges: PropTypes.array.isRequired,
  order_open_section: PropTypes.string,
  site_logged_in: PropTypes.bool.isRequired,
  login: PropTypes.shape({
    site_logged_in: PropTypes.bool.isRequired,
  }),
  showLoginUser: PropTypes.func.isRequired,
};

const defaultProps = {};

class MachineModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { t, user_privileges } = this.props;

    const isRtl = rightToLeft();

    const allow_tinting_process = user_privileges.includes(
      'order_tinting_process'
    );
    const cards = [];

    for (const id of this.props.dispIDs) {
      const machine = this.props.machines[id];
      if (!machine?.machine_state) {
        continue;
      }

      const { currentProcess } = machine.machine_state;
      if (
        // to resume tinting after login
        (currentProcess === MACHINE_PROGRESS_TINT && !allow_tinting_process) ||
        [
          MACHINE_PROGRESS_PURGE_AUTOMATIC,
          MACHINE_PROGRESS_PURGE_ALL,
          MACHINE_PROGRESS_PURGE,
        ].includes(currentProcess)
      )
        cards.push(<MachineModalCard dispID={id} key={id} />);
    }

    const showModal = cards.length > 0;

    return (
      <Modal isOpen={showModal && this.props.site_logged_in} centered>
        <ModalHeader>
          {t('lbl.machineOperations', 'Machine operations')}
          <div
            style={{
              position: 'absolute',
              top: '0.25rem',
              right: isRtl ? 'auto' : '0.25rem',
              left: isRtl ? '0.25rem' : 'auto',
            }}
          >
            <Button
              onClick={() => {
                this.props.loginUser(null, null);
                this.props.showLoginUser();
              }}
            >
              <FontAwesomeIcon icon={'unlock'} />
            </Button>
          </div>
        </ModalHeader>
        <ModalBody>{cards}</ModalBody>
      </Modal>
    );
  }
}

MachineModal.propTypes = propTypes;
MachineModal.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    machines: machineSelectors.machines(state),
    dispIDs: machineSelectors.dispIDs(state),
    order_open_section: orderSelectors.open_section(state),
    user_privileges: userSelectors.privileges(state),
    site_logged_in: loginSelectors.logged_in(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      showLoginUser: userActions.showLoginUser,
      loginUser: userActions.loginUser,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachineModal)
);
