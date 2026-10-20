import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { CustomScrollbars } from 'js/mylib/Utils';
import orderActions from 'js/redux/reducers/Order';
import ExtrainfoTable from './ExtrainfoTable';

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

class MobileExtraInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      toggleZonesOpen: false,
      selected_zone: null,
    };
  }

  toggleZones = () => {
    this.setState((state) => ({
      toggleZonesOpen: !state.toggleZonesOpen,
    }));
  };

  zone_changed = (zone) => {
    this.setState({ selected_zone: zone });
    this.props.fetchOrderItemAlternativePrice(zone.zoneid);
  };

  render() {
    const { t, config_values } = this.props;

    if (this.props.large) {
      return (
        <Card className="br-8 bordered ready-grey" style={{ height: '100%' }}>
          <CardHeader
            className="bordered ready-grey"
            style={{
              borderRadius: '0.5rem 0.5rem 0px 0px',
              height: '15%',
              borderBottom: '1px solid color-white',
            }}
          >
            {/*text-center makes columns be center in horizontal-way and align-items-center makes columns be center in vertical-way */}
            <Row className="text-center align-items-center">
              <Col xs={config_values?.ist_hide_compare_zone ? 6 : 4}>
                <h5 className="mb-0">
                  <div className="collapsed uppercase bold-size-1 color-white">
                    {t('lbl.extraInfo', 'Extra info')}
                  </div>
                </h5>
              </Col>
              <Col xs={config_values?.ist_hide_compare_zone ? 6 : 4}>
                <h5 className="mb-0">
                  <div className="collapsed uppercase bold-size-1 color-white">
                    {this.props.zone?.zonename}
                  </div>
                </h5>
              </Col>
              {!config_values?.ist_hide_compare_zone && (
                <Col xs={4}>
                  <h5 className="mb-0">
                    <Dropdown
                      toggle={this.toggleZones}
                      isOpen={this.state.toggleZonesOpen}
                    >
                      <DropdownToggle
                        caret
                        style={{
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.7rem',
                        }}
                      >
                        {this.state.selected_zone?.zonename}
                      </DropdownToggle>
                      <DropdownMenu>
                        {this.props.cache?.zones?.map((zone) => (
                          <DropdownItem
                            style={{ fontSize: '0.7rem' }}
                            key={zone.zoneid}
                            onClick={() => this.zone_changed(zone)}
                          >
                            {zone.zonename}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                  </h5>
                </Col>
              )}
            </Row>
          </CardHeader>

          <CardBody className="scroll" style={{ height: '20%' }}>
            <ExtrainfoTable forcePriceoptionLot />
          </CardBody>
        </Card>
      );
    } else {
      return (
        <Card className="br-8 bordered ready-grey" style={{ height: '100%' }}>
          <CustomScrollbars>
            <ExtrainfoTable forcePriceoptionLot />
          </CustomScrollbars>
        </Card>
      );
    }
  }
}

MobileExtraInfo.propTypes = propTypes;
MobileExtraInfo.defaultProps = defaultProps;

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
  connect(mapStateToProps, mapDispatchToProps)(MobileExtraInfo)
);
