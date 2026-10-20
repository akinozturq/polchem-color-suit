import React, { Component } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  InputGroup,
  Input,
  CustomInput,
  Form,
  FormFeedback,
  Alert,
  InputGroupAddon,
} from 'reactstrap';
import { CustomScrollbars, rightToLeft } from '../../../mylib/Utils';
import { bindActionCreators } from 'redux';
import actions, { selectors } from '../../../redux/reducers/User';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';
import Spinner from '../../shared/Spinner';
import { hasPrivilege } from '../../../mylib/Privileges';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class UserOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddUserModal: false,
      add_user_clicked: false,
      groups: [],
      username: { value: '', valid: false, error: null },
      password: { value: '', valid: false, error: null },
      confirmPassword: { value: '', valid: false, error: null },
      show: false,
    };
  }

  validateInput = (input) => {
    const { t, users, deleted_users } = this.props;

    if (!input || input.trim() === '') {
      return t('lbl.FieldIsRequired', 'Field is required');
    }
    if (input.length < 4 || input.length > 20) {
      return t(
        'lbl.lengthMustBe4to20',
        'The length must be in between of 4 and 20 characters '
      );
    }
    if (input.includes(' ')) {
      return t(
        'lbl.inputMustNotIncludeSpace',
        'Input must not include any spaces'
      );
    }

    const userNames = [...users, ...deleted_users].map((user) => user.username);
    const collator = new Intl.Collator('en', { sensitivity: 'base' }); // trying to simulate MariaDb generic collation

    if (userNames.find((user) => collator.compare(user, input) === 0)) {
      return t('lbl.usernameTaken', 'Username has already been taken');
    }
    return null;
  };

  handleUsernameChange = ({ target }) => {
    const validationError = this.validateInput(target.value);
    !validationError
      ? this.setState({
          username: {
            value: target.value,
            valid: true,
            error: null,
          },
        })
      : this.setState({
          username: {
            valid: false,
            value: target.value,
            error: validationError,
          },
        });
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

  toggleAddNewUserModal = () => {
    this.setState((prevState) => ({
      groups: [],
      username: { value: '', valid: false, error: null },
      password: { value: '', valid: false, error: null },
      confirmPassword: { value: '', valid: false, error: null },
      showAddUserModal: !prevState.showAddUserModal,
      add_user_clicked: false,
    }));
  };

  createUser = () => {
    const { username, password, groups } = this.state;

    this.props.addLocalUser({
      username: username.value,
      password: password.value,
      groups,
    });
    this.setState({
      add_user_clicked: true,
    });
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

  addUserModal = () => {
    const { t, add_user_pending, add_user_rejected, groups } = this.props;

    const show_spinner = add_user_pending;

    const group_table = groups.map((itm, idx) => {
      return (
        <CustomInput
          key={idx}
          id={'modal' + itm.groupname}
          type="checkbox"
          label={itm.groupname}
          onChange={(e) => {
            const checked = e.target.checked;
            this.setState((old) => {
              return checked
                ? { groups: [...old.groups, itm.usergroupid] }
                : {
                    groups: old.groups.filter((grp) => grp !== itm.usergroupid),
                  };
            });
          }}
          checked={
            this.state.groups.filter((grp) => grp === itm.usergroupid).length >
            0
          }
        />
      );
    });

    const user_added =
      this.state.showAddUserModal &&
      !add_user_pending &&
      !add_user_rejected &&
      this.state.add_user_clicked;

    return (
      <Modal
        centered
        isOpen={this.state.showAddUserModal}
        toggle={this.toggleAddNewUserModal}
      >
        <ModalHeader toggle={this.toggleAddNewUserModal}>
          {t('lbl.newLocalUser', 'New Local User')}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={this.createUser}>
            <InputGroup>
              <Input
                data-testid="username"
                invalid={!this.state.username.valid}
                valid={this.state.username.valid}
                className="input-normal br-8"
                value={this.state.username.value}
                onChange={this.handleUsernameChange}
                placeholder={t('lbl.username', 'Username')}
              />
              <FormFeedback valid={this.state.username.valid}>
                {!this.state.username.valid
                  ? this.state.username.error
                  : 'Username available'}
              </FormFeedback>
            </InputGroup>
            <InputGroup>
              <Input
                data-testid="password"
                invalid={!this.state.password.valid}
                valid={this.state.password.valid}
                className="input-normal mt-8"
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
                placeholder={t('lbl.password', 'Password')}
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
                data-testid="password2"
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
            <div style={{ width: '100%', margin: '1rem' }}>{group_table}</div>
          </Form>
          <Alert isOpen={!!add_user_rejected} color="danger">
            {add_user_rejected?.response?.data?.statusText ||
              JSON.stringify(add_user_rejected?.message)}
          </Alert>
          <Alert isOpen={user_added}>{t('lbl.userAdded', 'User added')}</Alert>
        </ModalBody>
        <ModalFooter style={{ flexWrap: 'nowrap' }}>
          <Row className="width100">
            <Col className="pr-2">
              <Button
                color="secondary"
                data-testid="cancelUserAdd"
                disabled={show_spinner || user_added}
                onClick={this.toggleAddNewUserModal}
              >
                {show_spinner && <Spinner />}
                {t('fn.cancel', 'Cancel')}
              </Button>
            </Col>
            <Col className="pl-2">
              <Button
                color="primary"
                data-testid="createUser"
                disabled={
                  !this.state.username.valid ||
                  !this.state.password.valid ||
                  !this.state.confirmPassword.valid ||
                  this.state.groups.length === 0 ||
                  show_spinner ||
                  user_added
                }
                onClick={this.createUser}
              >
                {show_spinner && <Spinner />}
                {t('fn.createUser', 'Create User')}
              </Button>
            </Col>
          </Row>
        </ModalFooter>
      </Modal>
    );
  };

  check_auto_close = () => {
    const { add_user_pending, add_user_rejected } = this.props;
    if (
      this.state.showAddUserModal &&
      !add_user_pending &&
      !add_user_rejected
    ) {
      // check result and if 200 close after 3 sec
      if (this.state.add_user_clicked) {
        setTimeout(
          function () {
            if (this.state.showAddUserModal) this.toggleAddNewUserModal();
          }.bind(this),
          1500
        );
      }
    }
  };
  render() {
    this.check_auto_close();

    const { t, users, current_user, started_as_admin } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    const local_users = users.filter((user) => !user.stduser);
    const user_table =
      local_users.length > 0 ? (
        local_users.map((user, i) => (
          <tr key={i}>
            <td>{user.username}</td>
            <td>
              {(started_as_admin ||
                current_user.localuserid !== user.localuserid) && (
                <Button
                  onClick={() => this.deleteUser(user)}
                  disabled={!hasPrivilege('uac_delete_user')}
                  data-denied={!hasPrivilege('uac_delete_user')}
                >
                  {t('fn.deleteUser', 'Delete user')}
                </Button>
              )}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td>{t('lbl.noUsers', 'No users')}</td>
        </tr>
      );

    if (!hasPrivilege('user_access_control')) {
      return (
        <Card
          style={{ height: 'calc((100vh - 102px) - 6rem)' }}
          className="config-card"
          dir={direction}
        >
          <CardHeader className="config-card-header" dir={direction}>
            <Row>
              <Col>{t('lbl.localUsers', 'Local Users')}</Col>
            </Row>
          </CardHeader>
          <CardBody className="m-8 config-card-body" dir={direction}>
            {t('lbl.accessDenied', 'Access denied')}
          </CardBody>
        </Card>
      );
    }

    return (
      <>
        {this.addUserModal()}
        <Card
          style={{ height: 'calc((100vh - 102px) - 6rem)' }}
          className="config-card"
          dir={direction}
        >
          <CardHeader
            data-testid="config-card-header"
            className="config-card-header"
            dir={direction}
          >
            <Row>
              <Col>{t('lbl.localUsers', 'Local Users')}</Col>
              <Col>
                <Button
                  data-testid="addNewUser"
                  onClick={this.toggleAddNewUserModal}
                  disabled={!hasPrivilege('uac_add_user')}
                  data-denied={!hasPrivilege('uac_add_user')}
                >
                  {t('fn.addNewUser', 'Add new user')}
                </Button>
              </Col>
            </Row>
          </CardHeader>
          <CustomScrollbars>
            <CardBody className="m-8 config-card-body" dir={direction}>
              <table className="table">
                <tbody>{user_table}</tbody>
              </table>
            </CardBody>
          </CustomScrollbars>
        </Card>
      </>
    );
  }
}

UserOverview.propTypes = {
  t: PropTypes.func,
  node: PropTypes.object,
  deleteLocalUser: PropTypes.func,
  addLocalUser: PropTypes.func,
  add_user_pending: PropTypes.bool,
  add_user_rejected: PropTypes.object,
  delete_user_pending: PropTypes.bool,
  delete_user_rejected: PropTypes.object,
  users: PropTypes.array,
  groups: PropTypes.array,
  current_user: PropTypes.object,
  started_as_admin: PropTypes.bool,
  deleted_users: PropTypes.array,
};

const mapStateToProps = (state) => ({
  users: selectors.users(state),
  deleted_users: state.user.deleted_users,
  groups: selectors.groups(state),
  current_user: selectors.current_user(state),
  add_user_pending: selectors.add_local_user_pending(state),
  add_user_rejected: selectors.add_local_user_rejected(state),
  delete_user_pending: selectors.delete_local_user_pending(state),
  delete_user_rejected: selectors.delete_local_user_rejected(state),
  started_as_admin: selectors.started_as_admin(state),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      addLocalUser: actions.addLocalUser,
      deleteLocalUser: actions.deleteLocalUser,
    },
    dispatch
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(UserOverview);
