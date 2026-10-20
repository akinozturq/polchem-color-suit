import React, { Component, lazy, Suspense } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import { push } from 'connected-react-router';
import { Card, CardBody, Col, Container, Row } from 'reactstrap';
import PropTypes from 'prop-types';
import { TopBar, TopBarLeft } from '../layout/Containers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { hasPrivilege } from '../../mylib/Privileges';
import { offline_mode } from '../../Constants';

const Statistics = lazy(() => import('./Statistics'));

class StatisticsPage extends Component {
  render() {
    const { t } = this.props;

    if (!hasPrivilege('detailed_stats')) {
      return (
        <Row
          className="white-nowrap"
          style={{ textAlign: 'center', height: '30rem' }}
        >
          <Col style={{ margin: 'auto' }}>
            <h1
              onClick={this.props.navigateTo('/history')}
              className="pointer-cursor"
            >
              <FontAwesomeIcon icon="arrow-left" style={{ fontSize: '2rem' }} />{' '}
              {t('msg.accessDenied', 'Access is denied')}
            </h1>
          </Col>
        </Row>
      );
    }

    return (
      <div className={'zoom-in'}>
        {offline_mode && (
          <div className="offline_info_text">
            {t(
              'lbl.only_orders_in_offline_mode',
              'Only orders made in offline mode'
            )}
          </div>
        )}
        <TopBar>
          <TopBarLeft>
            <h2
              className="clickable-text directly-over-bg mt-8"
              onClick={() => this.props.navigateTo('/history')}
            >
              <FontAwesomeIcon
                icon="arrow-left"
                style={{ fontSize: '1.7rem' }}
              />{' '}
              {t('cfg.h_statistics', 'Statistics')}
            </h2>
          </TopBarLeft>
        </TopBar>

        <Container className="justify-content-center">
          <Card>
            <CardBody
              className="br-8"
              style={{ height: 'calc(100vh - 11rem)' }}
            >
              <Suspense fallback={null}>
                <Statistics />
              </Suspense>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }
}

StatisticsPage.propTypes = {
  t: PropTypes.func,
  navigateTo: PropTypes.func,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      navigateTo: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(undefined, mapDispatchToProps)(StatisticsPage)
);
