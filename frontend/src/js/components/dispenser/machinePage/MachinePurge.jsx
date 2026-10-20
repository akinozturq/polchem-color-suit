import React from 'react';
import PropTypes from 'prop-types';
import {
  Col,
  Row,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  CustomInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Table,
} from 'reactstrap';
import { propType as machineType } from 'js/redux/reducers/Machine';
import CanisterRow from './CanisterRow';
import { pad, CustomScrollbars } from 'js/mylib/Utils';
import _ from 'lodash';
import MachinePurgeStatistics from './MachinePurgeStatistics';
import { bindActionCreators } from 'redux';
import statisticActions from '../../../redux/reducers/Statistics';
import { connect } from 'react-redux';
import { rightToLeft, sortByKey } from '../../../mylib/Utils';

const propTypes = {
  t: PropTypes.func.isRequired,
  machine: machineType,
  dispID: PropTypes.string.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  setMachineConfig: PropTypes.func.isRequired,
  dbconfig: PropTypes.shape(),
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  fetchPurge: PropTypes.func.isRequired,
};

const defaultProps = {};

class MachinePurge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cnt: null,
      showPurgeStats: false,
      startAt: props.machine.config?.['purge_at_time'] || '',
    };
  }

  override = () => {
    // Overriding machine settings with values from database
    const { dbconfig, machine } = this.props;
    let conf = _.cloneDeep(machine.config);
    const keys = [
      'machine.purge_at_program_startup',
      'machine.purge_at_enabled',
      'machine.purge_at_time',
      'machine.purge_every_enabled',
      'machine.purge_every_time',
      'machine.purge_sequential',
      'machine.purge_is_skippable',
    ];
    keys.forEach((x) => {
      let c = _.get(dbconfig, [x]);
      if (c) {
        conf[x.replace('machine.', '')] = c.value;
      }
    });

    this.props.setMachineConfig(this.props.dispID, conf);
  };

  accessDenied = (key) => {
    const { privileges } = this.props;
    return !_.includes(privileges, key);
  };

  getReadOnly = (key) => {
    // Check privilege first
    if (this.accessDenied('purge_manager')) {
      return true;
    }

    const { dbconfig } = this.props;

    const v = _.get(dbconfig, 'machine.' + key);
    if (v) {
      return v.islocked;
    } else {
      return false;
    }
  };

  handleChangeTimeAtPurge = (e) => {
    this.setState({ startAt: e.target.value }, () => {
      const { config } = this.props.machine;
      config['purge_at_time'] = this.state.startAt;
      this.props.setMachineConfig(this.props.dispID, config);
    });
  };

  purgeEveryChange = () => {
    const day = document.getElementById('purge_every_day').value * 24 * 60;
    const time = document.getElementById('purge_every_time_hm').value;
    const v = time.split(':');

    const { config } = this.props.machine;
    config['purge_every_time'] = day + Math.floor(v[0]) * 60 + Math.floor(v[1]);
    this.props.setMachineConfig(this.props.dispID, config);
  };

  getAutomaticPurgeOptions = () => {
    const { t, machine, onConfigChange } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';

    if (machine.config === null) return;

    const day = Math.floor(machine.config.purge_every_time / 60 / 24);
    const hour = Math.floor(
      (machine.config.purge_every_time - day * 60 * 24) / 60
    );
    const minute = machine.config.purge_every_time - day * 60 * 24 - hour * 60;
    const every = pad(hour, 2) + ':' + pad(minute, 2);

    return (
      <Card style={{ width: '100%' }}>
        <CardHeader style={{ textAlign: isRtl ? 'right' : 'left' }}>
          {t('lbl.autoPurgeOptions', 'Automatic purge options')}
        </CardHeader>
        <CardBody style={{ padding: '0 0.5rem' }}>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td colSpan={3}>
                  <CustomInput
                    type="checkbox"
                    id="purge_at_program_startup"
                    disabled={this.getReadOnly('purge_at_program_startup')}
                    label={t('cfg.machine.purge_at_program_startup')}
                    checked={machine.config.purge_at_program_startup}
                    onChange={onConfigChange}
                  />
                </td>
                <td className={isRtl ? 'pr-16' : 'pl-16'}>
                  <CustomInput
                    type="checkbox"
                    id="purge_sequential"
                    disabled={this.getReadOnly('purge_sequential')}
                    label={t('cfg.machine.purge_sequential')}
                    checked={machine.config.purge_sequential}
                    onChange={onConfigChange}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <CustomInput
                    type="checkbox"
                    id="purge_at_enabled"
                    disabled={this.getReadOnly('purge_at_enabled')}
                    label={t('cfg.machine.purge_at_enabled')}
                    checked={machine.config.purge_at_enabled}
                    onChange={onConfigChange}
                  />
                </td>
                <td colSpan={2}>
                  <InputGroup>
                    <Input
                      type="time"
                      id="purge_at_time"
                      disabled={this.getReadOnly('purge_at_time')}
                      // value={machine.config.purge_at_time}
                      value={this.state.startAt}
                      onChange={this.handleChangeTimeAtPurge}
                      style={{
                        direction,
                        textAlign: isRtl ? 'right' : 'left',
                        borderRadius: isRtl
                          ? '0 0.25rem 0.25rem 0'
                          : '0.25rem 0 0 0.25rem',
                      }}
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText
                        style={{
                          direction,
                          borderRadius: isRtl
                            ? '0.25rem 0 0 0.25rem'
                            : '0 0.25rem 0.25rem 0',
                        }}
                      >
                        {t('symbol.time', 'h:m')}
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </td>
                <td className={isRtl ? 'pr-16' : 'pl-16'}>
                  <CustomInput
                    type="checkbox"
                    id="purge_is_skippable"
                    disabled={this.getReadOnly('purge_is_skippable')}
                    label={t('cfg.machine.purge_is_skippable')}
                    checked={machine.config.purge_is_skippable}
                    onChange={onConfigChange}
                  />
                </td>
                <td>
                  <Button
                    disabled={this.accessDenied('purge_stats')}
                    onClick={() => {
                      this.setState({ showPurgeStats: true });
                      this.props.fetchPurge(
                        null,
                        null,
                        this.props.machine.dbinfo.machineid
                      );
                    }}
                  >
                    {t('cfg.purge_stats')}
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <CustomInput
                    type="checkbox"
                    id="purge_every_enabled"
                    disabled={this.getReadOnly('purge_every_enabled')}
                    label={t('cfg.machine.purge_every_enabled')}
                    checked={machine.config.purge_every_enabled}
                    onChange={onConfigChange}
                  />
                </td>
                <td>
                  <InputGroup>
                    <Input
                      type="number"
                      id="purge_every_day"
                      disabled={this.getReadOnly('purge_every_time')}
                      value={day}
                      min={0}
                      onChange={this.purgeEveryChange}
                      style={{
                        direction,
                        borderRadius: isRtl
                          ? '0 0.25rem 0.25rem 0'
                          : '0.25rem 0 0 0.25rem',
                      }}
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText
                        style={{
                          direction,
                          borderRadius: isRtl
                            ? '0.25rem 0 0 0.25rem'
                            : '0 0.25rem 0.25rem 0',
                        }}
                      >
                        {t('symbol.days', 'days')}
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </td>
                <td>
                  <InputGroup>
                    <Input
                      type="time"
                      id="purge_every_time_hm"
                      disabled={this.getReadOnly('purge_every_time')}
                      value={every}
                      onChange={this.purgeEveryChange}
                      style={{
                        direction,
                        borderRadius: isRtl
                          ? '0 0.25rem 0.25rem 0'
                          : '0.25rem 0 0 0.25rem',
                        textAlign: isRtl ? 'right' : 'left',
                      }}
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText
                        style={{
                          direction,
                          borderRadius: isRtl
                            ? '0.25rem 0 0 0.25rem'
                            : '0 0.25rem 0.25rem 0',
                        }}
                      >
                        {t('symbol.time', 'h:m')}
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </td>
                <td colSpan={2} className={isRtl ? 'pr-16' : 'pl-16'}>
                  <Button
                    style={{ fontSize: '1.1rem' }}
                    onClick={this.override}
                    disabled={this.getReadOnly('override_local_configuration')}
                  >
                    {t(
                      'cfg.machine.override_local_configuration',
                      'Override configuration by database defaults'
                    )}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>
    );
  };

  cntFormatter(row) {
    return <CanisterRow canister={row} />;
  }

  getAutomaticPurgeFormula = () => {
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const { t, onConfigChange } = this.props;
    const { config, info } = this.props.machine;
    if (config === null) return;

    const disabled = this.accessDenied('purge_manager');

    const cnts =
      this.props.machine.colorants.length > 0
        ? this.props.machine.colorants
        : [];

    let circuitsToCnts = cnts
      .map((cnt) => {
        return cnt.circuits.map((circuit) => {
          return { circuit, cnt };
        });
      })
      .flat();

    sortByKey(circuitsToCnts, 'circuit');

    const selected_style = {
      backgroundColor: 'lightblue',
    };

    const table_data = circuitsToCnts.map((circuitCnt, idx) => (
      <tr
        key={'circuitsCnts' + idx}
        className="pointer-cursor"
        style={circuitCnt.cnt === this.state.cnt ? selected_style : null}
        onClick={() => this.setState({ cnt: circuitCnt.cnt })}
      >
        <td>{circuitCnt.cnt.id}</td>
        <td>{circuitCnt.circuit}</td>
        <td>
          <CanisterRow canister={circuitCnt.cnt} />
        </td>
        <td>
          <Input
            type="number"
            id={'purge_amounts'}
            name={idx}
            min={0}
            disabled={disabled}
            value={config.purge_amounts[idx] || ''}
            onChange={onConfigChange}
            style={{ width: '100px', height: '22px' }}
          />
        </td>
      </tr>
    ));

    return (
      <Card>
        <CardHeader style={{ textAlign: isRtl ? 'right' : 'left' }}>
          {t('lbl.autoPurgeFormula', 'Automatic purge formula')}
        </CardHeader>
        <CardBody style={{ padding: '0 0.5rem' }}>
          <CustomScrollbars
            className="bordered br-8"
            style={{ height: 'calc(100vh - 31rem)' }}
          >
            {info?.purgeAmountSupported === false && (
              <Row style={{ fontSize: 'smaller', marginTop: '0.2rem' }}>
                {t('msg.cannotSetPurgeAmounts')}
              </Row>
            )}
            <Table className="machine-purge-amounts" style={{ direction }}>
              <tbody>
                <tr>
                  <th>{t('lbl.canister', 'Canister')}</th>
                  <th>{t('lbl.circuit', 'Circuit')}</th>
                  <th>{t('lbl.colorant')}</th>
                  <th>{t('lbl.amountMl')}</th>
                </tr>

                {table_data}
              </tbody>
            </Table>
          </CustomScrollbars>
        </CardBody>
      </Card>
    );
  };

  render() {
    const { machine } = this.props;
    return (
      <>
        <Row style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
          <Col className="machine-purge">{this.getAutomaticPurgeOptions()}</Col>
        </Row>
        <Row>
          <Col className="machine-purge">{this.getAutomaticPurgeFormula()}</Col>
        </Row>

        <MachinePurgeStatistics
          showPurgeStats={this.state.showPurgeStats}
          toggle={() => this.setState({ showPurgeStats: false })}
          machine={machine}
        />
      </>
    );
  }
}

MachinePurge.propTypes = propTypes;
MachinePurge.defaultProps = defaultProps;

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchPurge: statisticActions.fetchPurge,
    },
    dispatch
  );
}

export default connect(null, mapDispatchToProps)(MachinePurge);
