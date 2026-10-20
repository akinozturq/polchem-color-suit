import React from 'react';
import PropTypes from 'prop-types';
import { MACHINE_CAP_CLOSE, MACHINE_CAP_OPEN } from '../../../Constants';
import {
  Col,
  Row,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Label,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
} from 'reactstrap';
import initializeImg from 'img/actions/initialization.svg';
import resetImg from 'img/actions/reset.svg';
import stirImg from 'img/actions/stir.svg';
import stirAllImg from 'img/actions/stirAll.svg';
import cleanImg from 'img/actions/clean.svg';
import cleanAllImg from 'img/actions/cleanAll.svg';
import capOpenImg from 'img/actions/autoCapOpen.svg';
import capCloseImg from 'img/actions/autoCapClose.svg';
import { propType as machineType } from 'js/redux/reducers/Machine';
import Spinner from '../../shared/Spinner';
import _ from 'lodash';
import { CustomScrollbars, rightToLeft } from '../../../mylib/Utils';

const propTypes = {
  t: PropTypes.func.isRequired,
  machine: machineType,
  dispID: PropTypes.string.isRequired,
  config: PropTypes.object,
  stir: PropTypes.func.isRequired,
  stirAll: PropTypes.func.isRequired,
  initialize: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  cap: PropTypes.func.isRequired,
  clean: PropTypes.func,
  cleanAll: PropTypes.func,
  resetHard: PropTypes.func,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  commands: PropTypes.object,
};

const defaultProps = {};
const DEFAULT_STIRRING_DURATION = 30;
const RESET_BUTTON_FALLBACK_TIMEOUT_MS = 15000;

