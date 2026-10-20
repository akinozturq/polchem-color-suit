import React from 'react';
// import { NavLink } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { selectors as configSelectors } from 'js/redux/reducers/Configuration';
import { RGBColorToHex } from 'js/mylib/Utils';
import spectroActions, { selectors } from 'js/redux/reducers/Spectro';
import {
  Button,
  CardBody,
  Row,
  Col,
  Input,
  CustomInput,
  FormGroup,
  Label,
  Card,
  CardHeader,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Select from 'react-select';
import { COLDATACLASS_45 } from '../../../Constants';
import { rightToLeft } from '../../../mylib/Utils';

const customControlStyles = (base) => ({
  ...base,
  height: 20,
});

class Spectro extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      new_driver: null,
      new_port: null,
      new_address: null,
    };

    this.onDriverChange = this.onDriverChange.bind(this);
    this.onDriverApply = this.onDriverApply.bind(this);
    this.onPortChange = this.onPortChange.bind(this);
    this.onPortApply = this.onPortApply.bind(this);
  }

  componentDidMount() {
    this.props.fetchSpectroConfig();
  }

  onDriverChange(value) {
    this.setState({
      new_driver: value,
      new_port: null,
      new_address: null,
    });
  }

  onDriverApply() {
    this.props.setSpectroDriver(this.state.new_driver);
    this.setState({
      new_driver: null,
      new_port: null,
      new_address: null,
    });
  }

  onPortChange(value) {
    this.setState({ new_port: value });
  }
  onAddressChange(value) {
    this.setState({ new_address: value });
  }

  onPortApply() {
    const port = this.state.new_port || this.props.spectro_config.selected_port;
    const address = this.state.new_address || this.props.spectro_config.address;
    this.props.setSpectroPort(port, address);
    this.setState({ new_port: null, new_address: null });
  }

  getPortSelect = () => {
    const { t, spectro_config } = this.props;
    const { selected_port } = spectro_config;
    const { new_port, new_address } = this.state;
    const show_address =
      spectro_config.port_parameters?.[new_port || selected_port] === 'address';

    const button = (
      <Button
        className="button-small"
        disabled={
          (new_port == null && new_address == null) ||
          this.props.accessDenied('spectro_config')
        }
        data-denied={this.props.accessDenied('spectro_config')}
        onClick={this.onPortApply}
      >
        {t('fn.apply', 'Apply')}
      </Button>
    );

    return (
      <>
        <Row>
          <Col className="col-p-8" style={{ margin: 'auto' }}>
            {t('lbl.port', 'Port')}:
          </Col>
          <Col className="col-p-8">
            <Select
              key={
                spectro_config.driver_name
                // key change creates fresh Select with defaultValue reapplied
              }
              menuPlacement="auto"
              styles={{
                control: customControlStyles,
                option: (base) => ({ ...base, color: 'black' }),
              }}
              isSearchable={false}
              onChange={(value) => this.onPortChange(value.value)}
              isDisabled={this.props.accessDenied('spectro_config')}
              options={spectro_config.ports.map((name) => ({
                label: name,
                value: name,
              }))}
              defaultValue={{
                label: selected_port,
                value: selected_port,
              }}
            />
          </Col>
          <Col className="col-p-8" style={{ margin: 'auto' }}>
            {!show_address && button}
          </Col>
        </Row>
        {show_address && (
          <Row>
            <Col className="col-p-8" style={{ margin: 'auto' }}>
              {t('lbl.ipAddress', 'IP address')}:
            </Col>

            <Col className="col-p-8" style={{ margin: 'auto' }}>
              <Input
                disabled={this.props.accessDenied('spectro_config')}
                type="text"
                defaultValue={spectro_config.address}
                onChange={(e) => this.onAddressChange(e.target.value)}
              />
            </Col>
            <Col className="col-p-8" style={{ margin: 'auto' }}>
              {button}
            </Col>
          </Row>
        )}
      </>
    );
  };

  getCheckSpectro = () => {
    const { t, spectro_status, spectro_busy } = this.props;
    return (
      <Row>
        <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
          <Button
            className="button-small"
            disabled={spectro_busy || this.props.accessDenied('spectro_test')}
            data-denied={this.props.accessDenied('spectro_test')}
            onClick={this.props.fetchSpectroStatus}
          >
            {spectro_busy && <FontAwesomeIcon icon="spinner" spin />}{' '}
            {t('fn.checkStatus', 'Check status')}
          </Button>
        </Col>
        <Col className="col-p-8" style={{ margin: 'auto' }}>
          <Input
            value={
              spectro_status && spectro_status.calibrationNeeded != null
                ? spectro_status.calibrationNeeded
                  ? t('lbl.calibrationNeeded', 'Calibration needed')
                  : t('lbl.calibrationOk', 'Calibration OK')
                : ''
            }
            readOnly={true}
            disabled={spectro_busy}
          />
        </Col>
      </Row>
    );
  };

  getCalibrateMeasure = () => {
    const { t, spectro_status, spectro_busy, spectro_measurement } = this.props;

    return (
      spectro_status && (
        <Row>
          <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
            {spectro_status.calibrationSequence?.length && (
              <Button
                className="button-small"
                onClick={this.props.calibrate}
                disabled={spectro_busy}
              >
                {spectro_busy && <FontAwesomeIcon icon="spinner" spin />}{' '}
                {t('fn.calibrate', 'Calibrate')}
              </Button>
            )}
          </Col>
          <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
            <Button
              className="button-small"
              onClick={this.props.measureTarget}
              disabled={spectro_status.calibrationNeeded || spectro_busy}
            >
              {' '}
              {spectro_busy ? (
                <FontAwesomeIcon icon="spinner" spin />
              ) : (
                <FontAwesomeIcon icon="camera-retro" />
              )}{' '}
              {t('fn.measure', 'Measure')}
            </Button>
          </Col>
          <Col className="col-p-8" style={{ margin: 'auto' }}>
            {spectro_measurement && (
              <div
                style={{
                  backgroundColor: RGBColorToHex(
                    this.props.spectro_measurement.rgb
                  ),
                  borderRadius: '0.5rem',
                  width: '100%',
                  height: '2rem',
                  boxShadow:
                    '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
                }}
              />
            )}
          </Col>
        </Row>
      )
    );
  };

  setAperatureGeometryUVmode = (key, value) => {
    const { spectro_status } = this.props;
    const { aperture, specularMode, uvMode } = {
      ...spectro_status,
      [key]: value,
    };
    this.props.setSpectroMode(aperture, specularMode, uvMode);
  };

  getSpectroStatus = () => {
    const { t, spectro_status, spectro_busy } = this.props;
    return (
      <>
        <Row>
          <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
            {t('lbl.modelName', 'Model name')}:
          </Col>
          <Col className="col-p-8" style={{ margin: 'auto' }}>
            <Input
              value={spectro_status.modelName}
              readOnly
              disabled={spectro_busy}
            />
          </Col>
        </Row>
        {spectro_status.specularModes.length > 1 && (
          <Row>
            <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
              {t('lbl.specularMode', 'Specular mode')}:
            </Col>
            <Col className="col-p-8">
              <Select
                menuPlacement="auto"
                styles={{
                  control: customControlStyles,
                  option: (base) => ({ ...base, color: 'black' }),
                }}
                isSearchable={false}
                isDisabled={spectro_busy}
                onChange={(value) =>
                  this.setAperatureGeometryUVmode('specularMode', value.value)
                }
                options={spectro_status.specularModes.map((name) => ({
                  label: name,
                  value: name,
                }))}
                defaultValue={{
                  label: spectro_status.specularMode,
                  value: spectro_status.specularMode,
                }}
              ></Select>
            </Col>
          </Row>
        )}
        {spectro_status.apertures.length > 1 && (
          <Row>
            <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
              {t('lbl.aperture', 'Aperture')}:
            </Col>
            <Col className="col-p-8">
              <Select
                menuPlacement="auto"
                styles={{
                  control: customControlStyles,
                  option: (base) => ({ ...base, color: 'black' }),
                }}
                isSearchable={false}
                isDisabled={spectro_busy}
                onChange={(value) =>
                  this.setAperatureGeometryUVmode('aperture', value.value)
                }
                options={spectro_status.apertures.map((name) => ({
                  label: name,
                  value: name,
                }))}
                defaultValue={{
                  label: spectro_status.aperture,
                  value: spectro_status.aperture,
                }}
              ></Select>
            </Col>
          </Row>
        )}
        {spectro_status.uvModes.length > 1 && (
          <Row>
            <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
              {t('lbl.uvMode', 'UV mode')}:
            </Col>
            <Col className="col-p-8">
              <Select
                menuPlacement="auto"
                styles={{
                  control: customControlStyles,
                  option: (base) => ({ ...base, color: 'black' }),
                }}
                isSearchable={false}
                isDisabled={spectro_busy}
                onChange={(value) =>
                  this.setAperatureGeometryUVmode('uvMode', value.value)
                }
                options={spectro_status.uvModes.map((name) => ({
                  label: name,
                  value: name,
                }))}
                defaultValue={{
                  label: spectro_status.uvMode,
                  value: spectro_status.uvMode,
                }}
              ></Select>
            </Col>
          </Row>
        )}
      </>
    );
  };

  render() {
    const {
      t,
      spectro_busy,
      spectro_config,
      spectro_model_info,
      spectro_error,
      spectro_status,
      spectro_has_button_option,
    } = this.props;

    const direction = rightToLeft() ? 'rtl' : 'ltr';

    const model_info = spectro_model_info || {};
    let drivers = spectro_config
      ? spectro_config.drivers.map((name) => ({ label: name, value: name }))
      : [];
    drivers.unshift({
      label: '-- ' + t('lbl.disabled', 'disabled') + ' --',
      value: '',
    });

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          {t('cfg.spectro_setup', 'Spectro')}
        </CardHeader>
        <CardBody className="scroll config-card-body" dir={direction}>
          <Row>
            {' '}
            {/** Driver select */}
            <Col className="col-p-8" style={{ margin: 'auto' }}>
              {t('lbl.spectroDriver', 'Spectro driver')}:
            </Col>
            <Col className="col-p-8" style={{ margin: 'auto' }}>
              {spectro_config ? (
                <Select
                  menuPlacement="auto"
                  styles={{
                    control: customControlStyles,
                    option: (base) => ({ ...base, color: 'black' }),
                  }}
                  isSearchable={false}
                  onChange={(value) => this.onDriverChange(value.value)}
                  isDisabled={this.props.accessDenied('spectro_config')}
                  options={drivers}
                  defaultValue={{
                    label: spectro_config.driver_name,
                    value: spectro_config.driver_name,
                  }}
                />
              ) : (
                t('lbl.notAvailable', 'not available')
              )}
            </Col>
            <Col className="col-p-8">
              <Button
                className="button-small"
                disabled={
                  this.state.new_driver === null ||
                  this.props.accessDenied('spectro_config')
                }
                data-denied={this.props.accessDenied('spectro_config')}
                onClick={this.onDriverApply}
              >
                {t('fn.apply', 'Apply')}
              </Button>
            </Col>
          </Row>
          {/** Port select */}
          {spectro_config &&
            spectro_config.ports.length > 0 &&
            this.getPortSelect()}

          {/** Install button */}
          {model_info.installSequence && (
            <Row>
              <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
                <Button
                  className="button-small"
                  disabled={spectro_busy}
                  onClick={this.props.install}
                >
                  {t('fn.install', 'Install')}
                </Button>
              </Col>
              <Col className="col-p-8" style={{ margin: 'auto' }}>
                <Input
                  value={
                    model_info.installStatus
                      ? t('lbl.installationOK', 'Installation OK')
                      : t('lbl.installationNeeded', 'Installation needed')
                  }
                  readOnly={true}
                  disabled={spectro_busy}
                />
              </Col>
            </Row>
          )}

          {/** Configure button */}
          {spectro_config?.driver_info?.silentConfigure === false && (
            <Row>
              <Col />
              <Col xs={4} className="col-p-8" style={{ margin: 'auto' }}>
                <Button
                  className="button-small"
                  disabled={spectro_busy}
                  onClick={this.props.configure}
                >
                  {t('fn.configure', 'Configure')}
                </Button>
              </Col>
            </Row>
          )}

          {/** Check status button */}
          {this.getCheckSpectro()}
          {spectro_status && this.getSpectroStatus()}

          {/** Spectro checkboxes*/}
          <div style={{ padding: '1rem 0' }}>
            {spectro_status?.coldataClass === COLDATACLASS_45 && (
              <FormGroup row>
                <Label sm={5}>
                  {t(
                    'cfg.spectro_gloss_compensation',
                    'Enable gloss compensation'
                  )}
                </Label>
                <Col sm={7} style={{ paddingTop: '0.5rem', zIndex: '0' }}>
                  <CustomInput
                    type="checkbox"
                    checked={this.props.config.spectro_gloss_compensation.value}
                    disabled={
                      this.props.config.spectro_gloss_compensation.islocked ||
                      this.props.accessDenied('spectro_gloss_compensation')
                    }
                    id={'spectro_gloss_compensation'}
                    onChange={(event) =>
                      this.props.setConfig(
                        { code: 'spectro_gloss_compensation' },
                        event.target.checked
                      )
                    }
                  />
                </Col>
              </FormGroup>
            )}
            {spectro_has_button_option && (
              <FormGroup row>
                <Label sm={5}>
                  {t(
                    'cfg.spectro_read_with_dev_btn',
                    'Enable reading from the instrument'
                  )}
                </Label>
                <Col sm={7} style={{ paddingTop: '0.5rem', zIndex: '0' }}>
                  <CustomInput
                    type="checkbox"
                    checked={this.props.config.spectro_read_with_dev_btn.value}
                    disabled={
                      this.props.config.spectro_read_with_dev_btn.islocked ||
                      this.props.accessDenied('spectro_read_with_dev_btn')
                    }
                    id={'spectro_read_with_dev_btn'}
                    onChange={(event) =>
                      this.props.setConfig(
                        { code: 'spectro_read_with_dev_btn' },
                        event.target.checked
                      )
                    }
                  />
                </Col>
              </FormGroup>
            )}
          </div>

          {/** Calibrate / measure */}
          {this.getCalibrateMeasure()}

          <Row>
            <Col className="col-p-8" style={{ margin: 'auto', color: '#f00' }}>
              {spectro_error && t(spectro_error.message)}
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  }
}

