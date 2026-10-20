import React from 'react';
import PropTypes from 'prop-types';
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
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import offlineActions, {
  propType as offlinePropType,
} from 'js/redux/reducers/Offline';
import _ from 'lodash';
import Spinner from '../../shared/Spinner';
import { dateTimeToLocaleString } from '../../../mylib/DateUtils';
import { rightToLeft } from '../../../mylib/Utils';
import { confirmAlert } from '../../../ext/react-confirm-alert';
import { offline_mode } from '../../../Constants';

class Offline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showUrlModal: false,
      newServerUrl: '',
    };
  }

  getRow = (label, value, type) => {
    const { t } = this.props;
    let child;
    if (type === 'datetime') {
      child = dateTimeToLocaleString(value);
    } else if (type === 'boolean') {
      child = <Input value={value ? t('fn.yes') : t('fn.no')} readOnly />;
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

  confirmRemove = () => {
    const { t, removeOfflineFilesAndSettings } = this.props;
    confirmAlert({
      title: t(
        'msg.confirmOfflineFilesAndSettingsRemove.title',
        'Remove offline files and settings'
      ),
      message: t(
        'msg.confirmOfflineFilesAndSettingsRemove',
        'You are about to remove all offline files and settings. Offline mode will be disabled?'
      ),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => {
            removeOfflineFilesAndSettings();
          },
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  accessDenied = (privilege) => {
    const { privileges } = this.props;
    return !_.includes(privileges, privilege);
  };

  toggleUrlModal = () => {
    this.setState((state) => ({
      showUrlModal: !state.showUrlModal,
    }));
  };

  setNewServerUrl = () => {
    if (window.qtside) {
      window.qtside.bridge.setNewUrl(this.state.newServerUrl);
    }
  };

  render() {
    const { t, offline, site } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';

    const action_pending = offline.force_check_running;

    return (
      <>
        <Card
          style={{ height: 'calc((100vh - 102px) - 6rem)' }}
          className="config-card"
          dir={direction}
        >
          <CardHeader className="config-card-header" dir={direction}>
            {t('lbl.offlineMode', 'Offline mode details')}
          </CardHeader>
          <CardBody className="scroll config-card-body" dir={direction}>
            {!site.offline_allowed && (
              <div
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  padding: '1rem',
                  fontSize: '1.5rem',
                }}
              >
                {t('msg.offlineModeDisabled', 'Offline mode disabled')}
              </div>
            )}
            <div>
              <FormGroup row>
                <Label sm={5}>
                  {t('cfg.cloud_address', 'Cloud server address')}
                </Label>
                <Col sm={7}>
                  <div className="d-inline-flex w-100">
                    <Input
                      value={_.get(offline, 'cloud_address') || ''}
                      readOnly
                    />
                    <Button
                      color={'primary'}
                      outline={true}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: '1rem',
                        marginLeft: '5px',
                        width: '50px',
                        height: '30px',
                        padding: 0,
                        lineHeight: '0.75rem',
                      }}
                      onClick={this.toggleUrlModal}
                    >
                      {t('lbl.dots', '...')}
                    </Button>
                  </div>
                </Col>
              </FormGroup>
            </div>
            {this.getRow(
              t('cfg.fall_backend_running', 'Fall backend running'),
              _.get(offline, 'fall_backend_running'),
              'boolean'
            )}
            {this.getRow(
              t('cfg.is_offline_mode_available', 'Offline mode available'),
              _.get(offline, 'is_offline_mode_available'),
              'boolean'
            )}
            {this.getRow(
              t('cfg.is_online_mode_available', 'Online mode available'),
              _.get(offline, 'is_online_mode_available'),
              'boolean'
            )}
            {this.getRow(
              t('cfg.offline_mode', 'In offline mode'),
              offline_mode,
              'boolean'
            )}
            {this.getRow(
              t('cfg.orders_synced', 'Order synced'),
              _.get(offline, 'orders_synced'),
              'boolean'
            )}
            {this.getRow(
              t('cfg.formulas_db_file_path', 'SQLite formulas database file'),
              _.get(offline, 'offline_info.formulas_db_file')
            )}
            {this.getRow(
              t(
                'cfg.formulas_data_creation_time',
                'Formulas data creation time'
              ),
              _.get(offline, 'offline_info.formulas_creation_time'),
              'datetime'
            )}
            {this.getRow(
              t('cfg.site_db_file', 'SQLite site database file'),
              _.get(offline, 'offline_info.site_db_file')
            )}
            {this.getRow(
              t('cfg.site_data_creation_time', 'Site data creation time'),
              _.get(offline, 'offline_info.site_creation_time'),
              'datetime'
            )}
            <Row>
              <Col xs={12}>
                <Button
                  color="success"
                  onClick={this.props.checkOfflineFiles}
                  disabled={action_pending}
                >
                  {t('fn.checkOfflineFiles', 'Force check offline files')}
                  {action_pending && <Spinner />}
                </Button>
              </Col>
            </Row>
            <Row className="mt-8">
              <Col xs={12}>
                <Button
                  color="warning"
                  onClick={this.confirmRemove}
                  disabled={
                    action_pending || !offline.is_offline_mode_available
                  }
                >
                  {t(
                    'fn.removeOfflineFilesAndSettings',
                    'Remove offline files and settings'
                  )}
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>
        <Modal
          centered
          isOpen={this.state.showUrlModal}
          toggle={this.toggleUrlModal}
        >
          <ModalHeader toggle={this.toggleUrlModal}>
            {t('lbl.changeServerUrl', 'Change server URL')}
          </ModalHeader>
          <ModalBody>
            <Input
              className="input-normal br-8 mb-2"
              value={this.state.newServerUrl}
              onChange={(e) => this.setState({ newServerUrl: e.target.value })}
              placeholder={t('lbl.newServerURL', 'New server URL')}
              onKeyUp={(e) => {
                if (e.key === 'Enter') this.setNewServerUrl();
              }}
            />
            <Alert color={'warning'}>
              {t(
                'lbl.server_url_info',
                'Changing server URL will cause application to reload and possibly log out! Incorrect URL setting will cause application to be unusable.'
              )}
            </Alert>
          </ModalBody>
          <ModalFooter style={{ flexWrap: 'nowrap' }}>
            <Row className="width100">
              <Col className="pr-2">
                <Button color="secondary" onClick={this.toggleUrlModal}>
                  {t('fn.cancel', 'Cancel')}
                </Button>
              </Col>

              <Col className="pl-2">
                <Button color="danger" onClick={this.setNewServerUrl}>
                  {t('fn.changeServerUrl', 'Change server URL')}
                </Button>
              </Col>
            </Row>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

Offline.propTypes = {
  t: PropTypes.func.isRequired,
  checkOfflineFiles: PropTypes.func.isRequired,
  removeOfflineFilesAndSettings: PropTypes.func.isRequired,
  offline: offlinePropType,
  site: PropTypes.shape({ offline_allowed: PropTypes.bool }).isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
};
Offline.defaultProps = {};

/**
 * Mapping redux store configurations as this.props.configurations
 */
function mapStateToProps(state) {
  return {
    offline: state.offline,
    site: state.configurations.site,
  };
}

/**
 * Connection actions here
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      checkOfflineFiles: offlineActions.checkOfflineFiles,
      removeOfflineFilesAndSettings:
        offlineActions.removeOfflineFilesAndSettings,
    },
    dispatch
  );
}

/**
 * Wrapped with translations and connect to store.
 */
export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Offline)
);
