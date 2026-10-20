import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row, Button } from 'reactstrap';
import machineActions, {
  propType as machineType,
} from 'js/redux/reducers/Machine';
import BootstrapTable from 'react-bootstrap-table-next';
import { CustomScrollbars } from 'js/mylib/Utils';
import _ from 'lodash';
import {
  MACHINE_MSG_ID_DISPENSER_CLEAN_WARNING,
  MACHINE_MSG_ID_HOPPER_CLEAN_WARNING,
  SERVICE_STATUS_CLOSED,
} from 'js/Constants';
import { bindActionCreators } from 'redux';
import maintenanceActions from 'js/redux/reducers/Maintenance';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { rightToLeft } from '../../../mylib/Utils';

const propTypes = {
  t: PropTypes.func.isRequired,
  machine: machineType,
  clearErrors: PropTypes.func.isRequired,
  saveIntervention: PropTypes.func.isRequired,
  clearHopperWarning: PropTypes.func.isRequired,
  clearDispenserWarning: PropTypes.func.isRequired,
  fetchMachineError: PropTypes.func.isRequired,
  dispID: PropTypes.string.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const defaultProps = {};

class MachineErrors extends React.Component {
  constructor(props) {
    super(props);
    this.state = { disable_clear: false };
  }

  componentDidMount() {
    this.props.fetchMachineError(this.props.dispID);
  }

  accessDenied = (key) => {
    const { privileges } = this.props;
    return !_.includes(privileges, key);
  };

  cleanWarning = (warn) => {
    this.setState({ disable_clear: true });
    const { t } = this.props;
    let notetype = '';
    let reason = '';
    if (warn === MACHINE_MSG_ID_HOPPER_CLEAN_WARNING) {
      this.props.clearHopperWarning(this.props.dispID);
      notetype = t('lbl.hopper_cleaned', 'Hopper cleaned');
      reason = t(
        'machine.msg.hopper_cleaning_required',
        'Hopper cleaning required'
      );
    } else if (warn === MACHINE_MSG_ID_DISPENSER_CLEAN_WARNING) {
      this.props.clearDispenserWarning(this.props.dispID);
      notetype = t('lbl.dispenser_cleaned', 'Dispenser cleaned');
      reason = t(
        'machine.msg.dispenser_cleaning_required',
        'Dispenser cleaning required'
      );
    }
    this.props.saveIntervention({
      machinedbid: this.props.machine.dbinfo.machineid,
      notetype,
      notestatus: SERVICE_STATUS_CLOSED,
      reason,
      resolution: t('lbl.cleaning_done', 'Cleaning done'),
      include_logs: false,
    });
  };

  buttonFormatter = (value) => {
    const { t } = this.props;
    if (
      _.includes(
        [
          MACHINE_MSG_ID_HOPPER_CLEAN_WARNING,
          MACHINE_MSG_ID_DISPENSER_CLEAN_WARNING,
        ],
        value
      )
    ) {
      return (
        <Button onClick={() => this.cleanWarning(value)}>
          {t('fn.machine.click_when_done', 'Click here when done')}
        </Button>
      );
    }
    return value;
  };

  render() {
    const { t } = this.props;
    const { error, machine_state } = this.props.machine;

    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';

    let table_data = _.cloneDeep(error) || [];

    if (
      machine_state &&
      machine_state.warning &&
      machine_state.warning.msgID === MACHINE_MSG_ID_HOPPER_CLEAN_WARNING
    ) {
      // Need to add the rows into error table
      table_data.push({
        code: machine_state.warning.msgID,
        description: t(
          'machine.msg.hopper_cleaning_required',
          'Hopper cleaning required'
        ),
        objectnro: this.state.disable_clear
          ? t('msg.processing.ellipsis')
          : machine_state.warning.msgID,
      });
    }
    if (
      machine_state &&
      machine_state.warning &&
      machine_state.warning.msgID === MACHINE_MSG_ID_DISPENSER_CLEAN_WARNING
    ) {
      // Need to add the rows into error table
      table_data.push({
        code: machine_state.warning.msgID,
        description: t(
          'machine.msg.dispenser_cleaning_required',
          'Dispenser cleaning required'
        ),
        objectnro: this.state.disable_clear
          ? t('msg.processing.ellipsis')
          : machine_state.warning.msgID,
      });
    }
    if (table_data.length === 0 && this.state.disable_clear) {
      this.setState({ disable_clear: false });
    }

    const selectRowProp = {
      mode: 'radio',
      clickToSelect: true,
      hideSelectColumn: true,
      bgColor: 'lightblue',
    };

    const columns = [
      {
        dataField: 'errorDateTime',
        text: t('lbl.dateAndTime', 'Date'),
      },
      {
        dataField: 'code',
        text: t('lbl.code_error', 'Code'),
      },
      {
        dataField: 'description',
        text: t('lbl.description', 'Description'),
      },
      {
        dataField: 'objectnro',
        text: t('lbl.objectNo', 'Object no.'),
        formatter: this.buttonFormatter,
      },
    ];
    return (
      <>
        <Row style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
          <Col className="machine-errors" style={{ direction }}>
            <CustomScrollbars
              className="br-8"
              style={{
                height: 'calc(100vh - 102px - 12rem) ',
                background: 'white',
              }}
            >
              <BootstrapTable
                keyField="objectnro"
                striped
                hover
                classes="table-light"
                data={table_data || []}
                columns={columns}
                noDataIndication={t('lbl.noErrors', 'No errors')}
                selectRow={selectRowProp}
              />
            </CustomScrollbars>
          </Col>
        </Row>
        <Row>
          <Col xs={4}>
            <Button
              color="primary"
              onClick={() => this.props.fetchMachineError(this.props.dispID)}
            >
              {t('fn.update_view', 'Update')}
            </Button>
          </Col>
          <Col xs={4} />
          <Col xs={4}>
            <Button
              color="warning"
              onClick={() => this.props.clearErrors(this.props.dispID)}
              disabled={this.accessDenied('clear_machine_errors')}
            >
              {t('fn.clear', 'Clear')}
            </Button>
          </Col>
        </Row>
      </>
    );
  }
}

MachineErrors.propTypes = propTypes;
MachineErrors.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    privileges: state.user.current_user.privileges,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      clearErrors: machineActions.clearMachineError,
      clearHopperWarning: machineActions.clearHopperWarning,
      clearDispenserWarning: machineActions.clearDispenserWarning,
      saveIntervention: maintenanceActions.saveIntervention,
      fetchMachineError: machineActions.fetchMachineError,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachineErrors)
);
