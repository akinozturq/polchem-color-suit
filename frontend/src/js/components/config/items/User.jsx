import React, { Component } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Button,
  CustomInput,
  Input,
  InputGroup,
  FormFeedback,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  InputGroupAddon,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bindActionCreators } from 'redux';
import actions, { selectors } from '../../../redux/reducers/User';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { rightToLeft } from '../../../mylib/Utils';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';
import Spinner from '../../shared/Spinner';

class User extends Component {
  state = {
    pwd_change_clicked: false,
    showChangePasswordModal: false,
    password: { value: '', valid: false, error: null },
    confirmPassword: { value: '', valid: false, error: null },
    show: false,
  };

  validateInput = (input) => {
    const { t } = this.props;
    let errorMessage;
    if (!input) {
      errorMessage = t('lbl.FieldIsRequired', 'Field is required');
    } else {
      switch (true) {
        case input.trim() === '':
          errorMessage = t('lbl.fieldIsRequired', 'Field is required');
          break;
        case input.length < 4 || input.length > 20:
          errorMessage = t(
            'lbl.lengthMustBe4to20',
            'The length must be in between of 4 and 20 characters '
          );
          break;
        case input.includes(' '):
          errorMessage = t(
            'lbl.inputMustNotIncludeSpace',
            'Input must not include any spaces'
          );
          break;
        default:
          break;
      }
    }
    return errorMessage;
  };

  toggleChangePasswordModal = () => {
    this.setState((prevState) => ({
      ...prevState,
      showChangePasswordModal: !prevState.showChangePasswordModal,
      password: { value: '', valid: false, error: null },
      confirmPassword: { value: '', valid: false, error: null },
      pwd_change_clicked: false,
    }));
  };

  check_passwords = (edited_field, compare_field, text) => {
    const { t } = this.props;
    const validationError = this.validateInput(text);
    const match = this.state[compare_field]?.value === text;
    if (match && !validationError) {
      this.setState({
        [edited_field]: {
          value: text,
          valid: true,
          error: null,
        },
        [compare_field]: {
          value: text,
          valid: true,
          error: null,
        },
      });
    } else if (!match && !validationError) {
      this.setState({
        [edited_field]: {
          value: text,
          valid: false,
          error: t('error.passwordsNotMatch', 'Password does not match'),
        },
      });
    } else {
      this.setState({
        [edited_field]: {
          value: text,
          valid: false,
          error: validationError,
        },
      });
    }
  };

  handleCreateNewPassword = () => {
    const { username, localuserid } = this.props.node.config;
    const { password } = this.state;
    this.props.editLocalUserPassword({
      username,
      password,
      localuserid,
    });
    this.setState({ pwd_change_clicked: true });
  };