export default class MachineActions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      canId: 1,
      show_stirring_modal: false,
      stirring_func: undefined,
      stirring_func_params: [],
      stirring_duration: DEFAULT_STIRRING_DURATION,
      resetActionInFlight: null,
    };
    this.resetActionFallbackTimer = null;
  }

  componentWillUnmount() {
    this.clearResetActionFallbackTimer();
  }

  toggle = () => {
    this.setState((prevState) => ({
      show_stirring_modal: !prevState.show_stirring_modal,
    }));
  };

  checkAllCnts = () => {
    this.setState((prevState) => {
      if (prevState.all)
        return {
          ...prevState,
          cnts_to_purge: [],
          all: !prevState.all,
        };
      return {
        ...prevState,
        cnts_to_purge: _.cloneDeep(
          this.props.machine.colorants.filter((cnt) => cnt.enabled)
        ),
        all: !prevState.all,
      };
    });
  };

  accessDenied = (key) => {
    const { privileges } = this.props;
    return !_.includes(privileges, key);
  };

  clearResetActionFallbackTimer = () => {
    if (this.resetActionFallbackTimer) {
      clearTimeout(this.resetActionFallbackTimer);
      this.resetActionFallbackTimer = null;
    }
  };

  clearPendingResetAction = () => {
    this.clearResetActionFallbackTimer();
    this.setState({
      resetActionInFlight: null,
    });
  };

  armResetFallback = () => {
    this.clearResetActionFallbackTimer();
    this.resetActionFallbackTimer = setTimeout(() => {
      this.resetActionFallbackTimer = null;
      this.setState((prevState) => {
        if (!prevState.resetActionInFlight) {
          return null;
        }
        return {
          resetActionInFlight: null,
        };
      });
    }, RESET_BUTTON_FALLBACK_TIMEOUT_MS);
  };

  handleResetAction = (action) => {
    if (this.state.resetActionInFlight) {
      return;
    }

    this.setState({
      resetActionInFlight: action,
    });
    this.armResetFallback();

    try {
      if (action === 'reset_hard') {
        this.props.resetHard(this.props.dispID);
        return;
      }

      this.props.reset(this.props.dispID);
    } catch (error) {
      this.clearPendingResetAction();
      throw error;
    }
  };

  renderMachineActionIcon = (icon, alt, showSpinner) => (
    <React.Fragment>
      <img
        src={icon}
        alt={alt}
        className={`img-fit${showSpinner ? ' machine-action-icon--muted' : ''}`}
      />
      {showSpinner ? (
        <span className="machine-action-spinner">
          <Spinner />
        </span>
      ) : null}
    </React.Fragment>
  );

  stirCanister = () => {
    this.props.stir(
      this.props.dispID,
      this.state.canId,
      this.state.stirring_duration
    );
  };

  selectCanId = (e) => {
    this.setState({ canId: parseInt(e.target.value) });
  };

  getInitReset = (isRtl, direction) => {
    const { t, commands } = this.props;
    const { resetActionInFlight } = this.state;
    if (!commands.reset && !commands.reset_hard && !commands.initialize) {
      return null;
    } else {
      const cardSpacingStyle = isRtl
        ? { marginLeft: '0.5rem' }
        : { marginRight: '0.5rem' };
      return (
        <Card style={cardSpacingStyle} dir={direction}>
          <CardHeader style={{ textAlign: isRtl ? 'right' : 'left' }}>
            {t('fn.machineInitializationReset', 'Initialization & reset')}
          </CardHeader>
          <CardBody>
            <Row>
              {commands.initialize ? (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={this.accessDenied('machine_command_init')}
                    data-denied={this.accessDenied('machine_command_init')}
                    className={'box-shadow btn btn-action btn-machine-action '}
                    onClick={() => this.props.initialize(this.props.dispID)}
                  >
                    <img src={initializeImg} alt="Init" className="img-fit" />
                  </button>
                  <p style={{ marginBottom: 0, height: '1.5rem' }}>
                    {t('fn.machineInitialization', 'Initialization')}
                  </p>
                </Col>
              ) : null}
              {commands.reset ? (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={
                      Boolean(resetActionInFlight) ||
                      this.accessDenied('machine_command_reset')
                    }
                    data-denied={this.accessDenied('machine_command_reset')}
                    className="box-shadow btn btn-action btn-machine-action"
                    aria-busy={resetActionInFlight === 'reset'}
                    onClick={() => this.handleResetAction('reset')}
                  >
                    {this.renderMachineActionIcon(
                      resetImg,
                      'Reset',
                      resetActionInFlight === 'reset'
                    )}
                  </button>
                  <p style={{ marginBottom: 0, height: '1.5rem' }}>
                    {t('fn.machineReset', 'Reset')}
                  </p>
                </Col>
              ) : null}
              {commands.reset_hard ? (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={
                      Boolean(resetActionInFlight) ||
                      this.accessDenied('machine_command_reset_hard')
                    }
                    data-denied={this.accessDenied(
                      'machine_command_reset_hard'
                    )}
                    className="box-shadow btn btn-action btn-machine-action"
                    aria-busy={resetActionInFlight === 'reset_hard'}
                    onClick={() => this.handleResetAction('reset_hard')}
                  >
                    {this.renderMachineActionIcon(
                      resetImg,
                      'Reset',
                      resetActionInFlight === 'reset_hard'
                    )}
                  </button>
                  <p style={{ marginBottom: 0, height: '1.5rem' }}>
                    Reset hard
                  </p>
                </Col>
              ) : null}
            </Row>
          </CardBody>
        </Card>
      );
    }
  };

  showStirringTimeModal = (isRtl, direction) => {
    const { t } = this.props;
    return (
      <Modal
        isOpen={this.state.show_stirring_modal}
        toggle={this.toggle}
        size="md"
        centered={true}
      >
        <ModalHeader dir={direction}>
          {t('lbl.stirringConfiguration', 'Stirring configuration')}
        </ModalHeader>
        <ModalBody dir={direction}>
          <FormGroup
            row
            style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
          >
            <Label xs={4}>
              {' '}
              {t('lbl.stirringDuration', 'Stirring duration')}
            </Label>
            <Col sm={7}>
              <InputGroup style={{ direction }}>
                <Input
                  id={'stirring_duration'}
                  type="number"
                  min={0}
                  max={120}
                  className={'form-control-tools'}
                  style={{ direction }}
                  value={this.state.stirring_duration}
                  onChange={(event) =>
                    this.setState(() => ({
                      stirring_duration: parseFloat(event.target.value),
                    }))
                  }
                />

                <InputGroupAddon addonType={isRtl ? 'prepend' : 'append'}>
                  <InputGroupText>{'s'}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Col>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Row
            style={{
              width: '100%',
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}
          >
            <Col>
              <Button color="secondary" onClick={this.toggle}>
                {t('fn.cancel', 'Cancel')}
              </Button>
            </Col>
            <Col />
            <Col>
              <Button
                color="primary"
                onClick={() => {
                  this.state.stirring_func(
                    this.props.dispID,
                    this.state.stirring_duration
                  );
                  this.toggle();
                }}
              >
                {t('fn.ok', 'OK')}
              </Button>{' '}
            </Col>
          </Row>
        </ModalFooter>
      </Modal>
    );
  };

  getStirCanisters = (isRtl, direction) => {
    const { t, commands } = this.props;
    const cans = (this.props.machine.colorants || []).map((cnt) => (
      <option key={cnt.id} value={cnt.id}>
        {cnt.id}
      </option>
    ));
    if (!commands.stir && !commands.stir_all) {
      return null;
    } else {
      const cardSpacingStyle = isRtl
        ? { marginRight: '0.5rem' }
        : { marginLeft: '0.5rem' };
      return (
        <Card style={cardSpacingStyle} dir={direction}>
          <CardHeader style={{ textAlign: isRtl ? 'right' : 'left' }}>
            {t('fn.stirCanisters', 'Stir canisters')}
          </CardHeader>
          <CardBody>
            <Row>
              {commands.stir ? (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={this.accessDenied('machine_command_stir')}
                    data-denied={this.accessDenied('machine_command_stir')}
                    className="box-shadow btn btn-action btn-machine-action"
                    onClick={() =>
                      this.setState({
                        show_stirring_modal: true,
                        stirring_func: this.stirCanister,
                      })
                    }
                  >
                    <img src={stirImg} alt="Stir" className="img-fit" />
                  </button>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                    }}
                  >
                    <span style={{ marginBottom: 0 }}>
                      {t('fn.stirCanisterr', 'Stir canister')}
                    </span>

                    <Input
                      type="select"
                      value={this.state.canId}
                      name="select"
                      dir={direction}
                      style={{
                        padding: 0,
                        height: '1.5rem',
                        width: 'auto',
                      }}
                      onChange={this.selectCanId}
                    >
                      {cans}
                    </Input>
                  </div>
                </Col>
              ) : null}
              {commands.stir_all ? (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={this.accessDenied('machine_command_stir_all')}
                    data-denied={this.accessDenied('machine_command_stir_all')}
                    className="box-shadow btn btn-action btn-machine-action"
                    onClick={() =>
                      this.setState({
                        show_stirring_modal: true,
                        stirring_func: this.props.stirAll,
                      })
                    }
                  >
                    <img src={stirAllImg} alt="Stir all" className="img-fit" />
                  </button>
                  <p style={{ marginBottom: 0, height: '1.5rem' }}>
                    {t('fn.stirAllCanisters', 'Stir all canisters')}
                  </p>
                </Col>
              ) : null}
            </Row>
          </CardBody>
        </Card>
      );
    }
  };

  getCleanCircuits = (isRtl, direction) => {
    const { t, commands } = this.props;
    const cans = (this.props.machine.colorants || []).map((cnt) => (
      <option key={cnt.id} value={cnt.id}>
        {`can: ${cnt.id}, circuits: ${cnt.circuits}`}
      </option>
    ));
    if (!commands.clean && !commands.clean_all) {
      return null;
    } else {
      const cardSpacingStyle = isRtl
        ? { marginRight: '0.5rem' }
        : { marginLeft: '0.5rem' };
      return (
        <Card style={cardSpacingStyle} dir={direction}>
          <CardHeader style={{ textAlign: isRtl ? 'right' : 'left' }}>
            {t('cfg.machine_command_clean_circuits', 'Clean circuits')}
          </CardHeader>
          <CardBody>
            <Row>
              {commands.clean && (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={this.accessDenied('machine_command_clean')}
                    data-denied={this.accessDenied('machine_command_clean')}
                    className="box-shadow btn btn-action btn-machine-action"
                    onClick={() =>
                      this.props.clean(this.props.dispID, this.state.canId)
                    }
                  >
                    <img src={cleanImg} alt="Clean" className="img-fit" />
                  </button>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                    }}
                  >
                    <span style={{ marginBottom: 0 }}>Clean circuit</span>

                    <Input
                      type="select"
                      name="select"
                      dir={direction}
                      style={{
                        padding: 0,
                        height: '1.5rem',
                        width: 'auto',
                      }}
                      onChange={(e) => this.selectCanId(e)}
                    >
                      {cans}
                    </Input>
                  </div>
                </Col>
              )}
              {commands.clean_all && (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={this.accessDenied('machine_command_clean_all')}
                    data-denied={this.accessDenied('machine_command_clean_all')}
                    className="box-shadow btn btn-action btn-machine-action"
                    onClick={() => this.props.cleanAll(this.props.dispID)}
                  >
                    <img
                      src={cleanAllImg}
                      alt="Clean all"
                      className="img-fit"
                    />
                  </button>
                  <p style={{ marginBottom: 0, height: '1.5rem' }}>
                    {t('cfg.machine_command_clean_all', 'Clean all circuits')}
                  </p>
                </Col>
              )}
            </Row>
          </CardBody>
        </Card>
      );
    }
  };

  getCapOpenClose = (isRtl, direction) => {
    const { t, commands } = this.props;
    if (!commands.cap) {
      return null;
    } else {
      const cardSpacingStyle = isRtl
        ? { marginLeft: '0.5rem' }
        : { marginRight: '0.5rem' };
      return (
        <Card style={cardSpacingStyle} dir={direction}>
          <CardHeader style={{ textAlign: isRtl ? 'right' : 'left' }}>
            {t('fn.autocap', 'Autocap')}
          </CardHeader>
          <CardBody>
            <Row>
              {commands.cap ? (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={this.accessDenied('machine_command_cap')}
                    data-denied={this.accessDenied('machine_command_cap')}
                    className={'box-shadow btn btn-action btn-machine-action '}
                    onClick={() =>
                      this.props.cap(this.props.dispID, MACHINE_CAP_OPEN)
                    }
                  >
                    <img src={capOpenImg} alt="CapOpen" className="img-fit" />
                  </button>
                  <p style={{ marginBottom: 0, height: '1.5rem' }}>
                    {t('fn.capOpen', 'Cap Open')}
                  </p>
                </Col>
              ) : null}
              {commands.cap ? (
                <Col style={{ textAlign: 'center' }}>
                  <button
                    disabled={this.accessDenied('machine_command_cap')}
                    data-denied={this.accessDenied('machine_command_cap')}
                    className="box-shadow btn btn-action btn-machine-action"
                    onClick={() =>
                      this.props.cap(this.props.dispID, MACHINE_CAP_CLOSE)
                    }
                  >
                    <img src={capCloseImg} alt="CapClose" className="img-fit" />
                  </button>
                  <p style={{ marginBottom: 0, height: '1.5rem' }}>
                    {t('fn.capClose', 'Cap Close')}
                  </p>
                </Col>
              ) : null}
            </Row>
          </CardBody>
        </Card>
      );
    }
  };

  render() {
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    return (
      <React.Fragment>
        <CustomScrollbars
          className="bordered br-8"
          style={{
            height: 'calc(100vh - 13.5rem)',
            width: '100%',
            direction,
          }}
        >
          {this.showStirringTimeModal(isRtl, direction)}
          <Row
            style={{
              marginBottom: '0.5rem',
              marginTop: '0.5rem',
              flexDirection: 'row',
            }}
          >
            <Col xs={4} style={{ padding: 0 }}>
              {this.getInitReset(isRtl, direction)}
            </Col>
            <Col xs={4} style={{ padding: 0 }}>
              {this.getStirCanisters(isRtl, direction)}
            </Col>
            <Col xs={4} style={{ padding: 0 }}>
              {this.getCleanCircuits(isRtl, direction)}
            </Col>
          </Row>

          <Row style={{ flexDirection: 'row' }}>
            <Col xs={4} style={{ padding: 0 }}>
              {this.getCapOpenClose(isRtl, direction)}
            </Col>
          </Row>
        </CustomScrollbars>
      </React.Fragment>
    );
  }
}

MachineActions.propTypes = propTypes;
MachineActions.defaultProps = defaultProps;
