import React, { Component } from 'react';
import {
  ModalFooter,
  Row,
  Col,
  Button,
  Modal,
  ModalBody,
  ModalHeader,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import errToJSON from 'error-to-json';
import JSONPretty from 'react-json-pretty';
import { CustomScrollbars } from 'js/mylib/Utils';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { bindActionCreators } from 'redux';
import errorActions from 'js/redux/reducers/Errors';
import { ERROR_TINTING_MACHINE } from 'js/Constants';
import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import { machineErrorToTranslationKey } from 'js/mylib/MachineErrorUtils';
import _ from 'lodash';
import { formatStackTrace } from 'polchem_base/common/ErrorUtils';
import { ERROR_CRITICAL } from '../../Constants';
import log from '../../api/Logger';

const propTypes = {
  t: PropTypes.func.isRequired,
  i18n: PropTypes.object.isRequired,
  clearError: PropTypes.func.isRequired,
  errors: PropTypes.object,
  machine: PropTypes.object,
};

function errorToString(e) {
  if (!e) {
    return '';
  }

  if (e instanceof Error) {
    try {
      return errToJSON(e);
    } catch (e) {
      console.log(e);
    }
  }

  if (typeof e === 'string') {
    return e;
  }

  try {
    return JSON.stringify(e);
  } catch (e) {
    console.log(e);
  }

  return String(e);
}

class CriticalModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      message: null,
      details: null,
    };

    this.toggle = this.toggle.bind(this);
    this.setMessage = this.setMessage.bind(this);
  }

  componentDidMount() {
    if (window.qtside) {
      // Connecting the bug in code here
      if (window.qtside.tmachine)
        window.qtside.tmachine.bugInCode.connect((msg) => {
          this.setMessage(msg);
        });
    }
  }

  setMessage(msg, details) {
    this.setState({
      modal: true,
      message: msg,
      details: details,
    });
  }

  toggle() {
    this.props.clearError();
    this.setState((state) => ({
      modal: !state.modal,
    }));
  }

  static getDerivedStateFromProps(props, state) {
    const { e, msg } = props.errors;
    if (msg !== state.message) {
      if (msg != null) {
        if (e instanceof Error) {
          formatStackTrace(e)
            .then(({ message, stack }) => {
              let prettyPrintedString = message + '\n' + stack;
              prettyPrintedString +=
                typeof e?.response?.data === 'string'
                  ? '\n\n************* Response data: *************\n' +
                    e?.response?.data
                  : '';

              prettyPrintedString +=
                typeof e?.response?.data === 'object'
                  ? '\n\n************* Response data: *************\n' +
                    JSON.stringify(e?.response?.data)
                  : '';

              log.error(
                'Displaying error: ' + msg + '\n' + prettyPrintedString
              );

              this.setState({
                modal: true,
                message: msg,
                details: prettyPrintedString || errorToString(e),
              });
            })
            .catch((err) => {
              log.error(err);
            });
        }

        return {
          modal: true,
          message: msg,
          details: errorToString(e),
        };
      }

      return {
        modal: false,
        message: null,
        details: null,
      };
    }
    return null;
  }

  critical_error = (theme) => {
    const {
      t,
      errors: { title, type },
    } = this.props;
    return (
      <>
        {' '}
        <ModalHeader toggle={this.toggle}>
          {title ||
            (type === ERROR_CRITICAL
              ? t('lbl.criticalError', 'Critical error')
              : t('lbl.error', 'Error'))}
        </ModalHeader>
        <ModalBody>
          {t(this.state.message)}
          <Row style={{ padding: '1rem' }}>
            <Col xs={{ size: 8, offset: 2 }}>
              <CopyToClipboard
                text={JSON.stringify(this.state.details)}
                onCopy={() => this.setState({ copied: true })}
              >
                <Button color="primary">
                  {t('fn.copyToClipboard', 'Copy to clipboard')}
                </Button>
              </CopyToClipboard>
            </Col>
          </Row>
          {this.state.details &&
            (typeof this.state.details === 'string' ? (
              <pre
                style={{
                  height: '250px',
                  background: '#272822',
                  color: '#ffffff',
                }}
              >
                {this.state.details}
              </pre>
            ) : (
              <CustomScrollbars
                style={{ height: '250px', background: '#272822' }}
              >
                <JSONPretty
                  id="json-pretty"
                  theme={theme}
                  data={this.state.details}
                />
              </CustomScrollbars>
            ))}
        </ModalBody>
        <ModalFooter>
          <Button color="warning" onClick={this.toggle}>
            {t('fn.ok', 'OK')}
          </Button>{' '}
        </ModalFooter>
      </>
    );
  };

  machine_error = (theme) => {
    const { t, i18n, errors, machine } = this.props;
    const error = _.get(errors, 'e', {});
    const translationKey = machineErrorToTranslationKey(error, i18n);

    const dispname = _.get(machine, 'info.dispenserName');
    const brand = _.get(machine, 'info.brand');

    return (
      <>
        {' '}
        <ModalHeader toggle={this.toggle}>
          {t('lbl.machineError', 'Machine error')}
        </ModalHeader>
        <ModalBody>
          <h5>
            {brand} - {dispname}
          </h5>
          {translationKey
            ? t(translationKey, { defaultValue: error.message })
            : t('machine.error.' + error.error_code, {
                defaultValue: error.message,
              })}

          <CustomScrollbars style={{ height: '250px', background: '#272822' }}>
            <JSONPretty id="json-pretty" theme={theme} data={error} />
          </CustomScrollbars>
          <Row style={{ padding: '1rem' }}>
            <Col xs={{ size: 8, offset: 2 }}>
              <CopyToClipboard
                text={JSON.stringify(errors.e)}
                onCopy={() => this.setState({ copied: true })}
              >
                <Button color="primary">
                  {t('fn.copyToClipboard', 'Copy to clipboard')}
                </Button>
              </CopyToClipboard>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="warning" onClick={this.toggle}>
            {t('fn.ok', 'OK')}
          </Button>{' '}
        </ModalFooter>
      </>
    );
  };

  render() {
    const { errors } = this.props;
    const theme = {
      main: 'line-height:1.3;color:#66d9ef;background:#272822;overflow:unset;',
      key: 'color:#f92672;',
      string: 'color:#fd971f;',
      value: 'color:#a6e22e;',
      boolean: 'color:#ac81fe;',
    };

    return (
      <Modal
        size={'xl'}
        isOpen={this.state.modal}
        toggle={this.toggle}
        centered
      >
        {errors.type === ERROR_TINTING_MACHINE
          ? this.machine_error(theme)
          : this.critical_error(theme)}
      </Modal>
    );
  }
}

CriticalModal.propTypes = propTypes;

// export default withTranslation('translations')(CriticalModal);
function mapStateToProps(store) {
  return {
    errors: store.errors,
    machine: machineSelectors.machine(
      store,
      store.errors.e && store.errors.e.dispID
    ),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      clearError: errorActions.clearError,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CriticalModal)
);
