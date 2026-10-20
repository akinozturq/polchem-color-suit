import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Col,
  CustomInput,
  FormGroup,
  Input,
  Label,
  Row,
} from 'reactstrap';
import _ from 'lodash';
import BootstrapTable from 'react-bootstrap-table-next';
import { rightToLeft, sortCarret } from '../../../mylib/Utils';

import CreatableSelect from 'react-select/creatable';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import actions, {
  selectors as maintenanceSelectors,
} from 'js/redux/reducers/Maintenance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Spinner from '../../shared/Spinner';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';
import {
  HTML_COLOR_BLUE,
  SERVICE_STATUS_CLOSED,
  SERVICE_STATUS_IN_PROGRESS,
  SERVICE_STATUS_OPEN,
} from 'js/Constants';
import { dateToLocaleString } from '../../../mylib/DateUtils';
import { offline_mode } from '../../../Constants';
import log from '../../../api/Logger';
import { CustomDatePicker } from '../../shared/CustomDatePicker.jsx';

const propTypes = {
  t: PropTypes.func.isRequired,
  fetchInterventions: PropTypes.func.isRequired,
  setServiceData: PropTypes.func.isRequired,
  saveIntervention: PropTypes.func.isRequired,
  deleteIntervention: PropTypes.func.isRequired,
  browseLogs: PropTypes.func.isRequired,
  maintenance: PropTypes.shape({
    save: PropTypes.shape({
      data: PropTypes.object,
      pending: PropTypes.bool,
    }),
    interventions: PropTypes.shape({
      error: PropTypes.any,
      data: PropTypes.array,
      pending: PropTypes.bool,
    }),
    set_service: PropTypes.shape({
      data: PropTypes.object,
    }),
  }),
  machine: PropTypes.shape({
    dbinfo: PropTypes.shape({
      machineid: PropTypes.number,
      nextservice: PropTypes.string,
      info: PropTypes.string,
    }),
  }),
  unseen_maintenance: PropTypes.shape({ data: PropTypes.array }),
};

const defaultProps = {};

