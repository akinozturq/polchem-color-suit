import React from 'react';
import {
  Button,
  Col,
  Container,
  Input,
  InputGroup,
  InputGroupAddon,
  Label,
  Row,
} from 'reactstrap';
import { exportXLSXArray } from '../../mylib/Export';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bindActionCreators } from 'redux';

import { TopBar, TopBarLeft } from 'js/components/layout/Containers';

import actions, { propType as customerType } from 'js/redux/reducers/Customer';

import { hasPrivilege } from '../../mylib/Privileges';
import SearchInput from '../shared/SearchInput';
import CustomerSearchTable from './CustomerSearchTable';
import { rightToLeft } from '../../mylib/Utils';

const propTypes = {
  t: PropTypes.func.isRequired,
  customer: customerType,
  searchCustomers: PropTypes.func.isRequired,
  location: PropTypes.object,
};

const defaultProps = {};

class CustomerSearchPage extends React.Component {
  initialState = { search: '', only_local_customers: false };

  constructor(props) {
    super(props);

    this.state = this.initialState;
  }

  selectCustomer = () => {
    // this.setState({ customer: customer });
    // // Search customer order history
    // this.startOrderSearch(this.state.formControls, customer);
  };

  componentDidMount() {
    this.startSearch();
  }

  componentDidUpdate(prevProps, prevState) {
    const { search } = this.state;
    if (search !== prevState.search) {
      this.startSearch();
    }
  }

  goBack = () => {
    window.history.back();
  };

  startSearch() {
    const { search, only_local_customers } = this.state;
    this.props.searchCustomers(search, 0, only_local_customers);
  }

  reset = () => {
    this.setState(this.initialState);
  };

  exportHandle = () => {
    const { t, customer } = this.props;
    const data = [
      [
        t('lbl.customerName', 'Customer name'),
        t('lbl.companyName', 'Company name'),
        t('lbl.address', 'Address'),
        t('lbl.email', 'Email'),
        t('lbl.phone', 'Phone'),
        t('lbl.zipCode', 'Zip code'),
      ],
    ];

    customer.search_results.data.customers.forEach((customer) => {
      data.push([
        customer.customername,
        customer.companyname,
        customer.address1,
        customer.email,
        customer.phone,
        customer.postcode,
      ]);
    });

    exportXLSXArray(data, 'customers.xlsx');
  };

  render() {
    const { t } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const searchInputStyle = {
      ...alignStyle,
      borderRadius: isRtl ? '0.25rem 0 0 0.25rem' : '0 0.25rem 0.25rem 0',
    };
    const searchAddonStyle = {
      borderRadius: isRtl ? '0 0.25rem 0.25rem 0' : '0.25rem 0 0 0.25rem',
    };
    const checkboxRowStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexDirection: isRtl ? 'row-reverse' : 'row',
    };

    return (
      <div className={'zoom-in'} dir={direction}>
        <>
          <TopBar>
            <TopBarLeft>
              <h2
                id="backToHomePage"
                className="clickable-text directly-over-bg mt-8"
                onClick={this.goBack}
              >
                <FontAwesomeIcon
                  icon={isRtl ? 'arrow-right' : 'arrow-left'}
                  style={{ fontSize: '1.7rem' }}
                />{' '}
                <span>{t('lbl.customers', 'Customers')}</span>
              </h2>
            </TopBarLeft>
          </TopBar>
          <Container className="justify-content-center" style={alignStyle}>
            <Row>
              <Col xs="3" className="p-0 mb-40">
                {/* Search field */}
                <InputGroup
                  className={`p-0 ${isRtl ? 'pl-16' : 'pr-16'}`}
                  style={{ direction }}
                >
                  <InputGroupAddon addonType={isRtl ? 'append' : 'prepend'}>
                    <span className="input-small-text" style={searchAddonStyle}>
                      <FontAwesomeIcon icon="search" />
                    </span>
                  </InputGroupAddon>

                  <SearchInput
                    id="search"
                    className="form-control input-small"
                    use_default_style={false}
                    dir={direction}
                    style={searchInputStyle}
                    value={this.state.search}
                    onChange={(e) =>
                      this.setState({
                        search: e.target.value,
                      })
                    }
                    placeholder={t('prompt.search', 'Search')}
                  />
                </InputGroup>
              </Col>
              <Col xs={2} style={alignStyle}>
                <div style={checkboxRowStyle}>
                  <Input
                    type="checkbox"
                    name="onlyLocalCustomers"
                    id="onlyLocalCustomers"
                    data-testid="onlyLocalCustomers"
                    checked={this.state.only_local_customers}
                    onChange={() =>
                      this.setState(
                        (state) => ({
                          only_local_customers: !state.only_local_customers,
                        }),
                        this.startSearch
                      )
                    }
                  />
                  <Label
                    for="onlyLocalCustomers"
                    check
                    className="white-nowrap"
                    style={alignStyle}
                  >
                    {t('lbl.localCustomersOnly', 'Local customers only')}
                  </Label>
                </div>
              </Col>
            </Row>
            <Row>
              <Col xs="2">
                <Button
                  data-testid="export"
                  data-denied={!hasPrivilege('export')}
                  disabled={!hasPrivilege('export')}
                  onClick={this.exportHandle}
                  style={{
                    width: '100%',
                    marginBottom: '10px',
                  }}
                >
                  {t('fn.export')}
                </Button>
              </Col>
            </Row>
            <Row style={{ height: 'calc(100vh - 20.375rem)' }}>
              <CustomerSearchTable />
            </Row>
          </Container>
        </>
      </div>
    );
  }
}

CustomerSearchPage.propTypes = propTypes;
CustomerSearchPage.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    customer: state.customer,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      searchCustomers: actions.searchCustomers,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CustomerSearchPage)
);
