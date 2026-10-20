import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import { bindActionCreators } from 'redux';
import machineActions, {
  selectors as machineSelectors,
  propType as machineType,
} from 'js/redux/reducers/Machine';
import { DISPID_FLINK_DISPENSER } from 'js/Constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MachineButton from './MachineButton';

import { hasPrivilege } from '../../mylib/Privileges';

class MachineButtons extends Component {
  downloadClient = () => {
    const { update_checker } = this.props;
    window.open(
      '/static/v' +
        update_checker?.version_details?.front_version +
        '/setups/polchem_color_suit_pos.exe',
      '_blank'
    );
  };

  render() {
    // Changed to provide download button for the POS app on normal browser
    if (window.qtside) {
      const drivenMachines = this.props.dispIDs.filter(
        (x) => x !== DISPID_FLINK_DISPENSER
      );
      if (drivenMachines.length > 0) {
        return drivenMachines.map((id) => (
          <MachineButton
            dispID={id}
            key={id}
            disabled={!hasPrivilege('tinting_machine')}
            data-denied={!hasPrivilege('tinting_machine')}
            show_name={drivenMachines.length > 1}
          />
        ));
      } else {
        return null;
      }
    }
    /* Simulation dispenser and download the client app button */
    return (
      <>
        {this.props.dispIDs.map((id) => (
          <MachineButton
            dispID={id}
            key={id}
            disabled={!hasPrivilege('tinting_machine')}
            data-denied={!hasPrivilege('tinting_machine')}
            show_name={this.props.dispIDs.length > 1}
          />
        ))}

        <Button
          data-testid="download"
          className="btn btn-primary btn-left btn-top"
          onClick={this.downloadClient}
        >
          <FontAwesomeIcon icon="download" />
        </Button>
      </>
    );
  }
}

MachineButtons.propTypes = {
  toggleMachineConfigVisible: PropTypes.func.isRequired,
  machines: PropTypes.objectOf(machineType).isRequired,
  dispIDs: PropTypes.array.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  update_checker: PropTypes.shape({
    version_details: PropTypes.shape({
      front_version: PropTypes.any,
    }),
  }),
};

function mapStateToProps(state) {
  return {
    machines: machineSelectors.machines(state),
    dispIDs: machineSelectors.dispIDs(state),
    privileges: state.user.current_user.privileges,
    update_checker: state.update_checker,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      toggleMachineConfigVisible: machineActions.toggleMachineConfigVisible,
      fetchMachineState: machineActions.fetchMachineState,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MachineButtons);
