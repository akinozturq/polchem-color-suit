import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Label,
  Col,
  Row,
  Input,
  Alert,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import replicationActions from 'js/redux/reducers/Replication';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';
import _ from 'lodash';
import { REP_STATE_MAP } from '../../../Constants';

import Spinner from '../../shared/Spinner';
import { dateTimeToLocaleString } from '../../../mylib/DateUtils';
import { rightToLeft } from '../../../mylib/Utils';

class Replication extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.fetchDetails();
  }

  runAdditional = () => {
    this.props.runAction({ action: 'runadditional' });
  };

  resendOrders = () => {
    const { t } = this.props;

    confirmAlert({
      title: t('msg.confirmResendOrders.title', 'Confirm resending orders'),
      message: t(
        'msg.confirmResendOrders',
        'This will resend every order created on the site again. Do you want to proceed?'
      ),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => this.props.resendOrders(),
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  removeReplication = () => {
    const { t } = this.props;

    confirmAlert({
      title: t(
        'msg.confirmRemoveReplication.title',
        'Confirm replication removal'
      ),
      message: t(
        'msg.confirmRemoveReplication',
        'Are you sure you want to remove replication from the database?'
      ),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => this.props.runAction({ action: 'remove' }),
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  pauseReplication = () => {
    const { t } = this.props;

    confirmAlert({
      title: t(
        'msg.confirmPauseReplication.title',
        'Confirm replication pause'
      ),
      message: t(
        'msg.confirmPauseReplication',
        'Are you sure you want to pause replication for this database?'
      ),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => this.props.runAction({ action: 'pause' }),
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  resumeReplication = () => {
    this.props.runAction({ action: 'resume' });
  };

  getRow = (label, value, type) => {
    let child = null;
    if (type === 'datetime') {
      child = dateTimeToLocaleString(value);
    } else {
      child =
        String(value || '').length > 40 ? (
          <textarea
            className="form-control form-control-sm"
            readOnly
            value={value || ''}
          />
        ) : (
          <Input value={value || ''} readOnly />
        );
    }
    return (
      <div>
        <FormGroup row>
          <Label sm={5}>{label}</Label>
          <Col sm={7}>{child}</Col>
        </FormGroup>
      </div>
    );
  };

  getChannelData = (channel_data) => {
    const { t } = this.props;
    return (
      <>
        {this.getRow(
          t('lbl.installationPackageid', 'Installation package ID'),
          _.get(channel_data, 'site.dbpackageid')
        )}
        {this.getRow(
          t('lbl.databaseId', 'Database ID'),
          _.get(channel_data, 'site.generatedguid')
        )}
        {this.getRow(
          t('lbl.parentDatabaseId', 'Parent database ID'),
          _.get(channel_data, 'parent.generatedguid')
        )}
        {this.getRow(
          t('lbl.subscribedBy', 'Subscribed by'),
          _.get(channel_data, 'site.subscribedby')
        )}
        {this.getRow(
          t('lbl.replicationState', 'Replication state'),
          _.get(REP_STATE_MAP, _.get(channel_data, 'site.state'))
        )}

        {this.getRow(
          t('lbl.lastSentTime', 'Last sent time'),
          _.get(channel_data, 'parent.lastsendtime'),
          'datetime'
        )}

        {this.getRow(
          t('lbl.lastReceivedTime', 'Last recieved time'),
          _.get(channel_data, 'parent.lastrecvtime'),
          'datetime'
        )}
        {this.getRow(
          t('lbl.lastProcessed', 'Last processed'),
          _.get(channel_data, 'parent.lastprocessed')
        )}
        {this.getRow(
          t('lbl.lastActionSent', 'Last action sent'),
          _.get(channel_data, 'parent.lastactionsend')
        )}
        {this.getRow(
          t('lbl.lastError', 'Last error'),
          _.get(channel_data, 'site.lasterror')
        )}
      </>
    );
  };

  accessDenied = (privilege) => {
    const { privileges } = this.props;
    return !_.includes(privileges, privilege);
  };

  render() {
    const { t, replication } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';

    const action_pending = replication.action_results.pending;
    const resend_pending = replication.resend_orders.pending;
    const resend_orders_possible = _.get(
      replication,
      'details.data.orders_resendable',
      false
    );

    const resend_orders_lasttime = _.get(
      replication,
      'details.data.last_orders_resend_request_time',
      null
    );

    if (this.accessDenied('replication_overview'))
      return (
        <Card>
          <CardBody>
            <p>{t('msg.permissionDenied', 'Permission denied')}</p>
          </CardBody>
        </Card>
      );

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          {t('lbl.replicationDetails', 'Replication details')}{' '}
          {replication.details.pending && <Spinner />}
        </CardHeader>
        <CardBody className="scroll config-card-body" dir={direction}>
          <div className="group-box">
            <p>{t('lbl.replicationService', 'Replication service')}</p>
            {this.getRow(
              t('lbl.serviceStarted', 'Service started'),

              _.get(replication, 'details.data.service.running', false)
                ? t('fn.yes', 'Yes')
                : t('fn.no', 'No')
            )}
            {this.getRow(
              t('lbl.serviceStatus', 'Service status'),
              _.get(replication, 'details.data.service.status')
            )}
            {this.getRow(
              t('lbl.serviceVersion', 'Service version'),
              _.get(replication, 'details.data.service.version')
            )}
          </div>
          <div className="group-box">
            <p>{t('lbl.siteReplicationDetails', 'Site replication details')}</p>
            {this.getRow(
              t('lbl.connectionToFtpSftpFtps', 'Connection to FTP/SFTP/FTPS'),
              _.get(
                replication,
                'details.data.site.formulas.site.conncheckresults'
              )
            )}
            {this.getRow(
              t('lbl.lastConnectionCheckTime', 'Last connection check time'),
              _.get(
                replication,
                'details.data.site.formulas.site.connchecktime'
              ),
              'datetime'
            )}

            <Alert
              color="danger"
              isOpen={replication.action_results.error !== null}
            >
              {t('msg.errorRunningAction', 'Error running action')}
              <div style={{ color: '#212529' }}>
                {JSON.stringify(replication.action_results.error)}
              </div>
            </Alert>
            <Alert
              color="success"
              isOpen={replication.action_results.data !== null}
            >
              {replication.action_results.data &&
                replication.action_results.data.msg}
            </Alert>
            <Alert
              color="danger"
              isOpen={replication.resend_orders.error !== null}
            >
              {t('msg.errorResendingOrders', 'Error resending orders')}
              <div style={{ color: '#212529' }}>
                {JSON.stringify(replication.resend_orders.error)}
              </div>
            </Alert>
            <Alert
              color="success"
              isOpen={replication.resend_orders.data !== null}
            >
              {replication.resend_orders.data &&
                replication.resend_orders.data.msg}
            </Alert>

            <Row>
              <Col>
                <Button
                  color="danger"
                  onClick={this.removeReplication}
                  data-denied={this.accessDenied('remove_replication')}
                  disabled={
                    action_pending || this.accessDenied('remove_replication')
                  }
                >
                  {action_pending && <Spinner />}
                  {t('fn.remove', 'Remove')}
                </Button>
              </Col>

              {_.get(
                replication,
                'details.data.site.formulas.site.siteactive',
                0
              ) === 1 ? (
                <Col>
                  <Button
                    color="warning"
                    data-denied={this.accessDenied('pause_replication')}
                    onClick={this.pauseReplication}
                    disabled={
                      action_pending || this.accessDenied('pause_replication')
                    }
                  >
                    {action_pending && <Spinner />}
                    {t('fn.pause', 'Pause')}
                  </Button>
                </Col>
              ) : (
                <Col>
                  <Button
                    color="success"
                    onClick={this.resumeReplication}
                    data-denied={this.accessDenied('resume_replication')}
                    disabled={
                      action_pending || this.accessDenied('resume_replication')
                    }
                  >
                    {action_pending && <Spinner />}
                    {t('fn.resume', 'Resume')}
                  </Button>
                </Col>
              )}

              <Col>
                <Button
                  color="success"
                  onClick={this.runAdditional}
                  data-denied={this.accessDenied('run_replication')}
                  disabled={
                    action_pending || this.accessDenied('run_replication')
                  }
                >
                  {action_pending && <Spinner />}
                  {t('fn.runAdditional', 'Run additional')}
                </Button>
              </Col>
            </Row>

            {!resend_orders_possible && resend_orders_lasttime && (
              <Row className="mt-2">
                <Col>
                  <Alert color="info">
                    {t(
                      'msg.resendOrdersNotPossible',
                      'Resending orders is not possible at the moment (waiting server to confirm previous send). Last resend request was made at {{time}}.',
                      { time: dateTimeToLocaleString(resend_orders_lasttime) }
                    )}
                  </Alert>
                </Col>
              </Row>
            )}

            <Row className="mt-2">
              <Col>
                <Button
                  color="danger"
                  onClick={this.resendOrders}
                  data-denied={this.accessDenied('run_replication')}
                  disabled={
                    action_pending ||
                    resend_pending ||
                    this.accessDenied('run_replication') ||
                    !resend_orders_possible
                  }
                >
                  {resend_pending && <Spinner />}
                  {t('fn.resendOrders', 'Resend orders')}
                </Button>
              </Col>
            </Row>

            <div className="group-box">
              <p>{t('lbl.formulas', 'Formulas')}</p>
              {this.getChannelData(
                _.get(replication, 'details.data.site.formulas', {})
              )}
            </div>
            <div className="group-box">
              <p>{t('lbl.sales', 'Sales')}</p>
              {this.getChannelData(
                _.get(replication, 'details.data.site.sales', {})
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }
}

Replication.propTypes = {
  t: PropTypes.func.isRequired,
  fetchDetails: PropTypes.func.isRequired,
  runAction: PropTypes.func.isRequired,
  resendOrders: PropTypes.func.isRequired,
  replication: PropTypes.shape({
    action_results: PropTypes.shape({
      data: PropTypes.any,
      pending: PropTypes.bool.isRequired,
      error: PropTypes.any,
    }),
    details: PropTypes.shape({
      pending: PropTypes.bool.isRequired,
      data: PropTypes.any,
    }),
    resend_orders: PropTypes.shape({
      data: PropTypes.any,
      pending: PropTypes.bool.isRequired,
      error: PropTypes.any,
    }),
  }),

  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
};
Replication.defaultProps = {};

/**
 * Mapping redux store configurations as this.props.configurations
 * @param {} state
 */
function mapStateToProps(state) {
  return {
    replication: state.replication,
  };
}

/**
 * Connection actions here
 * @param {} dispatch
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchDetails: replicationActions.fetchReplicationDetails,
      runAction: replicationActions.runReplicationAction,
      resendOrders: replicationActions.resendOrders,
    },
    dispatch
  );
}

/**
 * Wrapped with translations and connect to store.
 */
export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Replication)
);
