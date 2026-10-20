import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { bindActionCreators } from 'redux';
import dispenser_img from 'img/Dispenser.svg';
import Loading from 'img/loading.svg';
import machineActions, {
  propType as machinePropType,
  selectors as machineSelectors,
} from 'js/redux/reducers/Machine';

import { selectors as maintenanceSelectors } from 'js/redux/reducers/Maintenance';

import { push } from 'connected-react-router';
import {
  HTML_COLOR_BLUE,
  HTML_COLOR_DARK_BLUE,
  HTML_COLOR_RED,
  HTML_COLOR_YELLOW,
  MACHINE_WARNING_MSG_ICON,
} from '../../Constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextFit from '../shared/TextFit';

class MachineButton extends Component {
  constructor(props) {
    super(props);
    this.showMachineConfig = this.showMachineConfig.bind(this);
  }

  showMachineConfig() {
    this.props.setCurrentMachine(this.props.dispID);
    this.props.navigateTo('/machine');
  }

  componentDidMount() {
    this.props.fetchMachineColorants(this.props.dispID);
  }

  render() {
    const { machine, dispID, disabled, unseen_maintenance, show_name } =
      this.props;

    const state = machine.machine_state || {};
    const name = machine.info?.dispenserName || '';

    let color = null;
    let padge_color = null;

    if (
      state &&
      state.warning &&
      state.warning.msgIcon === MACHINE_WARNING_MSG_ICON
    ) {
      padge_color = HTML_COLOR_YELLOW;
    }

    if (
      unseen_maintenance.data
        .map((z) => z.machineid)
        .includes(machine?.dbinfo?.machineid)
    ) {
      padge_color = HTML_COLOR_BLUE;
    }

    const cnts = machine.colorants || [];

    if (cnts.some((c) => c.enabled && c.currLevel < c.minLevel)) {
      color = HTML_COLOR_RED;
    } else if (cnts.some((c) => c.enabled && c.currLevel < c.warnLevel)) {
      color = HTML_COLOR_YELLOW;
    }

    return (
      <div style={{ position: 'inherit' }}>
        <Button
          className="btn-left btn-top-wide mb-8"
          id={'machineConfig_' + dispID}
          disabled={disabled}
          onClick={this.showMachineConfig}
          style={{
            position: 'relative',
            backgroundColor: color,

            width: show_name ? 'unset' : '3.5rem',
          }}
        >
          <div
            id={'machineConfig_' + dispID}
            className={'p-3'}
            style={{ display: 'inline-flex', height: '100%', width: '100%' }}
          >
            <img
              src={state ? dispenser_img : Loading}
              height="100%"
              alt={name}
            />
            {show_name && (
              <TextFit
                containerId={'machineConfig_' + dispID}
                style={{
                  margin: 'auto',
                }}
                text={name}
              />
            )}

            <UncontrolledTooltip
              placement="right"
              target={'machineConfig_' + dispID}
            >
              {name}
            </UncontrolledTooltip>
          </div>

          {padge_color && (
            <div
              style={{
                borderRadius: '50%',
                backgroundColor: HTML_COLOR_DARK_BLUE,
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                height: '30px',
                width: '30px',
              }}
            >
              <FontAwesomeIcon
                icon="exclamation-triangle"
                style={{
                  color: padge_color,
                  position: 'relative',
                  height: '22px',
                  width: '22px',
                  top: '-6px',
                }}
              />
            </div>
          )}
        </Button>
      </div>
    );
  }
}

MachineButton.propTypes = {
  setCurrentMachine: PropTypes.func.isRequired,
  fetchMachineColorants: PropTypes.func.isRequired,
  navigateTo: PropTypes.func.isRequired,
  dispID: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  machine: machinePropType,
  unseen_maintenance: PropTypes.shape({ data: PropTypes.array }),
  show_name: PropTypes.bool.isRequired,
};

function mapStateToProps(state, ownProps) {
  return {
    machine: machineSelectors.machine(state, ownProps.dispID),
    unseen_maintenance: maintenanceSelectors.unseen(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setCurrentMachine: machineActions.setCurrentMachine,
      fetchMachineColorants: machineActions.fetchMachineColorants,
      navigateTo: push,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MachineButton);
