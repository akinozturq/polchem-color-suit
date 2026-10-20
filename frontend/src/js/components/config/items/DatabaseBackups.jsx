import React from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Card,
  CardBody,
  Button,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  CustomInput,
  CardHeader,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import backupActions from 'js/redux/reducers/Backup';

import JSONPretty from 'react-json-pretty';
import { CustomScrollbars, rightToLeft } from 'js/mylib/Utils';

import Spinner from '../../shared/Spinner';
import Select from 'react-select';

import { dateTimeToLocaleString } from '../../../mylib/DateUtils';

const customControlStyles = (base) => ({
  ...base,
  height: 20,
});

function MyGrp({
  name,
  id,
  value,
  readOnly = false,
  onChange,
  onBlur,
  type = 'text',
  maxlength = 200,
}) {
  return (
    <FormGroup row>
      <Label for={id} sm={5}>
        {name}
      </Label>
      <Col sm={7}>
        {type === 'checkbox' ? (
          <CustomInput
            style={{ height: '2rem', margin: 0 }}
            type={type}
            id={id}
            name={id}
            value={value !== null && value !== undefined ? value : ''}
            checked={value}
            onChange={onChange}
            disabled={readOnly}
            maxLength={maxlength}
          />
        ) : (
          <Input
            style={{ height: '2rem', margin: 0 }}
            type={type}
            id={id}
            name={id}
            value={value !== null && value !== undefined ? value : ''}
            checked={value}
            onChange={onChange}
            onBlur={onBlur}
            readOnly={readOnly}
            maxLength={maxlength}
          />
        )}
      </Col>
    </FormGroup>
  );
}

MyGrp.propTypes = {
  name: PropTypes.string,
  id: PropTypes.string,
  value: PropTypes.any,
  readOnly: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  type: PropTypes.string,
  maxlength: PropTypes.number,
};

const propTypes = {
  pos_app_permissions: PropTypes.shape({
    permissions: PropTypes.shape({
      data: PropTypes.shape({ is_admin: PropTypes.bool }),
    }),
  }),
  t: PropTypes.func.isRequired,
  loadBackupSettings: PropTypes.func.isRequired,
  backupNow: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
  saveBackupSettings: PropTypes.func.isRequired,
  backup: PropTypes.shape({
    backup_settings: PropTypes.shape({
      data: PropTypes.object,
    }),
    backup_settings_save: PropTypes.shape({
      pending: PropTypes.bool.isRequired,
      error: PropTypes.object,
      data: PropTypes.object,
    }),
  }),
};

const defaultProps = {};