class MachineServiceBook extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [
        { label: 'Other', value: 'Other' },
        { label: 'Calibration', value: 'Calibration' },
        { label: 'Planned maintenance', value: 'Planned maintenance' },
      ],

      edited: false,
      next_service_edited: false,

      next_service_date: null,
      manufacturing_date: null,
      serial_number: null,

      adding_new: false,
      current_case: {},
      is_saving: false,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (state.is_saving && !props.maintenance?.save?.pending) {
      const id = props.maintenance.save.data.maintenanceid;
      const current = _.find(props.maintenance.interventions.data, [
        'maintenanceid',
        id,
      ]);

      return {
        current_case: current || {},
        is_saving: false,
        adding_new: false,
      };
    } else if (props.maintenance?.save?.pending) {
      return { is_saving: true };
    }
    return null;
  }

  componentDidMount() {
    if (this.props.machine.dbinfo)
      this.props.fetchInterventions(this.props.machine.dbinfo.machineid);
  }

  saveNextService = () => {
    const next_service = this.state.next_service_date
      ? this.state.next_service_date
      : this.props.machine.dbinfo?.nextservice || '';

    let info = this.props.machine.dbinfo.info;
    if (info) {
      try {
        info = JSON.parse(info);
      } catch (e) {
        log.error(e);
      }
    }

    const serial_number = this.state.serial_number
      ? this.state.serial_number
      : _.get(info, 'serialnumber') || '';

    const manufacturing_date = this.state.manufacturing_date
      ? this.state.manufacturing_date
      : _.get(info, 'manufacturingdate') || '';

    this.setState({ next_service_edited: false });
    this.props.setServiceData(this.props.machine.dbinfo.machineid, {
      next_service: next_service,
      serial_number: serial_number,
      manufacturing_date: manufacturing_date,
    });
  };

  saveIntervention = () => {
    this.props.saveIntervention({
      machinedbid: this.props.machine.dbinfo.machineid,
      ...this.state.current_case,
    });
    this.setState({ save_pressed: true });
  };

  handleRemoveFromDB = () => {
    const mid = this.state.current_case.maintenanceid;
    if (mid) {
      this.props.deleteIntervention(mid);
    }
    this.setState({
      current_case: {},
      edited: false,
      adding_new: false,
    });
  };

  deleteIntervention = () => {
    const { t } = this.props;

    confirmAlert(
      {
        title: t(
          'msg.confirmRemoveIntervention.title',
          'Confirm intervention deletion'
        ),
        message: t(
          'msg.confirmRemoveIntervention',
          'Are you sure you want to remove intervention?'
        ),
        buttons: [
          {
            label: t('fn.yes', 'Yes'),
            onClick: this.handleRemoveFromDB,
          },
          {
            label: t('fn.no', 'No'),
          },
        ],
      },
      false
    );
  };

  handleChange = (newValue) => {
    this.setState((pre) => ({
      current_case: {
        ...pre.current_case,
        notetype: newValue ? newValue.value : null,
        edited: true,
      },
    }));
  };

  getHeader = () => {
    const { t, machine } = this.props;

    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    // Use the data from machine and if state has data then that one.
    const next_service = this.state.next_service_date
      ? this.state.next_service_date
      : machine.dbinfo?.nextservice || '';

    let info = machine.dbinfo?.info;
    if (info) {
      try {
        info = JSON.parse(info);
      } catch (e) {
        log.error(e);
      }
    }

    const serial_number = this.state.serial_number
      ? this.state.serial_number
      : _.get(info, 'serialnumber') || '';

    const manufacturing_date = this.state.manufacturing_date
      ? this.state.manufacturing_date
      : _.get(info, 'manufacturingdate') || '';

    return (
      <Row
        className="white-nowrap border-bottom settings-background p-8 br-8"
        style={{ marginTop: '0.5rem' }}
      >
        <Col xs={4} style={{ padding: 0 }}>
          <Row>
            <Col>
              <Label>{t('lbl.brand.colon', 'Brand:')}</Label>
            </Col>
            <Col>
              <Label>{_.get(machine, 'info.brand')}</Label>
            </Col>
          </Row>
          <Row>
            <Col>
              <Label>{t('lbl.model.colon', 'Model:')}</Label>
            </Col>
            <Col>
              <Label>{_.get(machine, 'info.dispenserName')}</Label>
            </Col>
          </Row>
          <Row>
            <Col>
              <Label>{t('lbl.canisterCount.colon', 'Canister count:')}</Label>
            </Col>
            <Col>
              <Label>{_.get(machine, 'info.canisterCount')}</Label>
            </Col>
          </Row>
        </Col>
        <Col xs={1} />
        <Col xs={7}>
          <Row>
            <Col xs={5} className="p-0">
              <Label>
                {t('lbl.manufacturing_date.colon', 'Manufacturing date:')}
              </Label>
            </Col>
            <Col
              style={{
                display: 'flex',
                justifyItems: isRtl ? 'right' : 'left',
              }}
            >
              <CustomDatePicker
                id="manufacturingDate"
                selected={manufacturing_date}
                onChange={(date) =>
                  this.setState({
                    next_service_edited: true,
                    manufacturing_date: date,
                  })
                }
                direction={direction}
                className="white-nowrap height-1-75rem form-control-plaintext black-on-focus"
              />
            </Col>
          </Row>
          <Row>
            <Col xs={5} className="p-0">
              <Label>{t('lbl.serial_number.colon', 'Serial number:')}</Label>
            </Col>
            <Col>
              <Input
                className="white-nowrap height-1-75rem  black-on-focus"
                type="text"
                plaintext={true}
                id="serial_number"
                onChange={(evt) =>
                  this.setState({
                    next_service_edited: true,
                    serial_number: evt.target.value,
                  })
                }
                value={serial_number}
              />
            </Col>
          </Row>
          <Row className="align-items-baseline">
            <Col xs={5} className="p-0">
              <Label>{t('lbl.next_service.colon', 'Next service:')}</Label>
            </Col>
            <Col style={{ justifyItems: isRtl ? 'right' : 'left' }}>
              <CustomDatePicker
                selected={next_service}
                onChange={(date) =>
                  this.setState({
                    next_service_edited: true,
                    next_service_date: date,
                  })
                }
                direction={direction}
                className="white-nowrap height-1-75rem form-control-plaintext black-on-focus"
              />
            </Col>
            <Col>
              <Button
                className="btn-small height-1-75rem"
                disabled={!this.state.next_service_edited}
                onClick={this.saveNextService}
              >
                {t('fn.save', 'Save')}
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  };

  dateFormatter = (cell, row) => {
    const { unseen_maintenance } = this.props;
    if (
      unseen_maintenance.data
        .map((z) => z.maintenanceid)
        .includes(row.maintenanceid)
    ) {
      return (
        <div>
          <FontAwesomeIcon
            icon="exclamation-triangle"
            style={{
              color: HTML_COLOR_BLUE,
              height: '20px',
              width: '20px',
              position: 'relative',
            }}
          />
          {dateToLocaleString(cell)}
        </div>
      );
    }
    return dateToLocaleString(cell);
  };

  statusFormatter(cell) {
    if (cell === SERVICE_STATUS_OPEN) {
      return (
        <FontAwesomeIcon
          icon="play"
          style={{
            color: 'blue',
          }}
        />
      );
    } else if (cell === SERVICE_STATUS_IN_PROGRESS) {
      return (
        <FontAwesomeIcon
          icon="cog"
          style={{
            color: 'white',
          }}
          //spin
        />
      );
    } else {
      return (
        <FontAwesomeIcon
          icon="check"
          style={{
            color: 'green',
          }}
        />
      );
    }
  }

  statusChanged = (status) => {
    this.setState((pre) => ({
      ...pre,
      current_case: { ...pre.current_case, notestatus: status, edited: true },
      edited: true,
    }));
  };

  changeInteraction = (item) => {
    this.setState({
      current_case: item,
      edited: false,
      adding_new: false,
    });
  };

  getNotes = () => {
    const { t, maintenance } = this.props;

    const current_case = this.state.current_case;

    const disable =
      !this.state.adding_new &&
      _.get(current_case, 'maintenanceid') === undefined;

    const disable_delete = !(
      _.get(current_case, 'maintenanceid') !== undefined &&
      _.get(current_case, 'notestatus') !== SERVICE_STATUS_CLOSED
    );

    const saving = maintenance.save.pending;

    const save_disabled =
      !this.state.edited ||
      disable ||
      saving ||
      !this.state.current_case.notetype ||
      !this.state.current_case.notestatus ||
      !(this.state.current_case.reason || this.state.current_case.resolution);

    const data_options = maintenance.interventions.data
      ? maintenance.interventions.data.map((x) => ({
          value: x.notetype,
          label: x.notetype,
        }))
      : [];

    const possible_options = _.unionBy(
      this.state.options,
      data_options,
      'value'
    );

    const selectRowProp = {
      mode: 'radio',
      clickToSelect: true,
      hideSelectColumn: true,
      bgColor: 'lightblue',
      onSelect: this.changeInteraction,
      selected: [this.state.current_case?.maintenanceid],
    };

    const columns = [
      {
        dataField: 'modificationdatetime',
        text: t('lbl.date', 'Date'),
        formatter: this.dateFormatter,
        sort: true,
        sortCaret: sortCarret,
      },
      {
        dataField: 'notetype',
        text: t('lbl.type', 'Type'),
        sort: true,
        sortCaret: sortCarret,
      },
      {
        dataField: 'notestatus',
        text: '',
        formatter: this.statusFormatter,
        sort: true,
        sortCaret: sortCarret,
      },
    ];

    return (
      <Row className="white-nowrap mt-8 settings-background p-8 br-8">
        <Col xs={5} className="p-0 border-right pr-16">
          <Row className="mb-2">
            <Col xs={8} className="p-0 align-self-center">
              <Label className="m-auto">
                {t('lbl.interventions', 'Interventions')}
              </Label>
            </Col>
            <Col>
              <Button
                className="btn-small height-100"
                disabled={
                  maintenance.interventions.error ||
                  maintenance.interventions.pending ||
                  this.state.adding_new
                }
                onClick={() =>
                  this.setState({ adding_new: true, current_case: {} })
                }
              >
                {t('fn.new', 'New')}
              </Button>
            </Col>
          </Row>
          <Row className="mb-2">
            <Col>
              <div
                className="scroll"
                style={{
                  whiteSpace: 'break-spaces',
                  maxHeight: 'calc(100vh - 102px - 18rem)',
                }}
              >
                <BootstrapTable
                  classes="table-layout-auto"
                  keyField="maintenanceid"
                  hover
                  data={maintenance.interventions.data}
                  columns={columns}
                  noDataIndication={() =>
                    maintenance.interventions.error ||
                    maintenance.interventions.pending
                      ? t('msg.searching.ellipsis', 'Searching...')
                      : t('lbl.no_interventions', 'No interventions')
                  }
                  selectRow={selectRowProp}
                  defaultSorted={[
                    { dataField: 'modificationdatetime', order: 'desc' },
                  ]}
                />
              </div>
            </Col>
          </Row>
        </Col>

        <Col
          xs={7}
          className="p-0 scroll "
          style={{ maxHeight: 'calc(100vh - 102px - 16rem)' }}
        >
          <Row
            style={{ fontSize: 'large', fontWeight: 'bold' }}
            className="mb-1"
          >
            <Col xs={4}>
              <Label>{t('lbl.case_number.colon', 'Case number:')}</Label>
            </Col>
            <Col xs={8}>
              <Label>
                {_.get(current_case, 'maintenanceid')
                  ? '#' + _.get(current_case, 'maintenanceid')
                  : this.state.adding_new
                    ? t('lbl.new', 'New')
                    : ''}
              </Label>
            </Col>
          </Row>
          <Row className="mb-1">
            <Col xs={4}>
              <Label>{t('lbl.contact_type.colon', 'Contact type:')}</Label>
            </Col>
            <Col xs={8}>
              <CreatableSelect
                isClearable
                isDisabled={disable}
                onChange={this.handleChange}
                value={{
                  label: current_case.notetype,
                  value: current_case.notetype,
                }}
                options={possible_options}
                styles={{
                  option: (base) => ({ ...base, color: 'black' }),
                }}
              />
            </Col>
          </Row>
          <Row className="mb-1">
            <Col xs={4} />
            <Col xs={2}>
              <CustomInput
                disabled={disable}
                className="z-index-0"
                type="radio"
                id="status_open"
                label={t('lbl.open', 'Open')}
                checked={current_case.notestatus === SERVICE_STATUS_OPEN}
                onChange={() => this.statusChanged(SERVICE_STATUS_OPEN)}
              />
            </Col>
            <Col xs={3} className="p-0">
              <CustomInput
                disabled={disable}
                className="z-index-0"
                type="radio"
                id="status_in_progress"
                label={t('lbl.in_progress', 'In progress')}
                checked={current_case.notestatus === SERVICE_STATUS_IN_PROGRESS}
                onChange={() => this.statusChanged(SERVICE_STATUS_IN_PROGRESS)}
              />
            </Col>
            <Col xs={3} className="p-0">
              <CustomInput
                disabled={disable}
                className="z-index-0"
                type="radio"
                id="status_closed"
                label={t('lbl.closed', 'Closed')}
                checked={current_case.notestatus === SERVICE_STATUS_CLOSED}
                onChange={() => this.statusChanged(SERVICE_STATUS_CLOSED)}
              />
            </Col>
          </Row>
          <Row className="mb-1">
            <Col xs={4}>
              <Label>{t('lbl.contact_reason.colon', 'Contact reason:')}</Label>
            </Col>
            <Col xs={8}>
              <Input
                type="textarea"
                disabled={disable}
                name="text"
                id="reason"
                value={current_case.reason || ''}
                onChange={(evt) => {
                  const value = evt.target.value;
                  this.setState((pre) => ({
                    ...pre,
                    edited: true,
                    current_case: {
                      ...pre.current_case,
                      reason: value,
                    },
                  }));
                }}
              />
            </Col>
          </Row>
          <Row className="mb-1">
            <Col xs={4}>
              <Label>
                {t(
                  'lbl.actions_and_resolutions.colon',
                  'Actions and resolutions:'
                )}
              </Label>
            </Col>
            <Col xs={8}>
              <Input
                type="textarea"
                disabled={disable}
                name="text"
                id="resolution"
                value={current_case.resolution || ''}
                onChange={(evt) => {
                  const value = evt.target.value;
                  this.setState((pre) => ({
                    ...pre,
                    edited: true,
                    current_case: {
                      ...pre.current_case,
                      resolution: value,
                    },
                  }));
                }}
              />
            </Col>
          </Row>

          <Row className="mb-1">
            <Col xs={8}>
              {!this.state.adding_new &&
                (current_case.logfilepath ? (
                  <Label>
                    {t(
                      'lbl.availableLogs',
                      'Log files available "{{logfilepath}}"',
                      current_case
                    )}
                  </Label>
                ) : (
                  <Label>{t('lbl.noLogFiles', 'No log files')}</Label>
                ))}

              <FormGroup
                check
                style={!this.state.adding_new ? { display: 'none' } : {}}
              >
                <Label check>
                  <Input
                    type="checkbox"
                    checked={
                      this.state.adding_new ? current_case.include_logs : false
                    }
                    disabled={disable || !this.state.adding_new}
                    onClick={(evt) => {
                      const checked = evt.target.checked;
                      this.setState((pre) => ({
                        current_case: {
                          ...pre.current_case,
                          include_logs: checked,
                        },
                      }));
                    }}
                  />{' '}
                  {t('lbl.include_logs', 'Include log files')}
                </Label>
              </FormGroup>
            </Col>
            <Col xs={4}>
              <Button
                className="btn-small height-100"
                style={!current_case.logfilepath ? { display: 'none' } : {}}
                onClick={() =>
                  this.props.browseLogs(current_case.maintenanceid)
                }
              >
                {t('fn.browse_logs', 'Browse')}
              </Button>
            </Col>
          </Row>
          <Row className="mb-1">
            <Col xs={4}>
              <Button
                disabled={disable_delete}
                color="danger"
                className="btn-small height-100"
                onClick={this.deleteIntervention}
              >
                {t('fn.delete', 'Delete')}
                {saving && <Spinner />}
              </Button>
            </Col>
            <Col xs={4} />
            <Col xs={4}>
              <Button
                className="btn-small height-100"
                disabled={save_disabled}
                onClick={this.saveIntervention}
              >
                {t('fn.save', 'Save')}
                {saving && <Spinner />}
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  };

  render() {
    const { t } = this.props;

    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';

    if (offline_mode) {
      return (
        <Label className="white-nowrap">
          {t('lbl.notAvailableOffline', 'Not available in offline mode')}
        </Label>
      );
    }

    return (
      <div className="machine-maintenance" style={{ direction }}>
        {this.getHeader()}
        {this.getNotes()}
      </div>
    );
  }
}

MachineServiceBook.propTypes = propTypes;
MachineServiceBook.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    maintenance: state.maintenance,
    unseen_maintenance: maintenanceSelectors.unseen(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchInterventions: actions.fetchInterventions,
      saveIntervention: actions.saveIntervention,
      setServiceData: actions.setServiceData,
      deleteIntervention: actions.deleteIntervention,
      browseLogs: actions.browseLogs,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachineServiceBook)
);
