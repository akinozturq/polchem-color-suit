import React, { Component } from 'react';
import {
  Alert,
  Button,
  Col,
  CustomInput,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';

import replicationActions from 'js/redux/reducers/Replication';
import {
  REP_STATE_FULLSYNC_AT,
  REP_STATE_FULLSYNC_AT_NEXT_NIGHT,
  REP_STATE_FULLSYNC_AT_PROGRESS,
  REP_STATE_FULLSYNC_NOW,
} from '../../Constants';
import { pad } from '../../mylib/Utils';
import { datetimeToLocalIso, time_to_hour_minute } from '../../mylib/DateUtils';
import { hasPrivilege } from '../../mylib/Privileges';

class ReplicationModal extends Component {
  constructor(props) {
    super(props);
    // Default to next full hour

    this.state = {
      sync: null,
      full_sync_started: false,
      sync_set: false,
      synctime: '00:00',
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.replication.details.data) {
      if (
        !state.full_sync_started &&
        [REP_STATE_FULLSYNC_AT_PROGRESS, REP_STATE_FULLSYNC_NOW].includes(
          _.get(props.replication, 'details.data.site.formulas.site.state')
        )
      ) {
        return { full_sync_started: true };
      }

      if (state.sync === null) {
        let st = _.get(
          props.replication,
          'details.data.site.formulas.site.state'
        );

        const tmp = _.get(
          props.replication,
          'details.data.site.formulas.site.fullsynctime'
        );

        let time = null;
        if (tmp === null) {
          st = REP_STATE_FULLSYNC_AT_NEXT_NIGHT;
          time = new Date();
          time.setTime(time.getTime() + 60 * 60 * 1000);
        } else {
          time = new Date(tmp);
        }

        return {
          sync: st,
          synctime: pad(time.getHours(), 2) + ':' + pad(time.getMinutes(), 2),
        };
      }
    }

    return null;
  }

  setSyncSchedule = () => {
    if (this.state.sync === REP_STATE_FULLSYNC_AT_NEXT_NIGHT) {
      // Full sync on next night
      this.props.setSchedule(REP_STATE_FULLSYNC_AT, null);
      this.setState({ sync_set: true });
    } else if (this.state.sync === REP_STATE_FULLSYNC_AT) {
      // Parse date from
      let date = new Date();
      const { h, m } = time_to_hour_minute(this.state.synctime);
      if (
        date.getHours() < h ||
        (date.getHours() === h && m > date.getMinutes() + 2)
      ) {
        const hour_diff = (h - date.getHours()) * 60 * 60 * 1000;
        const minute_diff = (m - date.getMinutes()) * 60 * 1000;
        date.setTime(date.getTime() + (hour_diff + minute_diff));
      } else {
        // Move to next day
        const hour_diff = (date.getHours() - h) * 60 * 60 * 1000;
        const minute_diff = (date.getMinutes() - m) * 60 * 1000;
        date.setTime(
          date.getTime() + 24 * 60 * 60 * 1000 - (hour_diff + minute_diff)
        );
      }
      this.props.setSchedule(REP_STATE_FULLSYNC_AT, datetimeToLocalIso(date));
      this.setState({ sync_set: true });
    } else if (this.state.sync === REP_STATE_FULLSYNC_NOW) {
      // Start full sync now!
      this.props.setSchedule(REP_STATE_FULLSYNC_NOW, null);
      this.setState({ sync_set: true, full_sync_started: true });
    }
  };

  getChooseFullSyncTime = () => {
    const { t, replication } = this.props;
    return (
      <>
        <ModalBody>
          <Row>
            <Col xs={12}>
              <CustomInput
                type="radio"
                id="full_sync_now"
                label={t('fn.runFullSyncNow', 'Run full synchronization now')}
                checked={this.state.sync === REP_STATE_FULLSYNC_NOW}
                onChange={() => {
                  this.setState({
                    sync: REP_STATE_FULLSYNC_NOW,
                    sync_set: false,
                  });
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <CustomInput
                type="radio"
                id="full_sync_next_night"
                label={t(
                  'lbl.runFullSyncNextNight',
                  'Run full synchronization during next night (23:00 - 05:00)'
                )}
                checked={this.state.sync === REP_STATE_FULLSYNC_AT_NEXT_NIGHT}
                onChange={() => {
                  this.setState({
                    sync: REP_STATE_FULLSYNC_AT_NEXT_NIGHT,
                    sync_set: false,
                  });
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col xs={8}>
              <CustomInput
                type="radio"
                id="full_sync_custom"
                label={t(
                  'lbl.runDuringNext24HoursAt.colon',
                  'Run during next 24 hours at:'
                )}
                checked={this.state.sync === REP_STATE_FULLSYNC_AT}
                onChange={() => {
                  this.setState({
                    sync: REP_STATE_FULLSYNC_AT,
                    sync_set: false,
                  });
                }}
              />
            </Col>
            <Col xs={4}>
              <Input
                type="time"
                value={this.state.synctime}
                onChange={(e) => {
                  this.setState({ synctime: e.target.value, sync_set: false });
                }}
              />
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Alert
            className="w-100"
            color="success"
            isOpen={replication.schedule_set.data}
          >
            {_.get(replication, 'schedule_set.data.msg', '')}
          </Alert>
          <Alert
            className="w-100"
            color="danger"
            isOpen={replication.schedule_set.error}
          >
            {JSON.stringify(_.get(replication, 'schedule_set.error', ''))}
          </Alert>
          {this.state.sync_set ? (
            <Row className="w-100">
              <Col />
              <Col />
              <Col>
                {' '}
                <Button color="success" onClick={this.props.toggleModal}>
                  {t('fn.ok', 'OK')}
                </Button>
              </Col>
            </Row>
          ) : (
            <Row className="w-100">
              <Col>
                <Button
                  color="warning"
                  disabled={replication.schedule_set.pending}
                  onClick={this.props.toggleModal}
                >
                  {t('fn.cancel', 'Cancel')}
                </Button>
              </Col>
              <Col />
              <Col>
                <Button
                  color="primary"
                  disabled={
                    replication.schedule_set.pending ||
                    !hasPrivilege('schedule_full_sync_replication')
                  }
                  data-denied={!hasPrivilege('schedule_full_sync_replication')}
                  onClick={this.setSyncSchedule}
                >
                  {t('fn.ok', 'OK')}
                </Button>
              </Col>
            </Row>
          )}
        </ModalFooter>
      </>
    );
  };

  getFullSyncProgess = () => {
    const { t } = this.props;
    return (
      <>
        <ModalBody>
          <Row>
            <Col>
              <p>
                {t(
                  'msg.applyingFullSyncPleaseWait',
                  'Applying full synchronization of the database. Please wait.'
                )}
              </p>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter />
      </>
    );
  };

  getSyncDone = () => {
    const { t } = this.props;
    return (
      <>
        <ModalBody>
          <p>
            {t(
              'msg.fullSyncFinishedReloadingNeeded',
              'Full database synchronization finished. Reloading of the application is required to refresh all data.'
            )}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={() => window.location.reload()}>
            {t('fn.reload', 'Reload')}
          </Button>
        </ModalFooter>
      </>
    );
  };

  render() {
    const { t, replication } = this.props;
    // list available templates here
    // Layout forced by print task
    const full_sync_in_progress = [
      REP_STATE_FULLSYNC_AT_PROGRESS,
      REP_STATE_FULLSYNC_NOW,
    ].includes(_.get(replication, 'details.data.site.formulas.site.state'));

    const isOpen =
      replication.modal.open ||
      full_sync_in_progress ||
      this.state.full_sync_started;

    return (
      <Modal
        isOpen={isOpen}
        toggle={this.props.toggleModal}
        centered
        fade={false}
        size="lg"
      >
        <ModalHeader toggle={this.toggle}>
          {full_sync_in_progress
            ? t('msg.fullSyncInProgress', 'Full sync in progress')
            : t('lbl.scheduleFullSync', 'Schedule full synchronization')}
        </ModalHeader>
        {!full_sync_in_progress &&
          !this.state.full_sync_started &&
          this.getChooseFullSyncTime()}
        {full_sync_in_progress && this.getFullSyncProgess()}
        {this.state.full_sync_started &&
          !full_sync_in_progress &&
          this.getSyncDone()}
      </Modal>
    );
  }
}

ReplicationModal.propTypes = {
  t: PropTypes.func.isRequired,
  replication: PropTypes.shape({
    modal: PropTypes.shape({ open: PropTypes.bool.isRequired }),
    details: PropTypes.shape({ data: PropTypes.object }),
    schedule_set: PropTypes.shape({
      data: PropTypes.object,
      error: PropTypes.object,
      pending: PropTypes.bool,
    }),
  }),
  toggleModal: PropTypes.func.isRequired,
  setSchedule: PropTypes.func,
};
ReplicationModal.defaultProps = {};

function mapStateToProps(store) {
  return {
    replication: store.replication,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      toggleModal: replicationActions.toggleModal,
      setSchedule: replicationActions.setFullSyncSchedule,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ReplicationModal)
);
