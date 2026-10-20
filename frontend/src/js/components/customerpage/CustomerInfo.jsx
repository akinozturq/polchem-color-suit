import React from 'react';
import { TopBar, TopBarLeft } from '../layout/Containers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Row } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { propType as customerType } from 'js/redux/reducers/Customer';
import { t } from 'i18next';
import PropTypes from 'prop-types';
import { rightToLeft } from '../../mylib/Utils';

class CustomerInfo extends React.Component {
  render() {
    const { customer, goBack } = this.props;
    const isRtl = rightToLeft();
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };
    const columnStyle = { paddingLeft: 0, paddingRight: 0 };
    return (
      <>
        <TopBar>
          <TopBarLeft>
            <h2
              id="backToHomePage"
              className={
                (goBack ? 'clickable-text' : '') + ' directly-over-bg mt-8'
              }
              style={{
                ...alignStyle,
                display: 'flex',
                flexDirection: isRtl ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: isRtl ? 'flex-end' : 'flex-start',
                gap: '0.5rem',
              }}
              onClick={goBack ? this.props.goBack : null}
            >
              {goBack && (
                <FontAwesomeIcon
                  icon={isRtl ? 'arrow-right' : 'arrow-left'}
                  style={{ fontSize: '1.7rem' }}
                />
              )}
              <span>{customer.customername}</span>
            </h2>
          </TopBarLeft>
        </TopBar>
        <div
          style={{
            color: 'white',
            wordWrap: 'break-word',
            marginLeft: isRtl ? 0 : '1rem',
            marginRight: isRtl ? '1rem' : 0,
            display: 'grid',
            rowGap: '0.5rem',
            ...alignStyle,
          }}
        >
          <Row>
            <Col xs={5} className={'p-0 m-0'} style={columnStyle}>
              <Row>
                <Col xs={5} className={'pr-0'} style={columnStyle}>
                  {t('lbl.companyName.colon', 'Company name:')}
                </Col>
                <Col xs={7} className={'pr-0'} style={columnStyle}>
                  {customer?.companyname ? customer.companyname : ''}
                </Col>
              </Row>
              <Row>
                <Col xs={5} className={'pr-0'} style={columnStyle}>
                  {t('lbl.email.colon', 'Email:')}
                </Col>
                <Col xs={7} className={'pr-0'} style={columnStyle}>
                  {customer?.email ? customer.email : ''}
                </Col>
              </Row>
              <Row>
                <Col xs={5} className={'pr-0'} style={columnStyle}>
                  {t('lbl.address.colon', 'Address:')}
                </Col>
                <Col xs={7} className={'pr-0'} style={columnStyle}>
                  {customer?.address1 ? customer.address1 : ''}
                </Col>
              </Row>
            </Col>
            <Col xs={4} className={'p-0 m-0'} style={columnStyle}>
              <Row>
                <Col xs={6} className={'pr-0'} style={columnStyle}>
                  {t('lbl.phone.colon', 'Phone number:')}
                </Col>
                <Col xs={6} className={'pr-0'} style={columnStyle}>
                  {customer?.phone ? customer.phone : ''}
                </Col>
              </Row>
              <Row>
                <Col xs={6} className={'pr-0'} style={columnStyle}>
                  {t('lbl.city.colon', 'City:')}
                </Col>
                <Col xs={6} className={'pr-0'} style={columnStyle}>
                  {customer?.address2 ? customer.address2 : ''}
                </Col>
              </Row>
              <Row>
                <Col xs={6} className={'pr-0'} style={columnStyle}>
                  {t('lbl.zipCode.colon', 'Zip:')}
                </Col>
                <Col xs={6} className={'pr-0'} style={columnStyle}>
                  {customer?.postcode ? customer.postcode : ''}
                </Col>
              </Row>
            </Col>
            <Col className={'p-0 m-0'} style={columnStyle}>
              <Row>
                <Col xs={6} className={'pr-0'} style={columnStyle}>
                  {' '}
                  {t('lbl.country.colon', 'Country:')}
                </Col>
                <Col xs={6} className={'pr-0'} style={columnStyle}>
                  {customer?.country}
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </>
    );
  }
}
CustomerInfo.propTypes = {
  customer: customerType,
  goBack: PropTypes.func,
};
export default withTranslation('translations')(
  connect(null, null)(CustomerInfo)
);
