import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  DB_NAME,
  STATE_DOWNLOADING_UPDATE,
  STATE_READY_TO_UPDATE,
  STATE_UPDATES_AVAILABLE,
} from '../../Constants';
import _ from 'lodash';
import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NavItem,
  Progress,
  UncontrolledTooltip,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bindActionCreators } from 'redux';
import updateActions from '../../redux/reducers/UpdateChecker';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { hasPrivilege } from '../../mylib/Privileges';

class UpdateButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      changelog_open: false,
    };
  }

  changelog_modal = () => {
    const { t, update } = this.props;
    return (
      <Modal isOpen={this.state.changelog_open}>
        <ModalHeader toggle={() => this.setState({ changelog_open: false })}>
          {t('lbl.changelog', 'Change log')}
        </ModalHeader>
        <ModalBody className="scroll" style={{ maxHeight: '60vh' }}>
          <pre>{update?.swupdate_state?.notes}</pre>
        </ModalBody>
        <ModalFooter>
          <Button onClick={this.props.approveDownload}>
            {t('fn.startDownload', 'Start downloading')}
          </Button>
        </ModalFooter>
      </Modal>
    );
  };

  update = () => {
    // Needed to use timestamp to bypass browser cache so that page actually changes!
    const { version_details } = this.props.update;
    const base = window.location.origin;
    window.location.href =
      DB_NAME === null
        ? `${base}${version_details.front_version_url}?timestamp=${Date.now()}`
        : `${base}/db/${DB_NAME}/pos/v${version_details.front_version}/`;
  };

  render() {
    const { t, update, config_values } = this.props;

    if (config_values.automatic_updates_silent_installation) {
      return null; // No need to show anything
    }

    const update_disabled = !hasPrivilege('check_software_updates');

    let progress = 0;
    let show_prog = false;
    let check_modal = false;
    let show_btn = update.has_update;
    let onclick = this.update;
    let tool =
      t('prompt.clickToUpdateSoftware', 'Click to update software to version') +
      ' ' +
      (update?.version_details?.pos?.join('.') || '');
    let badge = t('badge.new_versionAvailable', 'New');
    let icon = 'bullhorn';

    if (update.swupdate_state?.state === STATE_READY_TO_UPDATE) {
      show_btn = true;
      icon = 'desktop';
      onclick = this.props.startUpdate;
      badge = t('badge.install_update', 'Install');
      tool = t(
        'prompt.install_update',
        'Click to start installation process. The application will be closed during installation!'
      );
    } else if (update.swupdate_state?.state === STATE_UPDATES_AVAILABLE) {
      show_btn = true;
      check_modal = true;
      icon = 'download';
      onclick = update.swupdate_state.notes
        ? () => this.setState({ changelog_open: true })
        : this.props.approveDownload;
      badge = t('badge.download_update', 'Download');
      tool = t(
        'prompt.download_update',
        'Software update is ready for downloading. Application can be used normally while downloading. Click to start downloading process.'
      );
      if (
        update.swupdate_state?.tasks?.length > 0 &&
        update.swupdate_state.tasks[0].version
      ) {
        tool += ` Version: ${update.swupdate_state.tasks[0].version}`;
      } else if (update.version_details?.pos) {
        tool += ` Version: ${(update.version_details?.pos || []).join('.')}`;
      }
    } else if (update.swupdate_state?.state === STATE_DOWNLOADING_UPDATE) {
      show_btn = false;
      show_prog = true;
      let maxpr = update.swupdate_state.tasks.length * 100 + 1;
      progress =
        (_.sumBy(update.swupdate_state.tasks, 'progress') * 100) / maxpr;
      tool = t('msg.downloading');
    }

    // Download progress
    if (show_btn) {
      return (
        <NavItem key="update">
          {check_modal && this.changelog_modal()}
          <Button
            data-cy={'update'}
            id="updateButton"
            onClick={onclick}
            className="btn-config"
            disabled={update_disabled}
            data-denied={update_disabled}
          >
            <FontAwesomeIcon icon={icon} />
            <Badge color="primary" className="new-badge">
              {badge}
            </Badge>
          </Button>
          <UncontrolledTooltip placement="bottom" target="updateButton">
            {tool}
          </UncontrolledTooltip>
        </NavItem>
      );
    }
    if (show_prog) {
      return (
        <div style={{ position: 'absolute', right: '9rem' }}>
          <div id="updateDownloadProgress" style={{ width: '15rem' }}>
            <Progress animated color="success" value={progress} />
          </div>

          <UncontrolledTooltip
            placement="bottom"
            target="updateDownloadProgress"
          >
            {tool}
          </UncontrolledTooltip>
        </div>
      );
    }

    return null;
  }
}

UpdateButton.propTypes = {
  update: PropTypes.shape({
    has_update: PropTypes.bool.isRequired,
    version_details: PropTypes.shape({
      pos: PropTypes.arrayOf(PropTypes.number),
      front_version: PropTypes.number,
      front_version_url: PropTypes.string,
    }),
    swupdate_state: PropTypes.shape({
      state: PropTypes.string,
      notes: PropTypes.string,
      tasks: PropTypes.array,
    }),
  }),
  t: PropTypes.func.isRequired,
  approveDownload: PropTypes.func.isRequired,
  startUpdate: PropTypes.func.isRequired,
  config_values: PropTypes.object,
};
function mapStateToProps(store) {
  return {
    user: store.user,
    update: store.update_checker,
    config_values: store.configurations.config_values,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      approveDownload: updateActions.approveDownload,
      startUpdate: updateActions.startUpdate,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(UpdateButton)
);