  deleteUser = ({ localuserid, username }) => {
    const { t } = this.props;
    confirmAlert({
      title: t('msg.confirmDeleteUser.title', 'Confirm user deletion'),
      message: t(
        'msg.confirmDeleteUser',
        'Are you sure want to delete user {{username}}?',
        { username }
      ),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => {
            this.props.deleteLocalUser(localuserid);
          },
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  handleGroupChange = (checked, usergroupid) => {
    const { node } = this.props;
    const { localuserid, username, groups } = node.config;

    const editedGroups = checked
      ? [...groups, usergroupid]
      : groups.filter((grp) => grp !== usergroupid);

    this.props.editLocalUserGroup({ username, localuserid, editedGroups });
  };

  getUserInGroups = () => {
    const { node, groups, current_user, edit_local_user_group_pending } =
      this.props;
    const userGroups = node.config?.groups;
    const disabled =
      node.config.stduser ||
      (!current_user.localuserid && !current_user.posuserid) ||
      current_user.localuserid === node.config.localuserid ||
      edit_local_user_group_pending;

    const group_table = groups.map((itm, idx) => {
      return (
        <CustomInput
          key={idx}
          id={'modal' + itm.groupname}
          type="checkbox"
          label={itm.groupname}
          onChange={(e) => {
            const checked = e.target.checked;
            this.handleGroupChange(checked, itm.usergroupid);
          }}
          checked={
            userGroups.filter((grp) => grp === itm.usergroupid).length > 0
          }
          disabled={disabled}
        />
      );
    });
    return group_table;
  };

  check_auto_close = () => {
    const { change_password_pending, change_password_rejected } = this.props;
    if (
      this.state.showChangePasswordModal &&
      !change_password_pending &&
      !change_password_rejected
    ) {
      // check result and if 200 close after 3 sec
      if (this.state.pwd_change_clicked) {
        setTimeout(
          function () {
            if (this.state.showChangePasswordModal)
              this.toggleChangePasswordModal();
          }.bind(this),
          1500
        );
      }
    }
  };

  render() {
    this.check_auto_close();
    const {
      node,
      t,
      change_password_pending,
      change_password_rejected,
      delete_user_pending,
      delete_user_rejected,
      edit_local_user_group_pending,
      edit_local_user_group_rejected,
      current_user,
      started_as_admin,
    } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';

    const password_changed =
      this.state.showChangePasswordModal &&
      !change_password_pending &&
      !change_password_rejected &&
      this.state.pwd_change_clicked;

    return (
      <>
        <Modal
          centered
          isOpen={this.state.showChangePasswordModal}
          toggle={this.toggleChangePasswordModal}
        >
          <ModalHeader toggle={this.toggleChangePasswordModal}>
            {t('lbl.changePassword', 'Change Password')}
          </ModalHeader>
          <ModalBody>
            <InputGroup>
              <Input
                invalid={!this.state.password.valid}
                valid={this.state.password.valid}
                className="input-normal  mt-8"
                style={{ borderRadius: '5px 0 0 5px' }}
                type={this.state.show ? 'text' : 'password'}
                value={this.state.password.value}
                onChange={(e) =>
                  this.check_passwords(
                    'password',
                    'confirmPassword',
                    e.target.value
                  )
                }
                placeholder={t('lbl.newPassword', 'New Password')}
              />
              <InputGroupAddon addonType="append">
                <Button
                  className="mt-8"
                  color="warning"
                  onClick={() =>
                    this.setState((state) => ({ show: !state.show }))
                  }
                  style={{
                    height: '48px',
                    //padding: '4px 10px',
                    borderRadius: '0 5px 5px 0',
                  }}
                >
                  <FontAwesomeIcon
                    icon={this.state.show ? 'eye-slash' : 'eye'}
                  />
                </Button>
              </InputGroupAddon>
              <FormFeedback valid={this.state.password.valid}>
                {!this.state.password.valid ? this.state.password.error : ''}
              </FormFeedback>
            </InputGroup>
            <InputGroup>
              <Input
                valid={this.state.confirmPassword.valid}
                invalid={!this.state.confirmPassword.valid}
                className="input-normal  mt-8"
                style={{ borderRadius: '5px 0 0 5px' }}
                type={this.state.show ? 'text' : 'password'}
                value={this.state.confirmPassword.value}
                onChange={(e) =>
                  this.check_passwords(
                    'confirmPassword',
                    'password',
                    e.target.value
                  )
                }
                placeholder={t('prompt.confirmPassword', 'Confirm Password')}
              />
              <InputGroupAddon addonType="append">
                <Button
                  className="mt-8"
                  color="warning"
                  onClick={() =>
                    this.setState((state) => ({ show: !state.show }))
                  }
                  style={{
                    height: '48px',
                    //padding: '4px 10px',
                    borderRadius: '0 5px 5px 0',
                  }}
                >
                  <FontAwesomeIcon
                    icon={this.state.show ? 'eye-slash' : 'eye'}
                  />
                </Button>
              </InputGroupAddon>
              <FormFeedback valid={this.state.confirmPassword.valid}>
                {!this.state.confirmPassword.valid
                  ? this.state.confirmPassword.error
                  : t('lbl.passwordValid', 'Passwords match')}
              </FormFeedback>
            </InputGroup>
            <Alert isOpen={!!change_password_rejected}>
              {JSON.stringify(change_password_rejected)}
            </Alert>

            <Alert isOpen={password_changed}>
              {t('lbl.passwordChanged', 'Password changed')}
            </Alert>
          </ModalBody>
          <ModalFooter style={{ flexWrap: 'nowrap' }}>
            <Row className="width100">
              <Col className="pr-2">
                <Button
                  color="secondary"
                  disabled={
                    this.props.node.config.stduser ||
                    change_password_pending ||
                    password_changed
                  }
                  onClick={this.toggleChangePasswordModal}
                >
                  {change_password_pending && <Spinner />}
                  {t('fn.cancel', 'Cancel')}
                </Button>
              </Col>

              <Col className="pl-2">
                <Button
                  color="primary"
                  disabled={
                    !this.state.password.valid ||
                    !this.state.confirmPassword.valid ||
                    change_password_pending ||
                    password_changed
                  }
                  onClick={this.handleCreateNewPassword}
                >
                  {change_password_pending && <Spinner />}
                  {t('fn.changePassword', 'Change Password')}
                </Button>
              </Col>
            </Row>
          </ModalFooter>
        </Modal>
        <Card
          style={{ height: 'calc((100vh - 102px) - 6rem)' }}
          className="config-card"
          dir={direction}
        >
          <CardHeader className="config-card-header" dir={direction}>
            <Row>
              <Col md={4} style={{ alignSelf: 'center' }}>
                {t('lbl.userData', 'User data') + ` (${node.name})`}
              </Col>
              <Col md={3} style={{ alignSelf: 'center' }}>
                <Button
                  className="btn btn-primary btn-left btn-top"
                  onClick={() => this.deleteUser(node.config)}
                  disabled={
                    !started_as_admin ||
                    current_user.localuserid ===
                      this.props.node.config.localuserid ||
                    delete_user_pending
                  }
                >
                  {delete_user_pending ? (
                    <Spinner />
                  ) : (
                    <FontAwesomeIcon icon="trash-alt" />
                  )}
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={this.toggleChangePasswordModal}
                  disabled={
                    this.props.node.config.stduser ||
                    (!current_user.localuserid && !current_user.posuserid) ||
                    delete_user_pending
                  }
                >
                  {delete_user_pending && <Spinner />}{' '}
                  {t('fn.changePassword', 'Change Password')}
                </Button>
                <Button disabled>{t('fn.setCard', 'Set card')}</Button>
              </Col>
            </Row>
          </CardHeader>
          <CardBody className="config-card-body" dir={direction}>
            <Alert isOpen={!!delete_user_rejected}>
              {JSON.stringify(delete_user_rejected)}
            </Alert>
            <Row>
              <Col className="m-16">{this.getUserInGroups()}</Col>
              <Col style={{ fontSize: 'xx-large' }}>
                {edit_local_user_group_pending && <Spinner />}
              </Col>
            </Row>
            <Row>
              <Col>
                <Alert isOpen={!!edit_local_user_group_rejected}>
                  {JSON.stringify(edit_local_user_group_rejected)}
                </Alert>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </>
    );
  }
}

User.propTypes = {
  t: PropTypes.func,
  node: PropTypes.object,
  editLocalUserGroup: PropTypes.func,
  deleteLocalUser: PropTypes.func,
  editLocalUserPassword: PropTypes.func,
  change_password_pending: PropTypes.bool,
  change_password_rejected: PropTypes.object,
  edit_local_user_group_pending: PropTypes.bool,
  edit_local_user_group_rejected: PropTypes.object,
  delete_user_pending: PropTypes.bool,
  delete_user_rejected: PropTypes.object,
  current_user: PropTypes.object,
  groups: PropTypes.array,
  started_as_admin: PropTypes.bool,
};

const mapStateToPrpos = (state) => ({
  change_password_pending: selectors.edit_local_user_password_pending(state),
  change_password_rejected: selectors.edit_local_user_password_rejected(state),
  delete_user_pending: selectors.delete_local_user_pending(state),
  delete_user_rejected: selectors.delete_local_user_rejected(state),
  edit_local_user_group_pending: selectors.edit_local_user_group_pending(state),
  edit_local_user_group_rejected:
    selectors.edit_local_user_group_rejected(state),
  current_user: selectors.current_user(state),
  groups: selectors.groups(state),
  started_as_admin: selectors.started_as_admin(state),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      editLocalUserGroup: actions.editLocalUserGroup,
      deleteLocalUser: actions.deleteLocalUser,
      editLocalUserPassword: actions.editLocalUserPassword,
    },
    dispatch
  );
};
export default connect(mapStateToPrpos, mapDispatchToProps)(User);
