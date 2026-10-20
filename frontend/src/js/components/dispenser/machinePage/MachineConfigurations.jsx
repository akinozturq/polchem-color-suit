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
} from 'reactstrap';
import { propType as machineType } from 'js/redux/reducers/Machine';
import { PUNCH_LOGIC_LIST } from '../../../Constants';
import { CustomScrollbars, rightToLeft } from 'js/mylib/Utils';

import _ from 'lodash';

const propTypes = {
  t: PropTypes.func.isRequired,
  machine: machineType,
  onConfigChange: PropTypes.func.isRequired,
  dispID: PropTypes.string.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  dbconfig: PropTypes.shape(),
  setMachineConfig: PropTypes.func.isRequired,
};

const defaultProps = {};

export default class MachineConfigurations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  override = () => {
    // Overriding machine settings with values from database
    const { dbconfig, machine } = this.props;
    let conf = _.cloneDeep(machine.config);
    const keys = [
      'machine.auto_can_in',
      'machine.auto_can_in_delay',
      'machine.auto_can_removal',
      'machine.auto_close_driver_messages',
      'machine.auto_reset_on_error',
      'machine.batch_refill',
      'machine.can_removal_control',
      'machine.canister_barcode_confirmation',
      'machine.check_can_before_tinting',
      'machine.colorant_barcode_confirmation',
      'machine.formula_splitting',
      'machine.lock_ui_during_tinting',
      'machine.minimum_dosable_amount',
      'machine.punch_confirmation',
      'machine.punch_logic',
      'machine.remove_incompatible_colorants',
      'machine.show_warning_level_message',
      'machine.skip_gravimetric_summary',
      'machine.skip_place_can_message',
      'machine.skip_remove_can_message',
    ];
    keys.forEach((x) => {
      let c = _.get(dbconfig, [x]);
      if (c) {
        conf[x.replace('machine.', '')] = c.value;
      }
    });

