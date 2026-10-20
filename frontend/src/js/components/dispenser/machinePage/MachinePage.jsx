import React from 'react';

import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bindActionCreators } from 'redux';

import machineActions, {
  selectors as machineSelectors,
  propType as machineType,
} from 'js/redux/reducers/Machine';
import {
  Badge,
  Button,
  Col,
  Container,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from 'reactstrap';
import classnames from 'classnames';
import MachineColorants from './canisters/MachineColorants';
import ConfigIcon from 'img/machineBar/machineActions.svg';
import InvenoryIcon from 'img/canisters/sortByStock.svg';
import InvenoryIconBlack from 'img/canisters/sortByStock_black.svg';
import ColorantIcon from 'img/machineBar/levels.svg';
import ConfigIconWhite from 'img/machineBar/machineActions_white.svg';
import ColorantIconWhite from 'img/machineBar/levels_white.svg';
import MachineErrors from './MachineErrors';
import MachineConfigurations from './MachineConfigurations';
import MachinePurge from './MachinePurge';
import MachineActions from './MachineActions';
import { TopBar, TopBarLeft } from 'js/components/layout/Containers';
import { push } from 'connected-react-router';
import MachineServiceBook from './MachineServiceBook';
import {
  HTML_COLOR_BLUE,
  HTML_COLOR_YELLOW,
  MACHINE_WARNING_MSG_ICON,
} from 'js/Constants';
import { createLevelFormatter } from 'js/redux/selectors/Formatters';
import { selectors as userSelectors } from 'js/redux/reducers/User';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import PurgeActions from './purgeActions';
import MachineCntInventory from './MachineCntInventory';
import { selectors as maintenanceSelectors } from '../../../redux/reducers/Maintenance';
import MachineBackup from './MachineBackup';

import dispenser_img from 'img/Dispenser.svg';
import dispenser_white_img from 'img/Dispenser_white.svg';
import { offline_mode } from '../../../Constants.js';
import { rightToLeft } from '../../../mylib/Utils';

class MachinePage extends React.Component {
  constructor(props) {
    super(props);

    this.goBack = this.goBack.bind(this);
    this.state = {
      activeTab: '1',
      modalIsOpen: false,
    };

    this.MachineColorantsElement = React.createRef();
  }

  // On load set activeTab to errors if there is something critical!
  componentDidMount() {
    if (
      this.props.machine &&
      this.props.machine.machine_state &&
      this.props.machine.machine_state.warning
    ) {
      const show_errors =
        (this.props.machine.error || []).length > 0 ||
        this.props.machine.machine_state.warning.msgIcon ===
          MACHINE_WARNING_MSG_ICON;
      this.setState({ activeTab: show_errors ? '3' : '1' });
    }
  }

  // Updates all configuration changes to backend
  onConfigChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const id = target.id;
    const { config } = this.props.machine;
    // Special case for purge amounts
    if (id === 'purge_amounts') {
      const name = parseInt(target.name);
      config[id][name] = parseFloat(value.replace(',', '.'));
    } else {
      config[id] = value;
    }
    this.props.setMachineConfig(this.props.dispID, config);
  };

  toggleActiveTab = (tab) => {
    if (this.state.activeTab !== tab) {
      this.setState(
        {
          activeTab: tab,
        },
        () => {
          if (this.state.activeTab !== '1') {
            this.props.moveToHome(this.props.dispID);
            if (this.state.activeTab === '3') {
              this.props.fetchMachineError(this.props.dispID);
            }
          }
        }
      );
    }
  };

  handleOpenModal = () => {
    this.setState({ modalIsOpen: true });
  };

  handleCloseModal = () => {
    this.setState({ modalIsOpen: false });
  };

  goBack() {
    const has_changes = this.MachineColorantsElement.current.hasChanges();
    return has_changes ? this.handleOpenModal() : window.history.back();
  }

  render() {
    const { t, machine, dispID, config_values, inventory, unseen_maintenance } =
      this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    if (!machine) {
      setTimeout(() => this.props.navigateTo('/'), 100);
      return null;
    }

    const purgeSupported = !!(
      machine.commands?.purge || machine.commands?.purge_all
    );

    let maintenance_padge_color = null;
    if (
      unseen_maintenance.data
        .map((z) => z.machineid)
        .includes(machine?.dbinfo?.machineid)
    ) {
      maintenance_padge_color = HTML_COLOR_BLUE;
    }

    // Finding suitable icon for stock button
    const codes = machine.colorants.map((x) => x.code);
    let table_data = (inventory.data || [])
      .filter((x) => codes.includes(x.cntcode))
      .filter((x) => x.count < x.warnlevel);

    let stock_badge = null;
    if (table_data.length > 0) {
      stock_badge = 'warning';
      if (table_data.filter((x) => x.count === 0).length > 0) {
        stock_badge = 'danger';
      }
    }

    const state = machine.machine_state || {};
    let padge_color = null;
    if (state && state.msgIcon === MACHINE_WARNING_MSG_ICON) {
      padge_color = HTML_COLOR_YELLOW;
    }

    return (
      <>
        <Modal isOpen={this.state.modalIsOpen} centered>
          <ModalHeader>{t('lbl.warning', 'Warning')}</ModalHeader>
          <ModalBody>
            {t(
              'msg.saveNeeded',
              'You have to press Save for the changes to affect.'
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              data-testid="modal_save_needed_ok"
              onClick={this.handleCloseModal}
            >
              {t('fn.ok', 'OK')}
            </Button>
          </ModalFooter>
        </Modal>
        <div className={'zoom-in'} dir={direction}>
          <TopBar>
            <TopBarLeft>
              <h2
                data-testid="back_to_home"
                className="clickable-text directly-over-bg mt-8"
                onClick={this.goBack}
              >
                <FontAwesomeIcon
                  icon={isRtl ? 'arrow-right' : 'arrow-left'}
                  style={{ fontSize: '1.7rem' }}
                />{' '}
                {t('lbl.machineSettings', 'Machine settings')} -{' '}
                {machine.info ? machine.info.dispenserName : ''}
              </h2>
            </TopBarLeft>
          </TopBar>
          <Container className="justify-content-center machine-tab-container">
            <Nav tabs className="machine-tabs">
              <NavItem>
                <NavLink
                  data-testid="machine_colorants"
                  className={classnames({
                    active: this.state.activeTab === '1',
                  })}
                  onClick={() => {
                    this.toggleActiveTab('1');
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {this.state.activeTab === '1' ? (
                    <img
                      src={ColorantIcon}
                      width="23px"
                      height="23px"
                      alt={t('lbl.colorants', 'Colorants')}
                    />
                  ) : (
                    <img
                      src={ColorantIconWhite}
                      width="23px"
                      height="23px"
                      alt={t('lbl.colorants', 'Colorants')}
                    />
                  )}
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: this.state.activeTab === '1' ? 'black' : 'white',
                    }}
                  >
                    {t('lbl.levels', 'Levels')}
                  </span>
                </NavLink>
              </NavItem>
              {config_values.enable_warehousing_v4 && !offline_mode && (
                <NavItem>
                  <NavLink
                    data-testid="machine_inventory"
                    className={classnames({
                      active: this.state.activeTab === '8',
                    })}
                    onClick={() => {
                      this.toggleActiveTab('8');
                    }}
                  >
                    <Row style={{ justifyContent: 'center' }}>
                      <Col>
                        {this.state.activeTab === '8' ? (
                          <img
                            src={InvenoryIconBlack}
                            width="23px"
                            height="23px"
                            alt={t('lbl.configuration', 'Inventory')}
                          />
                        ) : (
                          <img
                            src={InvenoryIcon}
                            width="23px"
                            height="23px"
                            alt={t('lbl.configuration', 'Inventory')}
                          />
                        )}
                        {stock_badge && (
                          <Badge
                            color={stock_badge}
                            data-testid="machine_inventory_badge"
                          >
                            !
                          </Badge>
                        )}
                      </Col>
                    </Row>
                    <Row>
                      <Col
                        style={{
                          fontWeight: 'bold',
                          color:
                            this.state.activeTab === '8' ? 'black' : 'white',
                        }}
                      >
                        {t('lbl.inventory', 'Inventory')}
                      </Col>
                    </Row>
                  </NavLink>
                </NavItem>
              )}

              <NavItem>
                <NavLink
                  data-testid="machine_actions"
                  className={classnames({
                    active: this.state.activeTab === '2',
                  })}
                  onClick={() => {
                    this.toggleActiveTab('2');
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <FontAwesomeIcon
                    icon="play"
                    style={{
                      color: this.state.activeTab === '2' ? 'black' : 'white',
                      height: '22px',
                      width: '22px',
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: this.state.activeTab === '2' ? 'black' : 'white',
                    }}
                  >
                    {t('lbl.controls', 'Controls')}
                  </span>
                </NavLink>
              </NavItem>
              {!offline_mode && (
                <>
                  {purgeSupported && (
                    <NavItem>
                      <NavLink
                        data-testid="machine_purge"
                        className={classnames({
                          active: this.state.activeTab === '7',
                        })}
                        onClick={() => {
                          this.toggleActiveTab('7');
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <FontAwesomeIcon
                          icon="tint"
                          style={{
                            color:
                              this.state.activeTab === '7' ? 'black' : 'white',
                            height: '22px',
                            width: '22px',
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 'bold',
                            color:
                              this.state.activeTab === '7' ? 'black' : 'white',
                          }}
                        >
                          {t('lbl.purge', 'Purge')}
                        </span>
                      </NavLink>
                    </NavItem>
                  )}
                  <NavItem>
                    <NavLink
                      className={classnames({
                        active: this.state.activeTab === '3',
                      })}
                      onClick={() => {
                        this.toggleActiveTab('3');
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <FontAwesomeIcon
                        icon="exclamation-triangle"
                        style={{
                          color:
                            padge_color && this.state.activeTab !== '3'
                              ? padge_color
                              : this.state.activeTab === '3'
                                ? 'black'
                                : 'white',
                          height: '22px',
                          width: '22px',
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 'bold',
                          color:
                            this.state.activeTab === '3' ? 'black' : 'white',
                        }}
                      >
                        {t('lbl.errors', 'Errors')}
                      </span>
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      data-testid="machine_config"
                      className={classnames({
                        active: this.state.activeTab === '4',
                      })}
                      onClick={() => {
                        this.toggleActiveTab('4');
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      {this.state.activeTab === '4' ? (
                        <img
                          src={ConfigIcon}
                          width="23px"
                          height="23px"
                          alt={t('lbl.configuration', 'Configuration')}
                        />
                      ) : (
                        <img
                          src={ConfigIconWhite}
                          width="23px"
                          height="23px"
                          alt={t('lbl.configuration', 'Configuration')}
                        />
                      )}
                      <span
                        style={{
                          fontWeight: 'bold',
                          color:
                            this.state.activeTab === '4' ? 'black' : 'white',
                        }}
                      >
                        {t('lbl.settings', 'Settings')}
                      </span>
                    </NavLink>
                  </NavItem>
                  {purgeSupported && (
                    <NavItem>
                      <NavLink
                        className={classnames({
                          active: this.state.activeTab === '5',
                        })}
                        onClick={() => {
                          this.toggleActiveTab('5');
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <span>
                          <FontAwesomeIcon
                            icon="tint"
                            style={{
                              color:
                                this.state.activeTab === '5'
                                  ? 'black'
                                  : 'white',
                              height: '22px',
                              width: '22px',
                            }}
                          />
                          <FontAwesomeIcon
                            icon="gear"
                            style={{
                              color:
                                this.state.activeTab === '5'
                                  ? 'black'
                                  : 'white',
                              height: '11px',
                              width: '11px',
                            }}
                          />
                        </span>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color:
                              this.state.activeTab === '5' ? 'black' : 'white',
                            lineHeight: 1,
                          }}
                        >
                          {t('lbl.purgeSettings', 'Purge settings')}
                        </span>
                      </NavLink>
                    </NavItem>
                  )}
                  {this.props.replication?.details?.data?.has_replication ||
                    (this.props.protection?.status?.cloud && (
                      <NavItem>
                        <NavLink
                          data-testid="machine_maintenance"
                          className={classnames({
                            active: this.state.activeTab === '6',
                          })}
                          onClick={() => {
                            this.toggleActiveTab('6');
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <span>
                            <FontAwesomeIcon
                              icon="life-ring"
                              style={{
                                color:
                                  this.state.activeTab === '6'
                                    ? 'black'
                                    : 'white',
                                height: '22px',
                                width: '22px',
                              }}
                            />
                            {maintenance_padge_color && (
                              <span
                                style={{
                                  position: 'absolute',
                                  marginLeft: isRtl ? undefined : '-10px',
                                  marginRight: isRtl ? '-10px' : undefined,
                                  height: '30px',
                                  width: '30px',
                                }}
                              >
                                <FontAwesomeIcon
                                  icon="exclamation-triangle"
                                  style={{
                                    color: maintenance_padge_color,
                                    height: '20px',
                                    width: '20px',
                                    position: 'relative',
                                    top: '-6px',
                                  }}
                                />
                              </span>
                            )}
                          </span>
                          <span
                            style={{
                              fontWeight: 'bold',
                              color:
                                this.state.activeTab === '6'
                                  ? 'black'
                                  : 'white',
                              lineHeight: 1,
                            }}
                          >
                            {t('lbl.maintenance', 'Maintenance')}
                          </span>
                        </NavLink>
                      </NavItem>
                    ))}
                  <NavItem>
                    <NavLink
                      data-testid="machine_backup"
                      className={classnames({
                        active: this.state.activeTab === '9',
                      })}
                      onClick={() => {
                        this.toggleActiveTab('9');
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        <img
                          src={
                            this.state.activeTab === '9'
                              ? dispenser_img
                              : dispenser_white_img
                          }
                          width="22px"
                          height="22px"
                        />
                        <FontAwesomeIcon
                          icon="arrow-down"
                          style={{
                            color:
                              this.state.activeTab === '9' ? 'black' : 'white',
                            height: '11px',
                            width: '11px',
                          }}
                        />
                      </span>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color:
                            this.state.activeTab === '9' ? 'black' : 'white',
                        }}
                      >
                        {t('lbl.machineBackup', 'Machine backup')}
                      </span>
                    </NavLink>
                  </NavItem>
                </>
              )}
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
              <TabPane tabId="1" className="white-nowrap">
                <MachineColorants
                  ref={this.MachineColorantsElement}
                  t={t}
                  machine={machine}
                  selectedCnt={machine.selected_cnt_code}
                  dispID={dispID}
                />
              </TabPane>
              <TabPane tabId="2">
                <MachineActions
                  t={t}
                  machine={machine}
                  stir={this.props.stir}
                  stirAll={this.props.stirAll}
                  clean={this.props.clean}
                  cleanAll={this.props.cleanAll}
                  reset={this.props.reset}
                  cap={this.props.cap}
                  config={this.props.config}
                  resetHard={this.props.resetHard}
                  initialize={this.props.initialize}
                  dispID={dispID}
                  privileges={this.props.privileges}
                  commands={this.props.machine.commands}
                  purge={this.props.purge}
                  purgeAll={this.props.purgeAll}
                  purgeAutomaticPrepare={this.props.purgeAutomaticPrepare}
                />
              </TabPane>
              <TabPane tabId="7">
                <PurgeActions
                  t={t}
                  machine={machine}
                  config={this.props.config}
                  dispID={dispID}
                  privileges={this.props.privileges}
                  commands={this.props.machine.commands}
                  purge={this.props.purge}
                  purgeAll={this.props.purgeAll}
                  purgeAutomaticPrepare={this.props.purgeAutomaticPrepare}
                />
              </TabPane>

              <TabPane tabId="3">
                <MachineErrors machine={machine} dispID={dispID} />
              </TabPane>

              <TabPane tabId="4">
                <MachineConfigurations
                  t={t}
                  dbconfig={this.props.config}
                  machine={machine}
                  onConfigChange={this.onConfigChange}
                  setMachineConfig={this.props.setMachineConfig}
                  dispID={dispID}
                  privileges={this.props.privileges}
                />
              </TabPane>

              <TabPane tabId="5">
                <MachinePurge
                  t={t}
                  dbconfig={this.props.config}
                  machine={machine}
                  onConfigChange={this.onConfigChange}
                  setMachineConfig={this.props.setMachineConfig}
                  dispID={dispID}
                  privileges={this.props.privileges}
                />
              </TabPane>
              {(this.props.replication?.details?.data?.has_replication ||
                this.props.protection?.status?.cloud) && (
                <TabPane tabId="6">
                  <MachineServiceBook
                    t={t}
                    machine={machine}
                    dispID={dispID}
                    privileges={this.props.privileges}
                  />
                </TabPane>
              )}
              <TabPane tabId="8">
                <MachineCntInventory
                  t={t}
                  dbconfig={this.props.config}
                  machine={machine}
                  onConfigChange={this.onConfigChange}
                  setMachineConfig={this.props.setMachineConfig}
                  dispID={dispID}
                  privileges={this.props.privileges}
                />
              </TabPane>
              <TabPane tabId="9">
                <MachineBackup
                  dispID={dispID}
                  privileges={this.props.privileges}
                  commands={this.props.machine.commands}
                />
              </TabPane>
            </TabContent>
          </Container>
        </div>
      </>
    );
  }
}

MachinePage.propTypes = {
  t: PropTypes.func.isRequired,
  config: PropTypes.object,
  config_values: PropTypes.object,
  dispID: PropTypes.string.isRequired,
  machine: machineType,
  navigateTo: PropTypes.func.isRequired,
  setMachineConfig: PropTypes.func.isRequired,
  clearMachineError: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  cap: PropTypes.func.isRequired,
  resetHard: PropTypes.func.isRequired,
  initialize: PropTypes.func.isRequired,
  stir: PropTypes.func.isRequired,
  stirAll: PropTypes.func.isRequired,
  clean: PropTypes.func.isRequired,
  cleanAll: PropTypes.func.isRequired,
  moveToHome: PropTypes.func.isRequired,
  purge: PropTypes.func.isRequired,
  purgeAll: PropTypes.func.isRequired,
  purgeAutomaticPrepare: PropTypes.func.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  cache: PropTypes.object,
  fetchMachineError: PropTypes.func,
  createLevelFormatter: PropTypes.func,
  refills_list: PropTypes.array,
  refills_batch_list: PropTypes.array,
  current_user: PropTypes.object,
  replication: PropTypes.object,
  protection: PropTypes.object,
  inventory: PropTypes.shape({
    data: PropTypes.array,
  }),
  unseen_maintenance: PropTypes.shape({ data: PropTypes.array }),
};

MachinePage.defaultProps = {};

function mapStateToProps(state) {
  let dispID = machineSelectors.current_dispID(state);
  return {
    machine: machineSelectors.machine(state, dispID),
    dispID: dispID,
    refills_list: machineSelectors.refills_list(state, dispID),
    refills_batch_list: machineSelectors.refills_batch_list(state, dispID),
    config: state.configurations.config,
    config_values: state.configurations.config_values,
    privileges: state.user.current_user.privileges,
    cache: state.cache,
    replication: state.replication,
    createLevelFormatter: createLevelFormatter(state),
    current_user: userSelectors.current_user(state),
    is_pro: protectionSelectors.is_pro(state),
    protection: state.protection,
    inventory: state.inventory.colorants,
    unseen_maintenance: maintenanceSelectors.unseen(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchMachineError: machineActions.fetchMachineError,
      setMachineConfig: machineActions.setMachineConfig,
      clearMachineError: machineActions.clearMachineError,
      initialize: machineActions.initialize,
      reset: machineActions.reset,
      resetHard: machineActions.resetHard,
      stir: machineActions.stir,
      cap: machineActions.cap,
      clean: machineActions.clean,
      cleanAll: machineActions.cleanAll,
      moveToHome: machineActions.moveToHome,
      stirAll: machineActions.stirAll,
      purge: machineActions.purge,
      purgeAll: machineActions.purgeAll,
      purgeAutomaticPrepare: machineActions.purgeAutomaticPrepare,
      navigateTo: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachinePage)
);
