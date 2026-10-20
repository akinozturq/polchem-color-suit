import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, CardHeader, Col, Row } from 'reactstrap';
import { CustomScrollbars, rightToLeft } from '../../../mylib/Utils';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import Spinner from '../../shared/Spinner';
import { protectionStatusTranslations } from 'js/SharedTranslations';
import { hasPrivilege } from '../../../mylib/Privileges';
import { dateToLocaleString } from '../../../mylib/DateUtils';
import { offline_mode } from '../../../Constants';

class License extends Component {
  render() {
    const { t, status } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';

    const code_map = protectionStatusTranslations(t);

    let status_text = (status ? code_map[status.status] : null) || <Spinner />;

    const expdate = status && status.expdate;
    const daysleft = status && status.daysleft;

    const expiryInfo = expdate
      ? dateToLocaleString(expdate) +
        ', ' +
        t('lbl.daysLeft.colon', 'days left:') +
        ' ' +
        daysleft
      : t('lbl.perpetual', 'Perpetual');

    /*
    if (expdate) {
      status_text +=
        ' ' + t('lbl.expiresOn_date.colon', 'expires on:') + ' ' + expdate;
    }
    if (daysleft) {
      status_text +=
        ' ' + t('lbl.daysLeft.colon', 'days left:') + ' ' + daysleft;
    }

     */

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          <Row>
            <Col>{t('lbl.license', 'License')}</Col>
          </Row>
        </CardHeader>

        <CustomScrollbars>
          <CardBody className="m-8 config-card-body" dir={direction}>
            <Row className="m-16">
              <Col xs={4}>
                {t('lbl.licenseStatus.colon', 'License status:')}
              </Col>
              <Col>{status_text}</Col>
            </Row>
            {(status && status.cloud) || offline_mode ? (
              <div className="m-16" style={{ textAlign: 'center' }}>
                {t(
                  'msg.licenseManagedByCloud',
                  'License is managed by cloud server'
                )}
              </div>
            ) : (
              <>
                <Row className="m-16">
                  <Col xs={4}>{t('lbl.licenseCode', 'License code')}:</Col>
                  <Col>{status.license_code}</Col>
                </Row>
                <Row className="m-16">
                  <Col xs={4}>
                    {t('lbl.licenseExpiryDate', 'License expiry date')}:
                  </Col>
                  <Col>{expiryInfo}</Col>
                </Row>
                <Row className="m-16">
                  <Col xs={4}>{t('lbl.computerId', 'Computer ID')}:</Col>
                  <Col>{status.computerid}</Col>
                </Row>

                <Row className="m-16">
                  <Col xs={4} className="m-auto">
                    {t('lbl.features_license', 'Features')}:
                  </Col>
                  <Col>{status.features.join(', ')}</Col>
                </Row>
                <Row className="m-16">
                  <Col>
                    {hasPrivilege('activation') && (
                      <a href="#/protection" className="btn btn-primary">
                        {t('lbl.manageLicense', 'Manage license')}
                      </a>
                    )}
                  </Col>
                </Row>
              </>
            )}
          </CardBody>
        </CustomScrollbars>
      </Card>
    );
  }
}
License.propTypes = {
  t: PropTypes.func.isRequired,
  node: PropTypes.shape({ children: PropTypes.array }),
  status: PropTypes.shape({
    features: PropTypes.arrayOf(PropTypes.string),
    computerid: PropTypes.string,
    license_code: PropTypes.string,
    cloud: PropTypes.bool,
    status: PropTypes.number,
    daysleft: PropTypes.number,
    expdate: PropTypes.array,
  }),
};
function mapStateToProps(store) {
  return { status: store.protection.status };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(License)
);
