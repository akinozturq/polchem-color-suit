import React from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, Row, Col } from 'reactstrap';
import { customControlStyles, CustomScrollbars } from 'js/mylib/Utils';
import { isSiteUser } from '../../../api/WebRequest';
import ExtrainfoTable from './ExtrainfoTable';
import { bindActionCreators } from 'redux';
import orderActions from '../../../redux/reducers/Order';
import { connect } from 'react-redux';
import Select from 'react-select';

const propTypes = {
  t: PropTypes.func.isRequired,
  large: PropTypes.bool,
  cache: PropTypes.object,
  zone: PropTypes.object,
  fetchOrderItemAlternativePrice: PropTypes.func.isRequired,
  config_values: PropTypes.shape({ ist_hide_compare_zone: PropTypes.bool }),
};

const defaultProps = {
  large: true,
};

class Extrainfo extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selected_zone: null,
    };
  }

  zone_changed = (zone) => {
    this.setState({ selected_zone: zone });
    this.props.fetchOrderItemAlternativePrice(zone.zoneid);
  };

  ist_header = () => {
    const { t, zone, cache, config_values } = this.props;
    return (
      <CardHeader
        className="bordered ready-grey"
        style={{
          borderRadius: '0.5rem 0.5rem 0px 0px',

          borderBottom: '1px solid color-white',
        }}
      >
        {/*text-center makes columns be center in horizontal-way and align-items-center makes columns be center in vertical-way */}
        <Row className="text-center align-items-center">
          <Col xs={12}>
            <h5 className="mb-0">
              <div className="collapsed uppercase bold-size-1 color-white mb-2">
                {t('lbl.extraInfo', 'Extra info')}
              </div>
            </h5>
          </Col>
        </Row>
        <Row>
          <Col>
            <div className="collapsed uppercase bold-size-1 color-white mt-1">
              {zone?.zonename}
            </div>
          </Col>
          {!config_values?.ist_hide_compare_zone && (
            <Col>
              <Select
                id="compare_zone_select"
                menuPlacement="auto"
                styles={{
                  control: customControlStyles,
                  option: (base) => ({
                    ...base,
                    color: 'black',
                  }),
                  valueContainer: (base) => ({
                    ...base,
                  }),
                }}
                isSearchable={false}
                onChange={(v) => this.zone_changed(v.value)}
                options={cache.zones.map((z) => ({
                  label: z.zonename,
                  value: z,
                }))}
                value={{
                  label: this.state.selected_zone?.zonename,
                  value: this.state.selected_zone,
                }}
              />
            </Col>
          )}
        </Row>
      </CardHeader>
    );
  };

  std_header = () => {
    const { t } = this.props;
    return (
      <CardHeader
        className="bordered ready-grey"
        style={{
          borderRadius: '0.5rem 0.5rem 0px 0px',
          height: '15%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '1px solid color-white',
        }}
      >
        <h5 className="mb-0">
          <div
            className="collapsed uppercase bold-size-1 color-white"
            style={{ textAlign: 'center' }}
          >
            {t('lbl.extraInfo', 'Extra info')}
          </div>
        </h5>
      </CardHeader>
    );
  };

  render() {
    const { large } = this.props;

    if (large) {
      return (
        <Card className="br-8 bordered ready-grey" style={{ height: '100%' }}>
          {!isSiteUser() ? this.ist_header() : this.std_header()}

          <CardBody className="scroll" style={{ height: '20%' }}>
            <ExtrainfoTable forcePriceoptionLot={!isSiteUser()} />
          </CardBody>
        </Card>
      );
    } else {
      return (
        <Card className="br-8 bordered ready-grey" style={{ height: '100%' }}>
          <CustomScrollbars>
            <ExtrainfoTable forcePriceoptionLot={!isSiteUser()} />
          </CustomScrollbars>
        </Card>
      );
    }
  }
}

Extrainfo.propTypes = propTypes;
Extrainfo.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    cache: store.cache,
    zone: store.configurations.zone,
    config_values: store.configurations.config_values,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchOrderItemAlternativePrice:
        orderActions.fetchOrderItemAlternativePrice,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Extrainfo)
);
