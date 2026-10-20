import { Col, CustomInput, FormGroup, Label } from 'reactstrap';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import PosAppPermissionActions from '../../../redux/reducers/PosAppPermissions';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { confirmAlert } from '../../../ext/react-confirm-alert';

class LockPC extends Component {
  check_restart = (event) => {
    const { t, idx, item, pos_app_permissions } = this.props;
    const checked = event.target.checked;

    if (!window?.qtside || pos_app_permissions.permissions?.data?.is_admin) {
      this.props.updateItem(item, checked, idx);
    } else {
      // Non admin case --> ask for user consent on this one.
      confirmAlert({
        title: t(
          'msg.confirmRunAsAdmin.title',
          'Administrator rights required'
        ),
        message: t(
          'msg.confirmRunAsAdmin',
          'Administrator rights are required for lock pc section to take action. Do you want to restart the application as admin?'
        ),
        buttons: [
          {
            label: t('fn.yes', 'Yes'),
            onClick: () => {
              //this.props.updateItem(item, checked, idx);
              this.props.reStartAsAdmin();
            },
          },
          {
            label: t('fn.no', 'No'),
          },
        ],
      });
    }
  };

  render() {
    const { t, item, accessDenied, pos_app_permissions } = this.props;
    return (
      <div>
        <FormGroup row>
          <Label sm={5}>{item.name}</Label>
          <Col
            sm={7}
            style={{
              paddingTop: '0.5rem',
              zIndex: '0',
              display: 'inline-flex',
            }}
          >
            <CustomInput
              type="checkbox"
              checked={item.value}
              disabled={item.islocked || accessDenied(item.code)}
              id={item.code}
              onChange={this.check_restart}
            />
            {pos_app_permissions &&
              pos_app_permissions.permissions.data &&
              pos_app_permissions.permissions.data.is_admin === false && (
                <div style={{ color: 'red' }}>
                  {t('msg.confirmRunAsAdmin.title')}
                </div>
              )}
          </Col>
        </FormGroup>
      </div>
    );
  }
}

LockPC.propTypes = {
  t: PropTypes.func.isRequired,
  pos_app_permissions: PropTypes.shape({
    permissions: PropTypes.shape({
      data: PropTypes.shape({ is_admin: PropTypes.bool }),
    }),
  }),
  reStartAsAdmin: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired,
  item: PropTypes.shape({
    name: PropTypes.string,
    code: PropTypes.string,
    value: PropTypes.bool,
    islocked: PropTypes.bool,
  }),
};

const mapStateToProps = (state) => {
  return {
    pos_app_permissions: state.pos_app_permissions,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      reStartAsAdmin: PosAppPermissionActions.reStartAsAdmin,
    },
    dispatch
  );
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(LockPC)
);
