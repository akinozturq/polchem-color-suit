import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  FormGroup,
  Input,
  Label,
  Progress,
  Row,
} from 'reactstrap';

import Spinner from '../../shared/Spinner';
import standalone2cloudActions, {
  selectors as standaloneSelectors,
} from 'js/redux/reducers/Standalone2Cloud';
import _ from 'lodash';

const RUNNING_ORDER_STATUSES = new Set(['queued', 'processing']);

const humanizeStatus = (status) => {
  if (typeof status !== 'string') {
    return '';
  }
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatOrderStats = (stats) => {
  if (!stats) {
    return null;
  }
  const entries = Object.entries(stats);
  if (!entries.length) {
    return null;
  }
  return entries
    .map(([key, value]) => `${humanizeStatus(key)}: ${value}`)
    .join(', ');
};

class Standalone2Cloud extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'sql',
      selectedDatabase: '',
      selectedSite: '',
    };
  }

  accessDenied = (privilege) => {
    const { privileges } = this.props;
    return !_.includes(privileges, privilege);
  };

  componentDidMount() {
    this.startOrderStatusPolling();
  }

  componentDidUpdate(prevProps) {
    const prevSiteId = prevProps.site?.siteid;
    const nextSiteId = this.props.site?.siteid;
    if (prevSiteId !== nextSiteId) {
      this.props.pollOrderStatusStop();
      this.startOrderStatusPolling();
    }
  }

  componentWillUnmount() {
    this.props.pollOrderStatusStop();
  }

  startOrderStatusPolling = () => {
    const siteId = this.props.site?.siteid;
    if (siteId) {
      this.props.pollOrderStatusStart(siteId);
    }
  };

  updateField = (field) => (event) => {
    this.setState({ [field]: event.target.value });
  };

  fetchDatabases = () => {
    const { host, port, user, password } = this.state;
    this.props.listDatabases({
      host,
      port: Number(port) || 3306,
      user,
      password,
    });
  };

  fetchSites = (database) => {
    const { host, port, user, password } = this.state;
    if (!database) {
      return;
    }
    this.props.listSites({
      host,
      port: Number(port) || 3306,
      user,
      password,
      database,
    });
  };

  handleDatabaseChange = (event) => {
    const database = event.target.value;
    this.setState({ selectedDatabase: database, selectedSite: '' }, () =>
      this.fetchSites(database)
    );
  };

  handleSiteChange = (event) => {
    this.setState({ selectedSite: event.target.value });
  };

  startSync = () => {
    const { host, port, user, password, selectedDatabase, selectedSite } =
      this.state;

    if (!selectedDatabase || !selectedSite) {
      return;
    }

    this.props.startSync({
      host,
      port: Number(port) || 3306,
      user,
      password,
      database: selectedDatabase,
      site_id: Number(selectedSite),
      upload_site_id: this.props.site.siteid,
    });
  };

  cancelSync = () => {
    this.props.cancelSync();
  };

  render() {
    const {
      t,
      databases,
      sites,
      isFetchingDatabases,
      isFetchingSites,
      isSyncRunning,
      progressMessage,
      progressPercent,
      error,
      orderSyncStatus,
      orderSyncPercentage,
      orderSyncStats,
      orderSyncError,
      site,
    } = this.props;
    const { host, port, user, password, selectedDatabase, selectedSite } =
      this.state;
    const serverProgressActive = orderSyncStatus && orderSyncStatus !== 'idle';
    const serverProgressValue = Number.isFinite(orderSyncPercentage)
      ? orderSyncPercentage
      : 0;

    const clampProgress = (value) =>
      Math.min(Math.max(Number(value) || 0, 0), 100);
    const progressValue = clampProgress(progressPercent);
    const statusPrefix = serverProgressActive
      ? humanizeStatus(orderSyncStatus)
      : null;

    const fallbackMessage = t('msg.waiting', 'Waiting for action...');
    const serverStatusLabel =
      serverProgressActive && statusPrefix
        ? [
            statusPrefix,
            Number.isFinite(serverProgressValue)
              ? `${Math.round(serverProgressValue)}%`
              : null,
          ]
            .filter(Boolean)
            .join(' ')
        : fallbackMessage;

    const progressLabel = progressMessage || fallbackMessage;
    const statsSummary = isSyncRunning
      ? null
      : formatOrderStats(orderSyncStats);
    const isOrderSyncBusy = RUNNING_ORDER_STATUSES.has(orderSyncStatus);

    if (this.accessDenied('order_synchronization')) {
      return (
        <Card style={{ height: 'calc((100vh - 102px) - 6rem)' }}>
          <CardHeader>
            {t('cfg.h_standalone2cloud', 'Order synchronization')}
          </CardHeader>
          <CardBody className="scroll p-3">
            <Row className="mt-40">
              <Col />
              <Col xs={10}>
                <h3 style={{ color: 'red', textAlign: 'center' }}>
                  {t(
                    'lbl.accessDeniedStandalone2Cloud',
                    'Access denied to order synchronization'
                  )}
                </h3>
              </Col>
              <Col />
            </Row>
          </CardBody>
        </Card>
      );
    }

    return (
      <Card style={{ height: 'calc((100vh - 102px) - 6rem)' }}>
        <CardHeader>
          {t('cfg.h_standalone2cloud', 'Order synchronization')}
        </CardHeader>
        <CardBody className="scroll p-3">
          <Row className="mb-2">
            <Col>
              <b>
                {t(
                  'cfg.standalone2cloudDescription',
                  'Compressess data from local database and syncronizes the orders to site "{{sitename}}".',
                  site
                )}
              </b>
            </Col>
          </Row>
          <Row form className="mb-1">
            <Col md={4}>
              <FormGroup>
                <Label>{t('lbl.host', 'Database Host')}</Label>
                <Input value={host} onChange={this.updateField('host')} />
              </FormGroup>
            </Col>
            <Col md={2}>
              <FormGroup>
                <Label>{t('lbl.port', 'Port')}</Label>
                <Input
                  type="number"
                  value={port}
                  onChange={this.updateField('port')}
                />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label>{t('lbl.user', 'User')}</Label>
                <Input value={user} onChange={this.updateField('user')} />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label>{t('lbl.password', 'Password')}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={this.updateField('password')}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row form className="mb-3">
            <Col>
              <Button
                color="primary"
                onClick={this.fetchDatabases}
                disabled={isFetchingDatabases || isSyncRunning}
              >
                {t('fn.listDatabases', 'List databases')}
                {isFetchingDatabases && <Spinner />}
              </Button>
            </Col>
          </Row>
          <Row form>
            <Col md={6}>
              <FormGroup>
                <Label>{t('lbl.database', 'Database')}</Label>
                <Input
                  type="select"
                  value={selectedDatabase}
                  onChange={this.handleDatabaseChange}
                  disabled={!databases.length}
                >
                  <option value="">{t('fn.choose', 'Choose...')}</option>
                  {databases.map((db) => (
                    <option key={db} value={db}>
                      {db}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>{t('lbl.site', 'Site')}</Label>
                <Input
                  type="select"
                  value={selectedSite}
                  onChange={this.handleSiteChange}
                  disabled={!sites.length}
                >
                  <option value="">{t('fn.choose', 'Choose...')}</option>
                  {sites.map((site) => (
                    <option key={site.siteid} value={site.siteid}>
                      {site.sitename || site.siteid}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>

          <Row form className="mb-3">
            <Col>
              {isSyncRunning ? (
                <Button color="danger" onClick={this.cancelSync}>
                  {t('fn.cancel', 'Cancel')}
                </Button>
              ) : (
                <Button
                  color="success"
                  onClick={this.startSync}
                  disabled={
                    isSyncRunning ||
                    isOrderSyncBusy ||
                    !selectedDatabase ||
                    !selectedSite ||
                    isFetchingDatabases ||
                    isFetchingSites
                  }
                >
                  {t('fn.startSync', 'Start synchronization')}
                </Button>
              )}
            </Col>
          </Row>
          {progressMessage && (
            <Row>
              <Col>
                <Progress value={progressValue} />
                <div className="mt-2 small">
                  {t('lbl.export_status', 'Export status: {{status}}', {
                    status: progressLabel,
                  })}
                </div>
              </Col>
            </Row>
          )}

          {serverProgressActive && (
            <Row>
              <Col>
                <Progress value={serverProgressValue} />
                <div className="mt-2 small">
                  {t('lbl.import_status', 'Import status: {{status}}', {
                    status: serverStatusLabel,
                  })}
                </div>
                {statsSummary && <div className="small">{statsSummary}</div>}
              </Col>
            </Row>
          )}

          {error && (
            <Row>
              <Col>
                <Alert color="danger">{error}</Alert>
              </Col>
            </Row>
          )}
          {orderSyncError && (
            <Row>
              <Col>
                <Alert color="danger">
                  {t('cfg.orderSyncServerError', 'Order import error:')}{' '}
                  {orderSyncError}
                </Alert>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>
    );
  }
}

Standalone2Cloud.propTypes = {
  t: PropTypes.func.isRequired,
  databases: PropTypes.arrayOf(PropTypes.string),
  sites: PropTypes.arrayOf(
    PropTypes.shape({
      siteid: PropTypes.number,
      sitename: PropTypes.string,
    })
  ),
  isFetchingDatabases: PropTypes.bool,
  isFetchingSites: PropTypes.bool,
  isSyncRunning: PropTypes.bool,
  progressMessage: PropTypes.string,
  progressPercent: PropTypes.number,
  error: PropTypes.string,
  resultMessage: PropTypes.string,
  orderSyncStatus: PropTypes.string,
  orderSyncPercentage: PropTypes.number,
  orderSyncStats: PropTypes.object,
  orderSyncError: PropTypes.string,
  listDatabases: PropTypes.func.isRequired,
  listSites: PropTypes.func.isRequired,
  startSync: PropTypes.func.isRequired,
  cancelSync: PropTypes.func.isRequired,
  pollOrderStatusStart: PropTypes.func.isRequired,
  pollOrderStatusStop: PropTypes.func.isRequired,
  site: PropTypes.object.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
};

Standalone2Cloud.defaultProps = {
  databases: [],
  sites: [],
  isFetchingDatabases: false,
  isFetchingSites: false,
  isSyncRunning: false,
  progressMessage: null,
  progressPercent: 0,
  error: null,
  resultMessage: null,
  orderSyncStatus: 'idle',
  orderSyncPercentage: 0,
  orderSyncStats: {},
  orderSyncError: null,
};

function mapStateToProps(state) {
  return {
    databases: standaloneSelectors.databases(state),
    sites: standaloneSelectors.sites(state),
    isFetchingDatabases: standaloneSelectors.isFetchingDatabases(state),
    isFetchingSites: standaloneSelectors.isFetchingSites(state),
    isSyncRunning: standaloneSelectors.isSyncRunning(state),
    progressMessage: standaloneSelectors.progressMessage(state),
    progressPercent: standaloneSelectors.progressPercent(state),
    error: standaloneSelectors.error(state),
    resultMessage: standaloneSelectors.resultMessage(state),
    orderSyncStatus: standaloneSelectors.orderSyncStatus(state),
    orderSyncPercentage: standaloneSelectors.orderSyncPercentage(state),
    orderSyncStats: standaloneSelectors.orderSyncStats(state),
    orderSyncError: standaloneSelectors.orderSyncError(state),
    site: state.configurations.site,
    privileges: state.user.current_user.privileges,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      listDatabases: standalone2cloudActions.listDatabases,
      listSites: standalone2cloudActions.listSites,
      startSync: standalone2cloudActions.startSync,
      cancelSync: standalone2cloudActions.cancelSync,
      pollOrderStatusStart: standalone2cloudActions.pollOrderStatusStart,
      pollOrderStatusStop: standalone2cloudActions.pollOrderStatusStop,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Standalone2Cloud)
);
