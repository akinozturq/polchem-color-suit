import React, { Component } from 'react';
import {
  Alert,
  Button,
  Col,
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
import Select from 'react-select';
import { customControlStyles, omitNil } from 'js/mylib/Utils';
import ErrorBoundary from './ErrorBoundaryModal';
import EPValues from 'js/redux/selectors/EPValues';
import { MailTemplateToHtml } from 'easy-mail';
import emailActions from 'js/redux/reducers/Email';
import _ from 'lodash';

//import loader from 'img/loading-hourglass.gif';

const propTypes = {
  order: PropTypes.object,
  t: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  className: PropTypes.object,
  configurations: PropTypes.object,
  user: PropTypes.object,
  email_templates: PropTypes.array,
  email: PropTypes.object,
  cache: PropTypes.object,
  toggle: PropTypes.func.isRequired,
  clear: PropTypes.func.isRequired,
  send_mail: PropTypes.func.isRequired,
};

const defaultProps = {};

class EmailPreviewModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clearOrderModal: false,
      selectedLabel: 0,
      receivers: '',
      subject: '',
    };
    this.previewRef = React.createRef();
  }

  getPreviewData = () => {
    const { order, cache, configurations, user } = this.props;
    return EPValues({
      order: omitNil(order),
      configurations,
      cache,
      user,
    });
  };

  sendMail = (html, subject, recievers) => {
    this.props.send_mail(
      subject || 'Polchem Color Suit - order([orderID])',
      html,
      recievers
    );
  };

  printTemplate = (html, subject) => {
    var win = window.open('', subject);
    win.document.write(html);

    setTimeout(function () {
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }, 1000);
  };

  toggleModal = () => {
    const { toggle, clear } = this.props;
    toggle();
    clear();
    this.setState({ receivers: '', selectedLabel: 0 });
  };

  validate_email = (address) => {
    // don't remember from where i copied this code, but this works.
    let re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(address);
  };

  handleOnChange = (e) => {
    let email = e.target.value;

    this.setState({ receivers: email });
  };

  render() {
    const {
      t,
      isOpen,
      email_templates,
      email,
      order,
      configurations: { config },
    } = this.props;

    const print_only =
      _.get(config, 'ist_email_template_handling.value', 'A') === 'P'; // print only

    const recievers =
      order.customer?.email && !this.state.receivers
        ? order.customer.email
        : this.state.receivers;

    const valid_email = this.validate_email(recievers);

    // list available templates here
    // Layout forced by print task
    let selectable = [];

    selectable = email_templates.map((x) => ({
      label: x.name,
      value: x,
    }));

    const ei_values = Object.entries(this.getPreviewData()).map(
      ([key, value]) => ({
        key: key,
        value: value,
      })
    );
    const preview = MailTemplateToHtml(
      this.state.selectedLabel?.data?.template || '',
      ei_values
    );

    const subject = MailTemplateToHtml(this.state.subject || '', ei_values);

    return (
      <Modal
        isOpen={isOpen}
        toggle={this.toggleModal}
        centered
        fade={false}
        className={this.props.className}
      >
        <ModalHeader toggle={this.toggleModal}>
          {print_only
            ? t('lbl.print', 'Print')
            : t('lbl.sendEmail', 'Send email')}
        </ModalHeader>
        <ModalBody>
          <Row className="mt-2">
            <Col xs={12} className="p-0 pr-8">
              {t('lbl.template', 'Template')}
            </Col>
          </Row>
          <div className="mb-8">
            <Select
              id="templateSelect"
              menuPlacement="auto"
              styles={{
                control: customControlStyles,
                option: (base) => ({ ...base, color: 'black' }),
              }}
              isSearchable={false}
              onChange={(value) =>
                this.setState({
                  selectedLabel: value.value,
                  subject: value.value.data.subject,
                })
              }
              options={selectable}
            />
          </div>
          {!print_only && (
            <Row className="mt-8 mb-8">
              <Col xs={4} className="p-0">
                <div className="mt-2">{t('lbl.subject.colon', 'Subject:')}</div>
              </Col>
              <Col xs={8} className="p-0">
                <Input
                  data-testid="mail_subject"
                  value={subject}
                  onChange={(e) => this.setState({ subject: e.target.value })}
                />
              </Col>
            </Row>
          )}

          <ErrorBoundary>
            {preview && (
              <div
                className="scroll"
                style={{
                  border: '2px solid black',
                  backgroundColor: 'white',
                  color: 'black',
                  zoom: '60%',
                  maxHeight: '20rem',
                }}
                dangerouslySetInnerHTML={{ __html: preview }}
              ></div>
            )}
          </ErrorBoundary>
          {!print_only && (
            <>
              <Row className="mt-8">
                <Col xs={12} className="p-0">
                  {t('lbl.receivers', 'Receivers')}
                </Col>
              </Row>
              <Row>
                <Col xs={12} className="p-0 ">
                  <Input
                    data-testid="receiver"
                    type="email"
                    valid={valid_email}
                    invalid={!valid_email}
                    value={recievers}
                    onChange={this.handleOnChange}
                  />
                </Col>
              </Row>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Alert
            color="info"
            style={{ width: '100%' }}
            isOpen={email.send_mail.pending}
          >
            {t('msg.sendingMail', 'Sending mail please wait...')}
          </Alert>
          <Alert
            color="danger"
            style={{ width: '100%' }}
            isOpen={email.send_mail.error !== null}
          >
            {t('msg.errorWhileSendingEmail', 'Error while sending email')}
          </Alert>
          <Alert
            color="success"
            style={{ width: '100%' }}
            isOpen={email.send_mail.data !== null}
          >
            {t('msg.EmailSentSuccess', 'Email sent successfully')}
          </Alert>
          <Row style={{ width: '100%' }}>
            <Col className="m-16">
              <Button
                data-testid="btn_cancel_print"
                color="secondary"
                onClick={this.toggleModal}
              >
                {t('fn.cancel', 'Cancel')}
              </Button>
            </Col>
            <Col className="m-16">
              <Button
                data-testid="btn_print"
                color="info"
                onClick={() => this.printTemplate(preview, subject)}
              >
                {t('fn.Print', 'Print')}
              </Button>
            </Col>
            {!print_only && (
              <Col className="m-16">
                <Button
                  data-testid="btn_send"
                  color="primary"
                  onClick={() => this.sendMail(preview, subject, recievers)}
                  disabled={
                    email.send_mail.pending ||
                    !valid_email ||
                    !this.state.subject
                  }
                >
                  {t('fn.Send', 'Send')}
                </Button>
              </Col>
            )}
          </Row>
        </ModalFooter>
      </Modal>
    );
  }
}

EmailPreviewModal.propTypes = propTypes;
EmailPreviewModal.defaultProps = defaultProps;

//todo customer email, can be also null
function mapStateToProps(store) {
  return {
    order: store.order,
    email_templates: store.configurations.email_templates,
    email: store.email,
    configurations: store.configurations,
    cache: store.cache,
    user: store.user,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      send_mail: emailActions.sendEmail,
      clear: emailActions.clear,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(EmailPreviewModal)
);