Spectro.propTypes = {
  spectro_config: PropTypes.object,
  spectro_model_info: PropTypes.object,
  spectro_status: PropTypes.object,
  spectro_busy: PropTypes.bool.isRequired,
  spectro_error: PropTypes.object,
  spectro_measurement: PropTypes.object,
  fetchSpectroConfig: PropTypes.func.isRequired,
  setSpectroDriver: PropTypes.func.isRequired,
  setSpectroPort: PropTypes.func.isRequired,
  fetchSpectroStatus: PropTypes.func.isRequired,
  install: PropTypes.func.isRequired,
  configure: PropTypes.func,
  calibrate: PropTypes.func.isRequired,
  calibProceed: PropTypes.func.isRequired,
  measureTarget: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  setSpectroMode: PropTypes.func.isRequired,
  config: PropTypes.object,
  setConfig: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
  spectro_allow_white_check_before_cal: PropTypes.bool,
  spectro_has_button_option: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  config: configSelectors.config(state),
  spectro_config: selectors.config(state),
  spectro_model_info: selectors.model_info(state),
  spectro_status: selectors.status(state),
  spectro_error: selectors.error(state),
  spectro_measurement: selectors.measurement_target(state),
  spectro_busy: selectors.busy(state),
  spectro_has_button_option: selectors.has_button_option(state),
});

const mapDispatchToProps = {
  fetchSpectroConfig: spectroActions.fetchConfig,
  setSpectroDriver: spectroActions.setDriver,
  setSpectroPort: spectroActions.setPort,
  setSpectroMode: spectroActions.setMode,
  fetchSpectroStatus: spectroActions.fetchStatus,
  install: spectroActions.install,
  configure: spectroActions.configure,
  calibrate: spectroActions.calibrate,
  calibProceed: spectroActions.calibProceed,
  measureTarget: spectroActions.measureTarget,
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Spectro)
);
