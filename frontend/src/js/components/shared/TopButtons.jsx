import React from 'react';
import {
  Navbar,
  Nav,
  NavItem,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownMenu,
  Button,
  Badge,
  UncontrolledTooltip,
  ModalHeader,
  ModalBody,
  InputGroup,
  Input,
  Alert,
  ModalFooter,
  Modal,
  Row,
  Col,
  InputGroupAddon,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import configActions from 'js/redux/reducers/Configuration';
import userActions from 'js/redux/reducers/User';
import replicationActions from 'js/redux/reducers/Replication';
import updateActions from 'js/redux/reducers/UpdateChecker';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import { withTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';

import PropTypes from 'prop-types';
import _ from 'lodash';
import { push } from 'connected-react-router';
import {
  HTML_COLOR_RED,
  NO_REPLICATION,
  offline_mode,
  REP_STATE_ASK,
  REP_STATE_FULLSYNC_AT,
  REP_STATE_FULLSYNC_AT_MISSED,
  REP_STATE_RECIEV,
  REP_STATE_SEND,
  REP_STATE_SLEEP,
  UAC_AUTO_LOGOUT_AFTER_IDLE,
  UAC_AUTO_LOGOUT_INTERVAL_MINIMUM,
  UAC_AUTO_LOGOUT_NEVER,
} from '../../Constants';
import IdleTimer from 'react-idle-timer';

import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import loginActions from '../../redux/reducers/Login';
import { isSiteUser } from '../../api/WebRequest';
import UpdateButton from './UpdateButton';
import { hasPrivilege } from '../../mylib/Privileges';
import { Divider } from './Divider';
import { detectMobile, rightToLeft } from '../../mylib/Utils';
import { selectors as userSelectors } from '../../redux/reducers/User.js';
import Select from 'react-select';

class TopButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: { username: '', password: '' },
      userLoginModal: false,
      loginMenuOpen: false,
      configMenuOpen: false,
      toggleZoneMenuOpen: false,
      urls_available: [],
      show: false,
    };
  }

  componentDidMount() {
    // try to load availabel databases
    try {
      if (window.qtside) {
        window.qtside.url_helper.available_urls.connect((urls) => {
          this.setState({ urls_available: JSON.parse(urls) });
          console.log(JSON.parse(urls));
        });
        window.qtside.url_helper.get_available_urls();
      }
    } catch (e) {
      console.log(e);
    }
  }

  static getDerivedStateFromProps(props) {
    if (props.user?.show_login_user) {
      return { userLoginModal: true };
    }
    return null;
  }

  toggleZoneMenu = () => {
    this.setState((state) => ({
      toggleZoneMenuOpen: !state.toggleZoneMenuOpen,
    }));
  };

  openLoginMenu = () => {
    this.setState((state) => ({
      loginMenuOpen: !state.loginMenuOpen,
    }));
  };

  toggleConfigMenu = () => {
    this.setState({
      configMenuOpen: !this.state.configMenuOpen,
    });
    this.props.navigateTo('/config');
  };

  goBack = () => {
    window.history.back();
  };

  showLogin = () => {
    this.setState((prevState) => {
      return {
        userLoginModal: !prevState.userLoginModal,
      };
    });
  };

  closeProgram = () => {
    /**
     * Calls QT5 app to close the window
     * Do not call if program is not running in QT5 browser!!
     */
    if (window.qtside) {
      window.qtside.bridge.closePOS();
    } else {
      this.props.logOutSite();
    }
  };

  setZone = (zone) => {
    this.props.setZone(zone);
  };

  getDatabases = () => {
    const {
      t,
      is_standalone,
      is_pro,
      replication_details,
      order_creation,
      zones,
    } = this.props;
    const show_databases = (is_pro || !isSiteUser()) && !order_creation;
    const show_exit = window.qtside || !is_standalone;
    const current_zone = this.props.configurations.zone;

    if (!show_databases && !show_exit) {
      return <NavItem key="placeholder" />;
    }
    const has_replication = replication_details?.data?.has_replication || false;

    const run_additional = has_replication ? (
      <DropdownItem
        data-testid={'run_additional_replication'}
        className={'pointer-cursor'}
        onClick={() => {
          this.props.runAction({ action: 'runadditional' });
          confirmAlert({
            title: t('lbl.additionalReplication', 'Additional Replication'),
            message: t(
              'msg.additionalReplicationRequested',
              'Additional replication run has been requested on background'
            ),
            buttons: [
              {
                label: t('fn.ok', 'OK'),
              },
            ],
          });
        }}
      >
        {t('lbl.runAdditionalReplication', 'Run additional replication')}
      </DropdownItem>
    ) : null;

    const options = zones.map((zone) => (
      <DropdownItem
        data-testid={`zoneid_${zone.zoneid}`}
        className={
          current_zone === zone ? 'pointer-cursor selected' : 'pointer-cursor'
        }
        key={zone.zoneid}
        onClick={() => this.setZone(zone)}
        disabled={!hasPrivilege('database_items')}
        data-denied={!hasPrivilege('database_items')}
      >
        {zone.zonename}
      </DropdownItem>
    ));

    const database = this.state.urls_available.map((url) => (
      <DropdownItem
        className={
          window.location.origin === url.url
            ? 'pointer-cursor selected'
            : 'pointer-cursor'
        }
        key={url.url}
        onClick={() => window.qtside?.url_helper?.load(url.url)}
        disabled={!hasPrivilege('database_items')}
        data-denied={!hasPrivilege('database_items')}
      >
        {url.name}
      </DropdownItem>
    ));

    return (
      <Dropdown
        data-testid="database"
        nav
        isOpen={this.state.toggleZoneMenuOpen}
        toggle={this.toggleZoneMenu}
      >
        <DropdownToggle nav caret>
          <span className="d-inline-flex align-items-center">
            <FontAwesomeIcon
              style={{ marginLeft: rightToLeft() ? '4px' : '' }}
              icon="database"
            />
            {zones.length > 1 && current_zone && (
              <span className="ml-2">{current_zone.zonename}</span>
            )}
          </span>
        </DropdownToggle>
        <DropdownMenu>
          {run_additional}
          {show_databases && database.length > 1 && (
            <>
              <Divider txt={t('lbl.databases', 'Databases')} />
              {database}
            </>
          )}
          {show_databases && (
            <>
              <Divider txt={t('lbl.zones', 'Zones')} />
              <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                {options}
              </div>
              {show_exit && <DropdownItem divider />}
            </>
          )}
          {show_exit && (
            <DropdownItem
              onClick={this.closeProgram}
              data-testid="dropdown_exit"
            >
              {t('fn.exit', 'Exit')}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    );
  };

  logOutSiteUser = () => {
    // log out user
    const name = this.props.user.current_user?.username;
    this.props.loginUser(null);
    // No redirect if machine is busy.
    // Instead show the login modal on top of everything.
    if (
      this.props.machines_states.length > 0 &&
      this.props.machines_states.filter((x) => x?.busy).length === 0
    ) {
      this.props.navigateTo('/');
    } else {
      this.setState({
        userLoginModal: true,
        user: { username: name, password: '' },
      });
    }
  };

  getSiteUsers = () => {
    const { user } = this.props;
    const users = user.users;
    let options = [];

    if (user.current_user && user.current_user.username) {
      options.push(
        <DropdownItem
          data-testid={`logged-${user.current_user.username}`}
          key={-1}
          onClick={() => {
            this.logOutSiteUser();
            this.setState({ user: user, userLoginModal: false });
          }}
        >
          <div style={{ display: 'inline-flex' }}>
            <div>
              {user.current_user.username}{' '}
              {user.current_user.stduser && '\uD83C\uDF10'}
            </div>
            <div style={{ position: 'fixed', right: '0.5rem' }}>
              <FontAwesomeIcon
                icon={'unlock'}
                style={{ color: HTML_COLOR_RED, fontSize: '1.2rem' }}
              />
            </div>
          </div>
        </DropdownItem>
      );
      options.push(<DropdownItem divider key={-2} />);
    }

    users.forEach((u, i) => {
      if (u.username !== user.current_user.username)
        options.push(
          <DropdownItem
            key={i}
            data-testid={`localuser-${u.username}`}
            onClick={() => {
              this.logOutSiteUser();
              this.setState({ user: u, userLoginModal: true });
            }}
          >
            {u.username} {u.stduser && '\uD83C\uDF10'}
          </DropdownItem>
        );
    });
    return options;
  };

  /**
   * Handles site user login
   */
  login = () => {
    this.props.loginUser(this.state.user);
  };

  _getSiteUserLoginModal = () => {
    /**
     * SITE USER LOGIN MODAL
     */

    const { t, user, configurations } = this.props;
    // If no users do not show modal at all.
    if (user.users.length === 0) {
      return null;
    }

    const uac_force_login = _.get(
      configurations.config,
      'uac_force_login.value',
      false
    );

    let showlogin = this.state.userLoginModal && !user.current_user.username;

    if (uac_force_login && !user.current_user.username) {
      showlogin = true;
    }

    const users = user.users;
    let options = users.map((item) => ({
      label: item.username,
      value: item.username,
    }));

    return (
      <Modal
        autoFocus={false}
        isOpen={showlogin}
        centered
        //toggle={this.showLogin}
        zIndex={1100}
      >
        <ModalHeader>{t('lbl.userLogin', 'User Login')}</ModalHeader>
        <ModalBody>
          <InputGroup>
            <div style={{ width: '100%' }}>
              <Select
                id="user_select"
                menuPlacement="auto"
                styles={{
                  control: (base) => ({ ...base, height: '3rem' }),
                  //option: (base) => ({ ...base, color: 'black' }),
                }}
                isClearable={true}
                isSearchable={false}
                onChange={(value) =>
                  this.setState((s) => ({
                    user: { ...s.user, username: value?.value },
                  }))
                }
                options={options || []}
                value={{
                  label: this.state.user?.username,
                  value: this.state.user?.username,
                }}
              />
            </div>
          </InputGroup>
          <InputGroup>
            <Input
              autoFocus={true}
              data-cy="user-login-password"
              className="input-normal  mt-8"
              style={{ borderRadius: '5px 0 0 5px' }}
              type={this.state.show ? 'text' : 'password'}
              onChange={(e) => {
                let t = e.target.value;
                this.setState((s) => ({
                  user: { ...s.user, password: t },
                }));
              }}
              onKeyUp={(e) => {
                if (e.keyCode === 13) this.login();
              }}
              placeholder={t('lbl.password', 'Password')}
            />
            <InputGroupAddon addonType="append" style={{ zIndex: 0 }}>
              <Button
                className="mt-8"
                color="warning"
                onClick={() =>
                  this.setState((state) => ({ show: !state.show }))
                }
                style={{
                  height: '48px',
                  //padding: '4px 10px',
                  borderRadius: '0 5px 5px 0',
                }}
              >
                <FontAwesomeIcon icon={this.state.show ? 'eye-slash' : 'eye'} />
              </Button>
            </InputGroupAddon>
          </InputGroup>
          <Alert
            color="danger"
            className="mt-8 br-8"
            isOpen={user.user_login_rejected !== null}
          >
            {user.user_login_rejected &&
              user.user_login_rejected.response &&
              user.user_login_rejected.response.data &&
              user.user_login_rejected.response.data.response &&
              user.user_login_rejected.response.data.response.statusText}
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Row className="w-100">
            <Col>
              <Button
                data-cy="user-login-cancel"
                color="warning"
                onClick={() => {
                  this.showLogin();
                  this.props.showLoginUser();
                  this.props.navigateTo('/');
                }}
                disabled={user.user_login_pending}
              >
                <i
                  className={
                    user.user_login_pending ? 'fas fa-spinner fa-spin' : null
                  }
                />
                {t('fn.cancel', 'Cancel')}
              </Button>
            </Col>
            <Col />
            <Col>
              <Button
                data-cy="user-login-submit"
                color="primary"
                onClick={this.login}
                disabled={user.user_login_pending}
              >
                <i
                  className={
                    user.user_login_pending ? 'fas fa-spinner fa-spin' : null
                  }
                />
                {t('fn.login', 'Login')}
              </Button>
            </Col>
          </Row>
        </ModalFooter>
      </Modal>
    );
  };

  getReplicationBtn = () => {
    const { t, replication_details, toggleReplicationModal } = this.props;

    // Check if has replication
    if (
      _.get(replication_details, 'error.response.data', '') === NO_REPLICATION
    )
      return;

    const fstate = _.get(
      replication_details,
      'data.site.formulas.site.state',
      REP_STATE_SLEEP
    );
    const sstate = _.get(
      replication_details,
      'data.site.sales.site.state',
      REP_STATE_SLEEP
    );

    const spin =
      [REP_STATE_RECIEV, REP_STATE_SEND].includes(fstate) ||
      [REP_STATE_RECIEV, REP_STATE_SEND].includes(sstate);

    let msg = t('lbl.replicationState', 'Replication state');
    let icon = 'sync-alt';
    if (
      [
        REP_STATE_ASK,
        REP_STATE_FULLSYNC_AT,
        REP_STATE_FULLSYNC_AT_MISSED,
      ].includes(fstate)
    ) {
      icon = 'question';
      msg = t(
        'meg.receivedFormulaFullSyncClickToSchedule',
        'Received formula database full synchronization. Click to schedule full sync time.'
      );
    } else {
      // No need to show the button
      return;
    }

    return (
      <NavItem key="fallback">
        <Button
          id="fallback"
          className="btn-config"
          onClick={toggleReplicationModal}
        >
          <FontAwesomeIcon icon="cloud" />

          <Badge color="primary" className="new-badge">
            <FontAwesomeIcon
              icon={icon}
              spin={spin}
              style={{ fontSize: '1rem' }}
            />
          </Badge>
        </Button>
        <UncontrolledTooltip placement="bottom" target="fallback">
          {msg}
        </UncontrolledTooltip>
      </NavItem>
    );
  };

  render() {
    const {
      user,
      configurations,
      started_as_admin,
      order_creation,
      dispensing,
    } = this.props;
    // Check also if local users defined in database!
    const show_user = user.users.length > 0;

    const config_disabled =
      !hasPrivilege('tools_and_settings') ||
      configurations.config_start ||
      (offline_mode && !started_as_admin);
    const uac_auto_logout = _.get(
      configurations.config,
      'uac_auto_logout.value',
      UAC_AUTO_LOGOUT_NEVER
    );
    const uac_auto_logout_interval = Math.max(
      _.get(configurations.config, 'uac_auto_logout_interval.value', 60),
      UAC_AUTO_LOGOUT_INTERVAL_MINIMUM
    );

    return (
      <>
        <header>
          <Navbar
            light
            expand
            className="d-flex flex-column flex-grow-1 flex-fill justify-content-center align-items-center align-content-center align-self-center flex-wrap m-auto top-nav"
          >
            <div data-testid="top-menu" className="container-fluid">
              <Nav className="navbar-nav d-flex flex-row flex-grow-1 flex-fill justify-content-between align-items-center align-content-center align-self-center">
                {this.getDatabases()}

                {/** User button*/}
                {show_user && (
                  <Dropdown
                    data-testid="localuserlogin"
                    nav
                    isOpen={this.state.loginMenuOpen}
                    toggle={this.openLoginMenu}
                  >
                    <DropdownToggle nav caret>
                      <FontAwesomeIcon icon="user-circle" />
                    </DropdownToggle>
                    <DropdownMenu>{this.getSiteUsers()}</DropdownMenu>
                  </Dropdown>
                )}

                {/** Replication button */}
                {!order_creation && this.getReplicationBtn()}

                {/** Update section */}
                {!order_creation && <UpdateButton />}

                {/** CONFIG MENU */}
                {!detectMobile() && !dispensing && (
                  <NavItem key="config">
                    {window.location.hash.startsWith('#/config') ? (
                      <Button onClick={this.goBack} className="btn-config">
                        <FontAwesomeIcon icon="arrow-left" />
                      </Button>
                    ) : (
                      <Button
                        onClick={this.toggleConfigMenu}
                        className="btn-config"
                        disabled={config_disabled}
                        data-testid="btn-config"
                        data-denied={
                          !hasPrivilege('tools_and_settings') ||
                          (offline_mode && !started_as_admin)
                        }
                        style={{
                          color: config_disabled
                            ? 'rgba(255,255,255,0.65)'
                            : 'unset',
                        }}
                      >
                        <FontAwesomeIcon icon="cog" />
                        <FontAwesomeIcon
                          icon="caret-down"
                          style={{
                            paddingLeft: rightToLeft() ? '' : '4px',
                            paddingRight: rightToLeft() ? '4px' : '',
                            fontSize: '1.3rem',
                            verticalAlign: '0.125rem',
                          }}
                        />
                      </Button>
                    )}
                  </NavItem>
                )}
              </Nav>
            </div>
          </Navbar>
        </header>
        {this._getSiteUserLoginModal()}
        {/**
         * Idle timer
         */}
        {uac_auto_logout === UAC_AUTO_LOGOUT_AFTER_IDLE &&
          user.users.length > 0 && (
            <IdleTimer
              element={document}
              onIdle={this.logOutSiteUser}
              debounce={250}
              timeout={1000 * uac_auto_logout_interval}
            />
          )}
      </>
    );
  }
}

TopButtons.propTypes = {
  update: PropTypes.shape({
    has_update: PropTypes.bool.isRequired,
    version_details: PropTypes.shape({
      front_version: PropTypes.number,
      front_version_url: PropTypes.string,
    }),
  }),
  t: PropTypes.func.isRequired,
  setZone: PropTypes.func.isRequired,
  navigateTo: PropTypes.func.isRequired,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      zoneid: PropTypes.number,
      zonename: PropTypes.string,
    })
  ),
  loginUser: PropTypes.func.isRequired,
  user: PropTypes.shape({
    current_user: PropTypes.shape({
      username: PropTypes.string,
      stduser: PropTypes.bool,
      privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
    user_login_pending: PropTypes.bool,
    user_login_rejected: PropTypes.object,
    users: PropTypes.array,
    show_login_user: PropTypes.bool,
  }),

  className: PropTypes.string,
  show_update: PropTypes.bool,
  replication_details: PropTypes.object,
  configurations: PropTypes.shape({
    zone: PropTypes.shape({
      zoneid: PropTypes.number,
      zonename: PropTypes.string,
    }),
    config: PropTypes.shape(),
    config_start: PropTypes.bool,
  }),
  toggleReplicationModal: PropTypes.func,
  showLoginUser: PropTypes.func,
  logOutSite: PropTypes.func,
  machines_states: PropTypes.array,
  is_pro: PropTypes.bool,
  is_standalone: PropTypes.bool,
  started_as_admin: PropTypes.bool,
  runAction: PropTypes.func,
  order_creation: PropTypes.bool,
  dispensing: PropTypes.bool,
};

function mapStateToProps(store) {
  return {
    user: store.user,
    zones: store.cache.zones,
    machines_states: machineSelectors.machinesStates(store),
    configurations: store.configurations,
    update: store.update_checker,
    replication_details: store.replication.details,
    is_pro: protectionSelectors.is_pro(store),
    is_standalone: store.configurations.is_standalone,
    started_as_admin: userSelectors.started_as_admin(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setZone: configActions.setZone,
      showLoginUser: userActions.showLoginUser,
      loginUser: userActions.loginUser,
      toggleReplicationModal: replicationActions.toggleModal,
      navigateTo: push,
      approveDownload: updateActions.approveDownload,
      startUpdate: updateActions.startUpdate,
      logOutSite: loginActions.logOutSite,
      runAction: replicationActions.runReplicationAction,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(TopButtons)
);
