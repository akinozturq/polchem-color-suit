import React from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardHeader, CardBody, Col, Row } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import Spinner from '../../shared/Spinner';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import remoteSupportActions from '../../../redux/reducers/RemoteSupport';
import { rightToLeft } from '../../../mylib/Utils';

class RemoteSupport extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  accessDenied = (privilege) => {
    const { privileges } = this.props;
    return !_.includes(privileges, privilege);
  };

  render() {
    const { t, openTeamViewer, is_available, opening } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          {t('lbl.remoteSupport', 'Remote support')}
        </CardHeader>
        <CardBody className="scroll config-card-body" dir={direction}>
          <Row className="mt-40">
            <Col />
            <Col xs={10}>
              {this.accessDenied('run_remote_support') ? (
                <h3 style={{ color: 'red', textAlign: 'center' }}>
                  {t(
                    'lbl.accessDeniedRemoteSupport',
                    'Access denied to remote support'
                  )}
                </h3>
              ) : is_available ? (
                <Button
                  color="success"
                  disabled={!is_available || opening}
                  onClick={openTeamViewer}
                >
                  {t('fn.openRemoteSupport', 'Open remote support')}
                  {opening && <Spinner />}
                </Button>
              ) : (
                <h3 style={{ color: 'red', textAlign: 'center' }}>
                  {t(
                    'lbl.remoteSupportNotInstalled',
                    'Remote support not installed'
                  )}
                </h3>
              )}
            </Col>
            <Col />
          </Row>
        </CardBody>
      </Card>
    );
  }
}

RemoteSupport.propTypes = {
  t: PropTypes.func.isRequired,
  openTeamViewer: PropTypes.func.isRequired,
  is_available: PropTypes.bool.isRequired,
  opening: PropTypes.bool.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
};
RemoteSupport.defaultProps = {};

/**
 * Mapping redux store configurations as this.props.configurations
 */
function mapStateToProps(state) {
  return {
    is_available: state.remote_support.is_remote_support_available,
    opening: state.remote_support.opening,
  };
}

/**
 * Connection actions here
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      openTeamViewer: remoteSupportActions.openTeamViewer,
    },
    dispatch
  );
}

/**
 * Wrapped with translations and connect to store.
 */
export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(RemoteSupport)
);
