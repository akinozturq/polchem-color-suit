/**
 * Shows modals of the machine if mandatory purge is requested
 */

import React from 'react';

import PropTypes from 'prop-types';
import {
  Col,
  Row,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
} from 'reactstrap';

import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  MACHINE_PROGRESS_PURGE,
  MACHINE_PROGRESS_PURGE_ALL,
  MACHINE_PROGRESS_PURGE_AUTOMATIC,
  MACHINE_PROGRESS_TINT,
  MACHINE_STATE_DISPENSE,
  MACHINE_STATE_GRAVIMETRIC_DISPENSING,
} from '../../Constants';
import machineActions, {
  selectors as machineSelectors,
  propType as machineType,
} from 'js/redux/reducers/Machine';
import { selectors as userSelectors } from 'js/redux/reducers/User';
import Dispense from './graphics/Dispense';
import _ from 'lodash';
import { rightToLeft } from '../../mylib/Utils';
import { mstateErrorToTranslationKey } from '../../mylib/MachineErrorUtils';

const propTypes = {
  t: PropTypes.func.isRequired,
  i18n: PropTypes.object.isRequired,
  dispID: PropTypes.string.isRequired,
  machineAction: PropTypes.func.isRequired,
  machine: machineType,
  drop_colors: PropTypes.array.isRequired,
  login: PropTypes.shape({
    site_logged_in: PropTypes.bool.isRequired,
  }),
  user_privileges: PropTypes.array,
  pos_app_permissions: PropTypes.shape({ is_admin: PropTypes.bool }),
};

const defaultProps = {};

class MachineModalCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.getMachineText = this.getMachineText.bind(this);
  }

  answerQuestion(ans) {
    this.props.machineAction(this.props.dispID, ans);
  }

  getMachineText() {
    const { t, i18n, machine, user_privileges, pos_app_permissions } =
      this.props;
    const mstate = machine.machine_state;
    const disable_btn = !user_privileges.includes('order_tinting_process');

    if (mstate.currentProcess === MACHINE_PROGRESS_TINT && disable_btn) {
      return t(
        'machine.msg.loginToResumeTinting',
        'Please log in to resume tinting'
      );
    }
    let disable_cancel = false;
    // Check mandatory purge
    if (
      [
        MACHINE_PROGRESS_PURGE_AUTOMATIC,
        MACHINE_PROGRESS_PURGE_ALL,
        MACHINE_PROGRESS_PURGE,
      ].includes(mstate.currentProcess)
    ) {
      const purge_is_skippable = _.get(
        machine,
        'config.purge_is_skippable',
        false
      );

      // Cancel disabled if purge is not skippable and privileges do not allow cancel for purge
      // If application is started as an administrator then allow purge cancel operation
      disable_cancel = !(
        purge_is_skippable ||
        user_privileges.includes('cancel_mandatory_purge') ||
        pos_app_permissions.is_admin
      );
    }

    // Check the machine status
    if (mstate.msgText) {
      let buttons = mstate.msgButtons?.map((name) => (
        <Button
          key={name}
          disabled={
            (String(name).startsWith('cancel') && disable_cancel) || disable_btn
          }
          data-denied={
            (String(name).startsWith('cancel') && disable_cancel) || disable_btn
          }
          onClick={() => this.answerQuestion(name)}
        >
          {t('machine.fn.' + (name === 'cancel_login' ? 'cancel' : name))}
        </Button>
      ));

      const translationKey = mstateErrorToTranslationKey(mstate, i18n);

      return (
        <React.Fragment>
          {translationKey
            ? t(translationKey, {
                ...mstate.msgParams,
                defaultValue: mstate.msgText,
              })
            : mstate.msgText}
          {buttons}
        </React.Fragment>
      );
    }
  }

  render() {
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const mstate = this.props.machine.machine_state;
    const dispensing =
      mstate.state === MACHINE_STATE_DISPENSE ||
      mstate.state === MACHINE_STATE_GRAVIMETRIC_DISPENSING;

    return (
      <Card
        style={{ marginBottom: '0.5rem', textAlign: isRtl ? 'right' : 'left' }}
        dir={direction}
      >
        <CardHeader>
          {this.props.dispID} -{' '}
          {this.props.machine.info ? this.props.machine.info.dispenserName : ''}
        </CardHeader>
        <CardBody>
          <Row style={{ paddingBottom: '0.5rem' }}>
            <Col xs="7">{this.getMachineText()}</Col>
            <Col
              xs="5"
              style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
              }}
            >
              <Dispense
                height={140}
                dispensing={dispensing}
                color={this.props.drop_colors}
              />
            </Col>
          </Row>
        </CardBody>
        <CardFooter />
      </Card>
    );
  }
}

MachineModalCard.propTypes = propTypes;
MachineModalCard.defaultProps = defaultProps;

function mapStateToProps(state, ownProps) {
  return {
    machine: machineSelectors.machine(state, ownProps.dispID),
    drop_colors: machineSelectors.drop_colors(state),
    user_privileges: userSelectors.privileges(state),
    pos_app_permissions: state.pos_app_permissions.permissions.data,
    login: state.login,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      machineAction: machineActions.machineAction,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachineModalCard)
);