class DatabaseBackups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        enabled: false,
        use_time_machine: false,
        run_on_next_possible: true,
        override_previous: false,
        schedule_at: '00:00',
      },
      original: null,
      edited: false,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const settings = props.backup.backup_settings.data;
    if (settings && settings !== state.original) {
      return {
        settings,
        original: settings,
      };
    }
    return null;
  }

  componentDidMount() {
    this.props.loadBackupSettings();
  }

  onChange = (e) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState((state) => ({
      settings: {
        ...state.settings,
        [name]: value,
      },
      edited: true,
    }));
  };

  backupScheduleChanged = (e) => {
    const target = e.target;
    this.setState((state) => ({
      settings: { ...state.settings, schedule: target.id },
      edited: true,
    }));
  };

  formatTime(t) {
    if (t === null) {
      return '00:00';
    }
    try {
      return t
        .split(':')
        .map((x) => {
          let c = parseInt(x);
          if (c < 10) return '0' + c;
          else return c;
        })
        .join(':');
    } catch (error) {
      return '00:00';
    }
  }

  backupScheduleSettings = () => {
    const { t } = this.props;
    const ISO_WEEKDAYS = {
      1: t('lbl.weekday.1', 'Monday'),
      2: t('lbl.weekday.2', 'Tuesday'),
      3: t('lbl.weekday.3', 'Wednesday'),
      4: t('lbl.weekday.4', 'Thursday'),
      5: t('lbl.weekday.5', 'Friday'),
      6: t('lbl.weekday.6', 'Saturday'),
      7: t('lbl.weekday.7', 'Sunday'),
    };

    // H = hourly, D = Daily, W = weekly, M = Monthly
    // schedule_at
    const schedule = [
      { label: t('lbl.daily', 'Daily'), value: 'D' },
      { label: t('lbl.weekly', 'Weekly on'), value: 'W' },
    ];

    const weekdays = Object.keys(ISO_WEEKDAYS).map((x) => ({
      label: ISO_WEEKDAYS[x],
      value: x - 1,
    }));
    let dvalue = weekdays.find((x) => x.value === this.state?.settings?.day);

    return (
      <FormGroup row className="mt-3 mb-3">
        <Label xs={3} style={{ margin: 'auto' }}>
          {t('lbl.backupInterval', 'Backup interval')}
        </Label>
        <Col xs={9} className="p-0">
          {schedule.map((r) => (
            <Row className="mt-8" key={r.value}>
              <Col xs={3}>
                <Input
                  type="radio"
                  id={r.value}
                  name="backup_interval"
                  checked={this.state.settings.schedule === r.value}
                  onChange={this.backupScheduleChanged}
                  disabled={this.props.accessDenied('database_autobackups')}
                />
                <Label for={r.value} check>
                  {r.label}
                </Label>
              </Col>
              <Col style={{ display: 'inline-flex' }}>
                {r.value === 'W' && (
                  <>
                    <Select
                      className="width100"
                      menuPlacement="auto"
                      styles={{
                        control: customControlStyles,
                        option: (base) => ({ ...base, color: 'black' }),
                      }}
                      isSearchable={false}
                      onChange={(value) =>
                        this.setState((state) => ({
                          settings: {
                            ...state.settings,
                            day: value.value,
                          },
                          edited: true,
                        }))
                      }
                      options={weekdays}
                      value={dvalue}
                      isDisabled={this.props.accessDenied(
                        'database_autobackups'
                      )}
                    />
                  </>
                )}
              </Col>

              <Col xs={4}>
                <Input
                  type="time"
                  name={'schedule_at'}
                  value={this.formatTime(this.state.settings.schedule_at)}
                  onChange={this.onChange}
                  disabled={this.props.accessDenied('database_autobackups')}
                />
              </Col>
            </Row>
          ))}
        </Col>
      </FormGroup>
    );
  };

  backupFolderChanged = () => {
    // Validate backup folder
    this.setState((state) => ({
      settings: {
        ...state.settings,
        backup_path: state.settings.backup_path.trim(),
      },
      edited: true,
    }));
  };

  render() {
    const { t, backup, pos_app_permissions } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    const sets = this.state.settings;

    let file = backup.backup_settings.data?.last_state?.FILE || '';
    const block_ui = backup.backup_settings_save.pending;
    const is_admin = pos_app_permissions?.permissions.data?.is_admin === true;

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          {t('lbl.databaseBackupSettings', 'Database backup settings')}
        </CardHeader>
        <CardBody className="scroll config-card-body" dir={direction}>
          <MyGrp
            id={'enabled'}
            name={t('fn.enableBackup', 'Enable backup')}
            type={'checkbox'}
            value={sets.enabled}
            onChange={this.onChange}
            readOnly={this.props.accessDenied('database_autobackups')}
          />
          <MyGrp
            id={'backup_path'}
            name={t('cfg.database_backup_folder', 'Backup directory')}
            value={sets.backup_path}
            onChange={this.onChange}
            onBlur={this.backupFolderChanged}
            readOnly={this.props.accessDenied('database_backup_folder')}
          />

          {this.backupScheduleSettings()}
          <MyGrp
            id={'lastrun'}
            name={t('lbl.lastRun', 'Last run')}
            readOnly={true}
            value={
              sets?.lastrun
                ? dateTimeToLocaleString(sets.lastrun) + ' - ' + file
                : ''
            }
          />

          <Row>
            <Col xs={5} />
            <Col>
              <Alert
                color="danger"
                isOpen={backup.backup_settings_save.error !== null}
              >
                {t(
                  'msg.backupSettingSavingError',
                  'Error while saving backup settings'
                )}
                <CustomScrollbars
                  style={{ height: '100px', background: '#272822' }}
                >
                  {backup.backup_settings_save.error && (
                    <JSONPretty
                      id="json-pretty"
                      data={backup.backup_settings_save.error.response}
                    />
                  )}
                </CustomScrollbars>
              </Alert>
              <Alert
                color="success"
                isOpen={backup.backup_settings_save.data !== null}
              >
                {backup.backup_settings_save.data &&
                  backup.backup_settings_save.data.msg}
              </Alert>
            </Col>
          </Row>
          <Row className="m-8">
            <Col>
              <Button
                color="primary"
                data-cy="backup_now"
                disabled={
                  !sets.backup_path ||
                  this.props.accessDenied('database_backup_run')
                }
                className="w-100"
                onClick={() => this.props.backupNow(sets)}
              >
                {block_ui && <Spinner />}
                {t('fn.backupNow', 'Backup now')}
              </Button>
            </Col>
            <Col xs={2} />
            <Col>
              <Button
                color="primary"
                data-cy="apply_settings"
                disabled={
                  !this.state.edited ||
                  block_ui ||
                  !is_admin ||
                  this.props.accessDenied('database_autobackups')
                }
                className="w-100"
                onClick={() =>
                  this.props.saveBackupSettings({
                    settings: {
                      ...this.state.settings,
                      schedule_at: this.state.settings.schedule_at || '00:00',
                    },
                  })
                }
              >
                {block_ui && <Spinner />}
                {t('fn.save', 'Save')}
              </Button>
              {!is_admin && (
                <div className="text-center" style={{ color: 'red' }}>
                  {t('msg.confirmRunAsAdmin.title')}
                </div>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  }
}

DatabaseBackups.propTypes = propTypes;
DatabaseBackups.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    backup: store.backup,
    pos_app_permissions: store.pos_app_permissions,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      loadBackupSettings: backupActions.loadBackupSettings,
      saveBackupSettings: backupActions.saveBackupSettings,
      backupNow: backupActions.backupNow,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(DatabaseBackups)
);
