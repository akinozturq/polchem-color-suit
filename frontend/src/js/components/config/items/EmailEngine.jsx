import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  CustomInput,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label,
  Row,
} from 'reactstrap';
import { customControlStyles, CustomScrollbars, rightToLeft } from 'js/mylib/Utils';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import _ from 'lodash';
import SimpleModal from 'js/components/shared/SimpleModal';
import { bindActionCreators } from 'redux';
import configActions from 'js/redux/reducers/Configuration';
import Select from 'react-select';

class EmailEngine extends Component {
  constructor(props) {
    super(props);
    this.state = {
      original: null,
      showRecieverModal: false,
    };
  }

  accessDenied = (privilege) => {
    const { privileges } = this.props;
    return !_.includes(privileges, privilege);
  };

  updateItem = (item, value, idx) => {
    this.props.updateItem(item, value, idx);
  };

  _getConfig = (config) => {
    const { email_templates } = this.props;
    const templates = email_templates.map((x) => ({
      label: x.zoneid ? x.name + ' \uD83C\uDF10' : x.name,
      value: x.name,
    }));

    return config
      .filter((item) => !item.ishidden)
      .map((item, idx) => {
        if (item.code === 'email_config.order_done_template') {
           
          return (
            <div key={idx}>
              <FormGroup row>
                <Label sm={4}>{item.name}</Label>

                {this.props.unsetColumn(item)}
                <Col sm={7}>
                  <Select
                    id="label_select"
                    menuPlacement="auto"
                    styles={{
                      control: customControlStyles,
                      option: (base) => ({ ...base, color: 'black' }),
                    }}
                    isSearchable={false}
                    onChange={(value) =>
                      this.updateItem(item, value.value, idx)
                    }
                    options={templates || []}
                    value={{
                      label: item.value,
                      value: item.value,
                    }}
                    defaultValue={{
                      label: item.value,
                      value: item.value,
                    }}
                  />
                </Col>
              </FormGroup>
            </div>
          );
        }

        if (item.type === 'checkbox') {
          return (
             
            <div key={idx}>
              <FormGroup row>
                <Label xs={4}>{item.name}</Label>
                {this.props.unsetColumn(item)}
                <Col sm={7} style={{ paddingTop: '0.5rem' }}>
                  <CustomInput
                    type="checkbox"
                    checked={item.value}
                    disabled={item.islocked || this.accessDenied(item.code)}
                    id={item.code}
                    onChange={(event) =>
                      this.updateItem(item, event.target.checked, idx)
                    }
                  />
                </Col>
              </FormGroup>
            </div>
          );
        } else if (item.type === 'number') {
          return (
            <div key={idx}>
              <FormGroup row>
                <Label xs={4}>{item.name}</Label>
                {this.props.unsetColumn(item)}
                <Col sm={7}>
                  <InputGroup>
                    <Input
                      type="number"
                      min={item.min}
                      max={item.max}
                      defaultValue={item.value}
                      disabled={item.islocked || this.accessDenied(item.code)}
                      onBlur={(event) =>
                        this.updateItem(item, event.target.value, idx)
                      }
                    />
                    {item.suffix && (
                      <InputGroupAddon addonType="append">
                        <InputGroupText>{item.suffix}</InputGroupText>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Col>
              </FormGroup>
            </div>
          );
        } else {
          return (
            <div key={idx}>
              <FormGroup row>
                <Label xs={4}>{item.name}</Label>
                {this.props.unsetColumn(item)}
                <Col sm={7}>
                  <Input
                    type={item.type}
                    defaultValue={item.value}
                    disabled={item.islocked || this.accessDenied(item.code)}
                    onBlur={(event) =>
                      this.updateItem(item, event.target.value, idx)
                    }
                  />
                </Col>
              </FormGroup>
            </div>
          );
        }
      });
  };

  sendTestEmail = (address) => {
    this.props.sendTestEmail({ recievers: address });
  };

  render() {
    const { t, status, node, send_test_email } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          <Row>
            <Col>{t('cfg.h_email_engine', 'Email engine')}</Col>
          </Row>
        </CardHeader>

        <CustomScrollbars>
          <CardBody className="m-8 config-card-body" dir={direction}>
            {status && status.cloud ? (
              <div className="m-16" style={{ textAlign: 'center' }}>
                {t(
                  'msg.emailSettingsManagedByCloud',
                  'Email server settings are managed by cloud server'
                )}
              </div>
            ) : (
              this._getConfig(
                node.config.filter((x) =>
                  x.code.startsWith('email_config.smtp_server_')
                )
              )
            )}

            {this._getConfig(
              node.config.filter(
                (x) => !x.code.startsWith('email_config.smtp_server_')
              )
            )}

            <Alert color="info" isOpen={send_test_email.pending}>
              {t(
                'msg.sendingTestMail.ellipsis',
                'Sending test mail please wait...'
              )}
            </Alert>
            <Alert color="danger" isOpen={send_test_email.error !== null}>
              {t(
                'msg.errorWhileSendingTestEmail',
                'Error while sending test email'
              )}
              <div style={{ color: '#212529' }}>
                {send_test_email.error &&
                  send_test_email.error.response.data.msg}
              </div>
            </Alert>
            <Alert color="success" isOpen={send_test_email.data !== null}>
              {t('msg.testEmailSentSuccess', 'Test email sent successfully')}
            </Alert>

            <Button
              onClick={() =>
                this.setState((state) => ({
                  showRecieverModal: !state.showRecieverModal,
                }))
              }
              color="success"
            >
              {t('cfg.email_config.send_test_email')}
            </Button>

            <SimpleModal
              header={t('lbl.receiverEmailAddress', 'Receiver email address')}
              edited={this.sendTestEmail}
              prompt={t('lbl.emailAddress', 'Email address')}
              save={t('fn.send', 'Send')}
              cancel={t('fn.cancel', 'Cancel')}
              show={this.state.showRecieverModal}
              hideModal={() =>
                this.setState((state) => ({
                  showRecieverModal: !state.showRecieverModal,
                }))
              }
            />
          </CardBody>
        </CustomScrollbars>
      </Card>
    );
  }
}
EmailEngine.propTypes = {
  t: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  unsetColumn: PropTypes.func.isRequired,
  sendTestEmail: PropTypes.func.isRequired,
  send_test_email: PropTypes.shape({
    pending: PropTypes.bool,
    error: PropTypes.object,
    data: PropTypes.any,
  }),

  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  node: PropTypes.shape({ config: PropTypes.array }),
  status: PropTypes.shape({
    cloud: PropTypes.bool,
  }),
  email_templates: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string })
  ),
};
function mapStateToProps(store) {
  return {
    status: store.protection.status,
    send_test_email: store.configurations.send_test_email,
    email_templates: store.configurations.email_templates,
  };
}

/**
 * Connection actions here
 * @param {} dispatch
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      sendTestEmail: configActions.sendTestEmail,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(EmailEngine)
);
