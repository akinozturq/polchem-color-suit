import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import lostPasswordActions from 'js/redux/reducers/LostPassword';
import { connect } from 'react-redux';
import {
  Alert,
  Button,
  Col,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  Label,
  Row,
} from 'reactstrap';

import errToJSON from 'error-to-json';
import JSONPretty from 'react-json-pretty';
import { ERROR_THEME, MIN_PASSWORD_LENGTH } from 'js/Constants';
import Spinner from './components/shared/Spinner';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class ForgotPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      verifycode: '',
      password: '',
      password2: '',
      show: false,
    };
  }

  componentDidMount() {
    let code = String(window.location.hash).split('=')[1];
    if (code && code.length > 0 && this.state.verifycode === '') {
      this.setState({ verifycode: code });
    }
  }

  render() {
    const { t, lostpassword } = this.props;

    return (
      <div className="white-nowrap m-8-16 p-4">
        <h1>{t('lbl.passwordReset', 'Polchem Color Suit 4 password reset')}</h1>
        <Alert color="info" isOpen={lostpassword.resetPassword.pending}>
          <Spinner />
          {t('lbl.resettingPassword', 'Resetting password please wait...')}
        </Alert>
        <Alert
          color="danger"
          isOpen={lostpassword.resetPassword.error !== null}
        >
          {t('lbl.resettingPasswordError', 'Error while resetting password')}
          <div style={{ color: '#212529' }}>
            <div className="scroll" style={{ maxHeight: '15rem' }}>
              {lostpassword.resetPassword.error && (
                <JSONPretty
                  id="json-pretty"
                  theme={ERROR_THEME}
                  data={errToJSON(lostpassword.resetPassword.error)}
                />
              )}
            </div>
          </div>
        </Alert>
        <Alert
          color="success"
          isOpen={lostpassword.resetPassword.data !== null}
        >
          {_.get(lostpassword, 'resetPassword.data.msg')}
        </Alert>
        <FormGroup row>
          <Label for="verifycode" sm={2}>
            {t('lbl.passwordResetToken', 'Password reset token')}
          </Label>
          <Col sm={10}>
            <Input
              type="text"
              name="token"
              id="verifycode"
              placeholder={t(
                'prompt.givePasswordResetToken',
                'Give in password reset token'
              )}
              value={this.state.verifycode}
              valid={this.state.verifycode.length > MIN_PASSWORD_LENGTH - 1}
              invalid={this.state.verifycode.length === 0}
              onChange={(e) => this.setState({ verifycode: e.target.value })}
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Label for="password" sm={2}>
            {t('lbl.password', 'Password')}
          </Label>
          <Col sm={10}>
            <InputGroup>
              <Input
                type={this.state.show ? 'text' : 'password'}
                name="password"
                id="password"
                placeholder={t('lbl.password', 'Password')}
                value={this.state.password}
                valid={this.state.password.length > MIN_PASSWORD_LENGTH - 1}
                invalid={this.state.password.length < MIN_PASSWORD_LENGTH}
                onChange={(e) => this.setState({ password: e.target.value })}
              />
              <InputGroupAddon addonType="append">
                <Button
                  color="warning"
                  onClick={() =>
                    this.setState((state) => ({ show: !state.show }))
                  }
                  style={{
                    height: '38px',
                    padding: '4px 10px',
                    borderRadius: '0 5px 5px 0',
                  }}
                >
                  <FontAwesomeIcon
                    icon={this.state.show ? 'eye-slash' : 'eye'}
                  />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Col>
        </FormGroup>
        <FormGroup row>
          <Label for="password2" sm={2}>
            {t('lbl.repeatPassword', 'Repeat password')}
          </Label>
          <Col sm={10}>
            <InputGroup>
              <Input
                type={this.state.show ? 'text' : 'password'}
                name="password2"
                id="password2"
                placeholder={t('lbl.password', 'Password')}
                value={this.state.password2}
                valid={this.state.password2.length > MIN_PASSWORD_LENGTH - 1}
                invalid={
                  this.state.password2.length < MIN_PASSWORD_LENGTH ||
                  this.state.password2 !== this.state.password
                }
                onChange={(e) => this.setState({ password2: e.target.value })}
              />
              <InputGroupAddon addonType="append">
                <Button
                  color="warning"
                  onClick={() =>
                    this.setState((state) => ({ show: !state.show }))
                  }
                  style={{
                    height: '38px',
                    padding: '4px 10px',
                    borderRadius: '0 5px 5px 0',
                  }}
                >
                  <FontAwesomeIcon
                    icon={this.state.show ? 'eye-slash' : 'eye'}
                  />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Col>
        </FormGroup>
        <Row>
          <Col>
            {lostpassword.resetPassword.data ? (
              <Button
                className="fa-pull-right"
                color="success"
                onClick={() =>
                  (window.location.href = window.location.href.split('#')[0])
                }
              >
                {t('fn.home', 'Home')}
              </Button>
            ) : (
              <Button
                className="fa-pull-right"
                color="primary"
                disabled={
                  this.state.password.length < MIN_PASSWORD_LENGTH ||
                  this.state.password2 !== this.state.password
                }
                onClick={() =>
                  this.props.resetPassword(
                    this.state.verifycode,
                    this.state.password
                  )
                }
              >
                {t('fn.reset', 'Reset')}
              </Button>
            )}
          </Col>
        </Row>
      </div>
    );
  }
}

ForgotPassword.propTypes = {
  t: PropTypes.func.isRequired,
  resetPassword: PropTypes.func.isRequired,
  lostpassword: PropTypes.shape({
    resetPassword: PropTypes.shape({
      error: PropTypes.any,
      pending: PropTypes.bool,
      data: PropTypes.any,
    }),
  }),
};

function mapStateToProps(store) {
  return {
    lostpassword: store.lostpassword,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      resetPassword: lostPasswordActions.resetPassword,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ForgotPassword)
);
