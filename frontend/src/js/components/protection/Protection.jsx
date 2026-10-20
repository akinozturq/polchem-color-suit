import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import protectionActions, {
  actionTypes,
} from '../../redux/reducers/Protection';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  Alert,
  Container,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Col,
  Row,
  Input,
  Button,
  Label,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import Spinner from '../shared/Spinner';
import { protectionStatusTranslations } from 'js/SharedTranslations';
import { push } from 'connected-react-router';
import { FEATURE_IT4 } from '../../Constants';
import { hasPrivilege } from '../../mylib/Privileges';

class Protection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: '1',
      prev_status: null,
      status: {},
      unlock_cert: '',
    };
    const { t } = props;

    this.code_map = protectionStatusTranslations(t);
  }

  static getDerivedStateFromProps(props, state) {
    // State layout and update is needed because the custom text editing needs to be send to Qt Side!
    if (!_.isEqual(props.protection.status, state.prev_status)) {
      return {
        status: props.protection.status,
        prev_status: _.cloneDeep(props.protection.status),
      };
    }
    return null;
  }

  goBack = () => {
    this.props.push('/');
  };

  unlockcertChanged = (event) => {
    this.setState({ unlock_cert: event.target.value });
  };

  handleChange = (event) => {
    let value = event.target.value;
    this.setState((prev) => ({
      ...prev,
      status: { ...prev.status, license_code: value },
    }));
  };

  toggleActiveTab(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab,
      });
    }
  }

  getClass = (tab) => {
    return (
      'pointer-cursor ' +
      (this.state.activeTab === tab ? 'active' : 'white-nowrap')
    );
  };

  getManualActivation = () => {
    const { t, protection } = this.props;
    const activated =
      ((protection.status && protection.status.status) || -1) > 0;

    let cert =
      (protection.status && protection.status.activation_request) || null;

    if (cert === null) {
      cert =
        protection.action_result_type === actionTypes.ACTIVATE_CERT_REQUEST
          ? protection.action_results || ''
          : '';
    }

    return (
      <>
        <Row>
          <Col className="pl-16 m-auto pb-8">
            {t('lbl.licenseCode.colon', 'License code:')}
          </Col>
          <Col className="m-auto pb-8">
            <Input
              type="text"
              value={
                (this.state.status && this.state.status.license_code) || ''
              }
              onChange={this.handleChange}
            />
          </Col>
          <Col className="pr-16 p-4 pb-8">
            <Button
              color="primary"
              disabled={
                !(this.state.status && this.state.status.license_code) ||
                activated
              }
              onClick={() =>
                this.props.generatecert(this.state.status.license_code)
              }
            >
              {t('fn.generateCertificate', 'Generate certificate')}
            </Button>
          </Col>
        </Row>
        <Row>
          <Col xs={4} className="pl-16 p-4 pb-8">
            <Label>{t('lbl.certificate', 'Certificate')}:</Label>
          </Col>
          <Col className="pr-16 p-4 pb-8">
            <textarea
              style={{
                border: '1px solid #AAB',
                borderRadius: '0.25rem',
                width: '100%',
                backgroundColor: 'white',
              }}
              readOnly
              value={cert || ''}
            />
          </Col>
        </Row>

        <Row>
          <Col xs={4}>
            <Label>{t('fn.navigateTo', 'Navigate to')}:</Label>{' '}
          </Col>
          <Col className="p-4">
            <a
              href="http://my.polchem.com/activation"
              target="_blank"
              rel="noopener noreferrer"
            >
              my.polchem.com/activation
            </a>
          </Col>
        </Row>
        <Row>
          <Col xs={4} className="pl-16 pr-16 pt-8">
            <Label>{t('lbl.unlockCertificate', 'Unlock certificate')}:</Label>
          </Col>
          <Col className="p-4 pr-16 pt-8">
            <textarea
              style={{
                border: '1px solid #AAB',
                borderRadius: '0.25rem',
                width: '100%',
                backgroundColor: 'white',
              }}
              value={this.state.unlock_cert}
              onChange={this.unlockcertChanged}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={8} />
          <Col className="pr-16 pl-16">
            <Button
              color="primary"
              onClick={() => this.props.activateOffline(this.state.unlock_cert)}
              disabled={!this.state.unlock_cert || activated}
            >
              {t('fn.activateNow', 'Activate now')}
            </Button>
          </Col>
        </Row>
      </>
    );
  };

  getManualDeActivation = () => {
    const { t, protection } = this.props;
    const activated =
      ((protection.status && protection.status.status) || -1) > 0;

    const cert =
      protection.action_result_type === actionTypes.DEACTIVATION_CERT_REQUEST
        ? protection.action_results
        : protection.status && protection.status.deactivation_request;

    return (
      <>
        <Row>
          <Col xs={4} />
          <Col className="p-16">
            <Button
              color="danger"
              disabled={!activated}
              onClick={() => this.props.deactivateOffline()}
            >
              {t(
                'fn.generateCertificateAndRemoveLicense',
                'Generate certificate and remove license'
              )}
            </Button>
          </Col>
        </Row>
        <Row>
          <Col xs={4} className="p-16">
            <Label>{t('lbl.certificate', 'Certificate')}:</Label>
          </Col>
          <Col className="p-16">
            <textarea
              style={{
                border: '1px solid #AAB',
                borderRadius: '0.25rem',
                width: '100%',
                backgroundColor: 'white',
              }}
              readOnly
              value={cert || ''}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={4}>
            <Label>{t('fn.navigateTo', 'Navigate to')}:</Label>{' '}
          </Col>
          <Col>
            <a
              href="http://my.polchem.com/deactivation"
              target="_blank"
              rel="noopener noreferrer"
            >
              my.polchem.com/deactivation
            </a>
          </Col>
        </Row>
      </>
    );
  };

  exit = () => {
    if (window.qtside) {
      window.qtside.bridge.closePOS();
    }
  };

  render() {
    const { t, protection } = this.props;
    const { status } = protection;

    const activated = (status?.status || -1) > 0;
    const it4_activated = activated && status?.features.includes(FEATURE_IT4);
    const trialActivated = status?.status === 2;

    let status_text = status ? (
      this.code_map[status.status] ||
      t('lbl.unknownStatus', 'Unknown status') + ' ' + status.status
    ) : (
      <Spinner />
    );

    const response_text = this.code_map[protection.action_results] || null;

    const expdate = status?.expdate;
    const daysleft = status?.daysleft;

    if (expdate) {
      status_text +=
        ' ' + t('lbl.expiresOn_date.colon', 'expires on:') + ' ' + expdate;
    }
    if (daysleft) {
      status_text +=
        ' ' + t('lbl.daysLeft.colon', 'days left:') + ' ' + daysleft;
    }
    if (status?.cloud) {
      return (
        <Row
          className="white-nowrap"
          style={{ textAlign: 'center', height: '30rem' }}
        >
          <Col style={{ margin: 'auto' }}>
            <h1 onClick={this.goBack} className="pointer-cursor">
              <FontAwesomeIcon icon="arrow-left" style={{ fontSize: '2rem' }} />{' '}
              {t(
                'msg.licenseManagedByCloud',
                'License is managed by cloud server'
              )}
            </h1>
          </Col>
        </Row>
      );
    }

    if (!hasPrivilege('activation') && it4_activated) {
      return (
        <Row
          className="white-nowrap"
          style={{ textAlign: 'center', height: '30rem' }}
        >
          <Col style={{ margin: 'auto' }}>
            <h1 onClick={this.goBack} className="pointer-cursor">
              <FontAwesomeIcon icon="arrow-left" style={{ fontSize: '2rem' }} />{' '}
              {t('msg.accessDenied', 'Access is denied')}
            </h1>
          </Col>
        </Row>
      );
    }

    return (
      <div className={'zoom-in'}>
        <Row>
          <Col xs={2}>
            <h2 className="clickable-text mt-4" onClick={this.goBack}>
              <FontAwesomeIcon
                icon="arrow-left"
                style={{ fontSize: '1.7rem' }}
              />{' '}
            </h2>
          </Col>
          <Col style={{ textAlign: 'center' }} className="mt-8">
            <h5 className="white-nowrap">{status_text}</h5>
          </Col>
          <Col xs={2} />
        </Row>
        <Container
          className="justify-content-center"
          style={{ height: 'calc(100vh - 102px - 8rem)' }}
        >
          <Row className="mb-8">
            <Col className="pl-16">
              <Label className="white-nowrap">
                {t('lbl.computerId', 'Computer ID')}:{' '}
              </Label>
            </Col>
            <Col className="pr-8">
              <Label className="white-nowrap">{status?.computerid || ''}</Label>
            </Col>
            <Col className="pl-8">
              <Label className="white-nowrap">
                {t('lbl.licenseCode', 'License code')}:{' '}
              </Label>
            </Col>
            <Col className="pr-16">
              <Label className="white-nowrap">
                {status?.license_code || ''}
              </Label>
            </Col>
          </Row>
          <Nav tabs className="machine-tabs">
            <NavItem>
              <NavLink
                className={this.getClass('1')}
                onClick={() => {
                  this.toggleActiveTab('1');
                }}
              >
                {t('lbl.onlineActivation', 'Online activation')}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={this.getClass('2')}
                onClick={() => {
                  this.toggleActiveTab('2');
                }}
              >
                {t('lbl.manualActivation', 'Manual activation')}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={this.getClass('3')}
                onClick={() => {
                  this.toggleActiveTab('3');
                }}
              >
                {t('lbl.onlineDeactivation', 'Online deactivation')}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={this.getClass('4')}
                onClick={() => {
                  this.toggleActiveTab('4');
                }}
              >
                {t('lbl.manualDeactivation', 'Manual deactivation')}
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent
            activeTab={this.state.activeTab}
            className="scroll"
            style={{
              background: 'white',
              height: '70%',
              borderRadius: '0 0 0.5rem 0.5rem',
            }}
          >
            <TabPane tabId="1">
              {/** Online activation  */}
              <Row className="mt-40 pt-40">
                <Col className="p-16 m-auto">
                  {t('lbl.licenseCode.colon', 'License code:')}
                </Col>
                <Col className="p-16 m-auto">
                  <Input
                    type="text"
                    value={
                      (this.state.status && this.state.status.license_code) ||
                      ''
                    }
                    onChange={this.handleChange}
                  />
                </Col>
                <Col className="p-16">
                  <Button
                    color="primary"
                    disabled={
                      !(this.state.status && this.state.status.license_code)
                    }
                    onClick={() =>
                      this.props.activate(this.state.status.license_code)
                    }
                  >
                    {t('fn.activateNow', 'Activate now')}
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <Alert isOpen={activated && !it4_activated} color="danger">
                    {t(
                      'lbl.no_it4_feature',
                      'You have valid license, but no polchem_color_suit 4 feature activated in license'
                    )}
                  </Alert>
                  <Alert isOpen={status?.status < 0} color="danger">
                    {status_text}
                  </Alert>
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="2">
              {/** Manual activation */} {this.getManualActivation()}
            </TabPane>
            <TabPane tabId="3">
              {/** Online deactivation  */}
              <Row className="mt-40 pt-40">
                <Col className="p-16">
                  <Button
                    color="danger"
                    disabled={!activated}
                    onClick={this.props.deactivate}
                  >
                    {t('fn.returnLicense', 'Return license')}
                  </Button>
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="4">
              {/** Manual deactivation */} {this.getManualDeActivation()}
            </TabPane>
          </TabContent>
          <Row>
            <Col className="mt-1">
              <Alert color="info" isOpen={protection.action_started}>
                <Spinner />{' '}
                <Label>{t('msg.processing.ellipsis', 'Processing...')}</Label>
              </Alert>
              <Alert color="success" isOpen={response_text}>
                {response_text}
              </Alert>
              <Alert color="danger" isOpen={protection.action_error}>
                {JSON.stringify(protection.action_error)}
              </Alert>
            </Col>
          </Row>
          <Row className="mb-16" style={{ position: 'fixed', bottom: 0 }}>
            <Col>
              {trialActivated && daysleft && (
                <Button onClick={this.goBack} style={{ width: 'auto' }}>
                  {t(
                    'lbl.continueTrialDaysDaysLeft',
                    'Continue trial ({{days}} days left)',
                    { days: daysleft }
                  )}
                </Button>
              )}
              {!activated && (
                <Button onClick={this.exit} style={{ width: 'auto' }}>
                  {t('fn.exit', 'Exit')}
                </Button>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

Protection.propTypes = {
  protection: PropTypes.shape({
    action_error: PropTypes.object,
    action_started: PropTypes.bool.isRequired,
    status: PropTypes.shape({
      status: PropTypes.number,
      license_code: PropTypes.string,
      computerid: PropTypes.string,
      deactivation_request: PropTypes.string,
      activation_request: PropTypes.string,
      daysleft: PropTypes.number,
      expdate: PropTypes.array,
      cloud: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string),
    }),
    action_results: PropTypes.string,
    action_result_type: PropTypes.string,
  }),
  activate: PropTypes.func.isRequired,
  deactivate: PropTypes.func.isRequired,
  generatecert: PropTypes.func.isRequired,
  activateOffline: PropTypes.func.isRequired,
  deactivateOffline: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  push: PropTypes.func.isRequired,
};

function mapStateToProps(store) {
  return {
    protection: store.protection,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      activate: protectionActions.activateOnline,
      deactivate: protectionActions.deactivateOnline,
      generatecert: protectionActions.activationCertificateRequest,
      activateOffline: protectionActions.activateOffline,
      // resetcert: protectionActions.activationCertificateReset,
      deactivateOffline: protectionActions.deactivationCertificateRequest,
      push: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Protection)
);