    this.props.setMachineConfig(this.props.dispID, conf);
  };

  getReadOnly = (key) => {
    // Check privilege first
    const { dbconfig, privileges } = this.props;
    if (!_.includes(privileges, 'dispenser_configuration')) {
      return true;
    }

    const v = _.get(dbconfig, 'machine.' + key);
    if (v) {
      return v.islocked;
    } else {
      return false;
    }
  };

  getDispenserOptions = (isRtl, direction) => {
    const { t, onConfigChange } = this.props;
    const { config } = this.props.machine;

    if (!config) return;

    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const rowDirection = 'row';
    const sidePaddingClass = isRtl ? 'pr-16' : 'pl-16';

    return (
      <Card style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
        <CardHeader style={alignStyle} dir={direction}>
          {t('lbl.dispenserOptions', 'Dispenser options')}
        </CardHeader>
        <CardBody style={{ padding: '0 0.5rem', ...alignStyle }}>
          <div>
            <Row style={{ flexDirection: rowDirection }}>
              <Col className={sidePaddingClass}>
                <Row className="m-1">
                  <Col>
                    {t(
                      'cfg.machine.small_dose_warning_level',
                      'Small dose warning level'
                    )}
                    :
                  </Col>
                  <Col lg={4} className={sidePaddingClass}>
                    <InputGroup>
                      <Input
                        type="number"
                        id="minimum_dosable_amount"
                        disabled={this.getReadOnly('minimum_dosable_amount')}
                        value={config.minimum_dosable_amount}
                        onChange={onConfigChange}
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
                          ml
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </Col>
                </Row>
                <Row className="m-1">
                  <CustomInput
                    type="checkbox"
                    id="batch_refill"
                    disabled={this.getReadOnly('batch_refill')}
                    checked={config.batch_refill}
                    onChange={onConfigChange}
                    label={t('cfg.machine.batch_refill')}
                  />
                </Row>
                <Row className="m-1">
                  <CustomInput
                    type="checkbox"
                    id="lock_ui_during_tinting"
                    disabled={this.getReadOnly('lock_ui_during_tinting')}
                    checked={config.lock_ui_during_tinting}
                    onChange={onConfigChange}
                    label={t('cfg.machine.lock_ui_during_tinting')}
                  />
                </Row>
              </Col>
              <Col className={sidePaddingClass}>
                <Row className="m-1">
                  <CustomInput
                    type="checkbox"
                    id="colorant_barcode_confirmation"
                    disabled={this.getReadOnly('colorant_barcode_confirmation')}
                    checked={config.colorant_barcode_confirmation}
                    onChange={onConfigChange}
                    label={t(
                      'cfg.machine.colorant_barcode_confirmation',
                      'Require colorant barcode'
                    )}
                  />
                </Row>
                <Row className="m-1">
                  <CustomInput
                    type="checkbox"
                    id="canister_barcode_confirmation"
                    disabled={
                      this.getReadOnly('canister_barcode_confirmation') ||
                      !config.colorant_barcode_confirmation
                    }
                    checked={config.canister_barcode_confirmation}
                    onChange={onConfigChange}
                    label={t(
                      'cfg.machine.canister_barcode_confirmation',
                      'Require canister barcode'
                    )}
                  />
                </Row>
                <Row className="m-1">
                  <Col className={sidePaddingClass}>
                    <Button
                      style={{ fontSize: '1.1rem' }}
                      onClick={this.override}
                      disabled={this.getReadOnly(
                        'override_local_configuration'
                      )}
                    >
                      {t(
                        'cfg.machine.override_local_configuration',
                        'Override configuration by database defaults'
                      )}
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        </CardBody>
      </Card>
    );
  };

  getCanSensorHandling = (isRtl, direction) => {
    const { t, onConfigChange } = this.props;
    const { config } = this.props.machine;

    if (config === null) return;

    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };

    return (
      <Card>
        <CardHeader style={alignStyle} dir={direction}>
          {t('lbl.canSensorHandling', 'Can sensor handling')}
        </CardHeader>
        <CardBody style={{ padding: '0 0.5rem', ...alignStyle }}>
          <CustomInput
            type="checkbox"
            id="auto_can_in"
            label={t('cfg.machine.auto_can_in')}
            disabled={this.getReadOnly('auto_can_in')}
            checked={config.auto_can_in}
            onChange={onConfigChange}
          />
          <InputGroup>
            <Input
              placeholder={t('prompt.delay')}
              type="number"
              id="auto_can_in_delay"
              disabled={this.getReadOnly('auto_can_in_delay')}
              value={config.auto_can_in_delay}
              onChange={onConfigChange}
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
                  borderRadius: isRtl
                    ? '0.25rem 0 0 0.25rem'
                    : '0 0.25rem 0.25rem 0',
                }}
              >
                s
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <CustomInput
            type="checkbox"
            id="auto_can_removal"
            label={t('cfg.machine.auto_can_removal')}
            disabled={this.getReadOnly('auto_can_removal')}
            checked={config.auto_can_removal}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="can_removal_control"
            label={t('cfg.machine.can_removal_control')}
            disabled={this.getReadOnly('can_removal_control')}
            checked={config.can_removal_control}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="check_can_before_tinting"
            label={t('cfg.machine.check_can_before_tinting')}
            disabled={this.getReadOnly('check_can_before_tinting')}
            checked={config.check_can_before_tinting}
            onChange={onConfigChange}
          />
        </CardBody>
      </Card>
    );
  };

  getControllerOptions = (isRtl, direction) => {
    const { t, onConfigChange } = this.props;
    const { config } = this.props.machine;

    if (config == null) return;

    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };

    return (
      <Card style={{ height: '100%' }}>
        <CardHeader style={alignStyle} dir={direction}>
          {t('lbl.controllerOptions', 'Controller options')}
        </CardHeader>
        <CardBody style={{ padding: '0 0.5rem', ...alignStyle }}>
          <CustomInput
            type="checkbox"
            id="auto_reset_on_error"
            label={t('cfg.machine.auto_reset_on_error')}
            disabled={this.getReadOnly('auto_reset_on_error')}
            checked={config.auto_reset_on_error}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="show_warning_level_message"
            label={t('cfg.machine.show_warning_level_message')}
            disabled={this.getReadOnly('show_warning_level_message')}
            checked={config.show_warning_level_message}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="auto_close_driver_messages"
            label={t('cfg.machine.auto_close_driver_messages')}
            disabled={this.getReadOnly('auto_close_driver_messages')}
            checked={config.auto_close_driver_messages}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="skip_place_can_message"
            label={t('cfg.machine.skip_place_can_message')}
            disabled={this.getReadOnly('skip_place_can_message')}
            checked={config.skip_place_can_message}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="skip_remove_can_message"
            label={t('cfg.machine.skip_remove_can_message')}
            disabled={this.getReadOnly('skip_remove_can_message')}
            checked={config.skip_remove_can_message}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="formula_splitting"
            label={t('cfg.machine.formula_splitting')}
            disabled={this.getReadOnly('formula_splitting')}
            checked={config.formula_splitting}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="remove_incompatible_colorants"
            label={t('cfg.machine.remove_incompatible_colorants')}
            disabled={this.getReadOnly('remove_incompatible_colorants')}
            checked={config.remove_incompatible_colorants}
            onChange={onConfigChange}
          />
          <CustomInput
            type="checkbox"
            id="punch_confirmation"
            label={t('cfg.machine.punch_confirmation')}
            disabled={this.getReadOnly('punch_confirmation')}
            checked={config.punch_confirmation}
            onChange={onConfigChange}
          />

          <Input
            type="select"
            id="punch_logic"
            disabled={this.getReadOnly('punch_logic')}
            value={config.punch_logic}
            onChange={onConfigChange}
            style={{ direction }}
          >
            {Object.keys(PUNCH_LOGIC_LIST).map((key) => {
              return (
                <option key={key} value={key}>
                  {t('opt.punch_logic.' + key)}
                </option>
              );
            })}
          </Input>
        </CardBody>
      </Card>
    );
  };

  getDispenserSpecificOptions = (isRtl, direction) => {
    const { t, onConfigChange } = this.props;
    const { config } = this.props.machine;

    if (config === null) return;

    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };

    return (
      <Card className="mt-16">
        <CardHeader style={alignStyle} dir={direction}>
          {t('lbl.dispenserSpecificOptions', 'Dispenser specific options')}
        </CardHeader>
        <CardBody style={{ padding: '0 0.5rem', ...alignStyle }}>
          <CustomInput
            type="checkbox"
            id="use_manual_puncher"
            label={t('cfg.machine.use_manual_puncher')}
            checked={config.use_manual_puncher}
            onChange={onConfigChange}
          />
        </CardBody>
      </Card>
    );
  };

  render() {
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const rowDirection = isRtl ? 'row-reverse' : 'row';
    const leftColumnSpacing = { marginRight: '0.2rem' };
    const rightColumnSpacing = { marginLeft: '0.2rem' };

    return (
      <CustomScrollbars
        className="machine-configurations"
        style={{
          height: 'calc(100vh - 102px - 7rem)',
          direction,
        }}
      >
        <Row style={{ marginBottom: '0.5rem' }}>
          <Col>{this.getDispenserOptions(isRtl, direction)}</Col>
        </Row>
        <Row style={{ flexDirection: rowDirection }}>
          <Col style={leftColumnSpacing}>
            {this.getCanSensorHandling(isRtl, direction)}
            {this.getDispenserSpecificOptions(isRtl, direction)}
          </Col>
          <Col style={rightColumnSpacing}>
            {this.getControllerOptions(isRtl, direction)}
          </Col>
        </Row>
      </CustomScrollbars>
    );
  }
}

MachineConfigurations.propTypes = propTypes;
MachineConfigurations.defaultProps = defaultProps;
