import React from 'react';
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  InputGroup,
  InputGroupAddon,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import { exportXLSXArray } from '../../mylib/Export';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ErrorBoundary from '../shared/ErrorBoundaryModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bindActionCreators } from 'redux';

import { TopBar, TopBarLeft } from 'js/components/layout/Containers';
import historyActions, {
  propType as historyType,
} from 'js/redux/reducers/History';

import customerActions, {
  propType as customerType,
  selectors as customerSelectors,
} from 'js/redux/reducers/Customer';
import orderActions from 'js/redux/reducers/Order';

import CustomerModal from '../shared/CustomerModal';
import { hasPrivilege } from '../../mylib/Privileges';
import { rightToLeft, spinner } from '../../mylib/Utils';
import MoveCustomerOrder from './MoveCustomerOrder';
import SearchInput from '../shared/SearchInput';
import CustomerHistoryTable from './CustomerHistoryTable';
import { offline_mode } from '../../Constants';
import { CustomDatePicker } from '../shared/CustomDatePicker.jsx';

const propTypes = {
  t: PropTypes.func.isRequired,
  customer: customerType,
  selected_customer: PropTypes.object,
  customer_pending: PropTypes.bool,
  ordersHistory: historyType.isRequired,
  loadCustomer: PropTypes.func.isRequired,
  saveCustomer: PropTypes.func.isRequired,
  selectCustomer: PropTypes.func.isRequired,
  searchCustomerOrderitems: PropTypes.func.isRequired,
  clearCustomerOrderitems: PropTypes.func.isRequired,
  fetchOrderitem: PropTypes.func.isRequired,
  deleteCustomer: PropTypes.func.isRequired,
  location: PropTypes.object,
};

const defaultProps = {};

class CustomerPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getInitialState();
  }

  componentWillUnmount() {
    this.props.clearCustomerOrderitems();
  }

  showCustomerModal = () => {
    this.setState((state) => ({
      customer_modal_open: !state.customer_modal_open,
    }));
  };

  handleToggleDeleteModal = () => {
    this.setState((prevState) => ({
      show_delete_modal: !prevState.show_delete_modal,
    }));
  };

  handleDeleteCustomer = () => {
    this.props.deleteCustomer(this.props.selected_customer);
    this.props.selectCustomer(null);
    this.setState({ show_delete_modal: false });
  };

  getCustomerCard = () => {
    const isRtl = rightToLeft();
    let style = {
      position: ' relative',
      padding: 0,
      background: ' transparent',
      display: 'flex',
      flexDirection: isRtl ? 'row-reverse' : 'row',
    };

    const { selected_customer } = this.props;
    return (
      <Card style={style}>
        <CardBody
          className="scroll"
          style={{
            color: 'black',
            background: 'white',
            fontWeight: '800',
            alignItems: 'center',
            borderRadius: '0.5rem',
            width: '50%',
            marginRight: '1em',
            marginLeft: '1em',
            padding: '0.5rem',
            maxHeight: '8rem',
            textAlign: isRtl ? 'right' : 'left',
            direction: isRtl ? 'rtl' : 'ltr',
          }}
        >
          <div data-testid="card-customername">
            {selected_customer?.customername}
          </div>
          <div data-testid="card-companyname">
            {selected_customer?.companyname}
          </div>
        </CardBody>
        <Button
          data-cy={'fn.edit_customer'}
          disabled={!hasPrivilege('history_edit_customer')}
          data-denied={!hasPrivilege('history_edit_customer')}
          key="pencel"
          className="btn btn-primary btn-left btn-top"
          onClick={this.showCustomerModal}
        >
          <FontAwesomeIcon icon="pencil-alt" />
        </Button>
        {/* disabled={!hasPrivilege('history_move_customer')}
          data-denied={!hasPrivilege('history_move_customer')}*/}
        <Button
          key="move"
          data-testid="move-orders"
          className="btn btn-primary btn-left btn-top"
          onClick={() => {
            this.setState({ show_move_orders: true });
          }}
        >
          <FontAwesomeIcon icon="arrow-down" />
        </Button>
        <Button
          disabled={!hasPrivilege('history_delete_customer')}
          data-denied={!hasPrivilege('history_delete_customer')}
          key="trash"
          className="btn btn-primary btn-left btn-top"
          onClick={this.handleToggleDeleteModal}
        >
          <FontAwesomeIcon icon="trash-alt" />
        </Button>
      </Card>
    );
  };

  handleSave = (customer) => {
    this.props.saveCustomer(customer);
    this.props.selectCustomer(customer);
  };

  startCustomerOrderSearch = () => {
    const customerid = this.props.selected_customer?.customerid;
    if (customerid) {
      const {
        history_search,
        history_fromDate,
        history_toDate,
        onlyCustomFormulas,
        history_seek,
      } = this.state.formControls;
      this.props.searchCustomerOrderitems(
        history_search,
        history_fromDate,
        history_toDate,
        onlyCustomFormulas,
        false, //local_only
        customerid,
        history_seek
      );
    }
  };

  getInitialState() {
    return {
      formControls: {
        history_search: '',
        history_fromDate: '',
        history_toDate: '',
        history_seek: null,
        onlyCustomFormulas: false,
      },
      customer_modal_open: false,
      history_searched: false,
      show_delete_modal: false,
      show_move_orders: false,
    };
  }

  setShowMoveOrders = (flag) => this.setState({ show_move_orders: flag });

  orderClicked = (order) => {
    this.props.fetchOrderitem(order.itemid, false, order.zoneid);
  };

  goBack = () => {
    window.history.back();
  };

  changeHandler = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState((state) => ({
      formControls: { ...state.formControls, [name]: value },
    }));
  };

  reset = () => {
    this.setState(this.getInitialState());
  };

  exportHandle = () => {
    const { t, ordersHistory } = this.props;
    const data = [
      [
        t('lbl.itemID', 'Item ID'),
        t('lbl.dateTime', 'Date/Time'),
        t('lbl.colorCode', 'Color code'),
        t('lbl.colorName', 'Color name'),
        t('lbl.productName', 'Product name'),
        t('lbl.baseCode', 'Base code'),
        t('lbl.canSize', 'Can size'),
        t('lbl.lotSize', 'Lot size'),
        t('lbl.customerName', 'Customer name'),
      ],
    ];

    ordersHistory.customer_orderitems.data.forEach((item) => {
      data.push([
        item.itemid,
        item.orderdate,
        item.colourcode,
        item.colourname,
        item.productname,
        item.basecode,
        item.cansizecode,
        item.ncans,
        item.customername,
      ]);
    });

    exportXLSXArray(data, 'customerhistory.xlsx');
  };

  render() {
    const { t, selected_customer, customer_pending } = this.props;
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

    let curr = new Date();
    let maxDate = curr.toLocaleDateString('sv');

    return (
      <div className={'zoom-in'} dir={direction}>
        {offline_mode && (
          <div className="offline_info_text">
            {t(
              'lbl.only_orders_in_offline_mode',
              'Only orders made in offline mode'
            )}
          </div>
        )}
        <Modal centered isOpen={this.state.show_delete_modal}>
          <ModalHeader>
            {t('fn.delete_customer', 'Delete customer')}
          </ModalHeader>
          <ModalBody>
            {t(
              'lbl.are_you_sure_customer',
              'Are you sure want to delete this customer ?'
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={this.handleDeleteCustomer}>
              {t('fn.delete', 'Delete')}
            </Button>
            <Button onClick={this.handleToggleDeleteModal}>
              {t('fn.cancel', 'Cancel')}
            </Button>
          </ModalFooter>
        </Modal>
        {this.state.show_move_orders ? (
          <MoveCustomerOrder setShowMoveOrders={this.setShowMoveOrders} />
        ) : (
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
                  <span>{selected_customer?.customername || ''}</span>
                </h2>
              </TopBarLeft>
            </TopBar>
            {customer_pending ? (
              spinner()
            ) : (
              <Container className="justify-content-center" style={alignStyle}>
                <Row>
                  <Col xs="3" className="p-0 mb-40">
                    {/* Search field */}
                    <InputGroup
                      className={`p-0 ${isRtl ? 'pl-16' : 'pr-16'}`}
                      style={{ direction }}
                    >
                      <InputGroupAddon addonType={isRtl ? 'append' : 'prepend'}>
                        <span
                          className="input-small-text"
                          style={searchAddonStyle}
                        >
                          <FontAwesomeIcon icon="search" />
                        </span>
                      </InputGroupAddon>
                      <SearchInput
                        id="search"
                        className="form-control input-small"
                        use_default_style={false}
                        dir={direction}
                        style={searchInputStyle}
                        value={this.state.formControls.history_search}
                        onChange={(e) =>
                          this.setState((state) => ({
                            formControls: {
                              ...state.formControls,
                              history_search: e.target.value,
                              seek: null,
                            },
                          }))
                        }
                        onKeyUp={(e) =>
                          e.key === 'Enter'
                            ? this.startCustomerOrderSearch()
                            : null
                        }
                        placeholder={t('prompt.search', 'Search')}
                      />
                    </InputGroup>
                  </Col>
                  <Col xs="2" className="p-0">
                    {/* To date */}
                    <CustomDatePicker
                      prefix={t('lbl.to.colon', 'To:')}
                      selected={this.state.formControls.history_toDate}
                      onChange={(date) =>
                        this.setState((pre) => {
                          return {
                            formControls: {
                              ...pre.formControls,
                              history_toDate: date,
                            },
                          };
                        })
                      }
                      maxDate={maxDate}
                      direction={direction}
                    />
                  </Col>
                  <Col xs="2" className="">
                    <Button
                      onClick={this.startCustomerOrderSearch}
                      className="btn-small"
                      data-testid="load"
                    >
                      {t('fn.load', 'Load')}
                    </Button>
                  </Col>
                  <Col xs="5" className="p-0">
                    {this.getCustomerCard()}
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
                  <Col
                    className="pt-8 clickable-text directly-over-bg"
                    style={{
                      ...alignStyle,
                      paddingLeft: isRtl ? 0 : '20px',
                      paddingRight: isRtl ? '20px' : 0,
                      marginLeft: isRtl ? 0 : '16px',
                      marginRight: isRtl ? '16px' : 0,
                    }}
                  >
                    <div style={checkboxRowStyle}>
                      <Input
                        type="checkbox"
                        id="customFormulasOnly"
                        name="onlyCustomFormulas"
                        checked={this.state.formControls.onlyCustomFormulas}
                        onChange={this.changeHandler}
                      />
                      <Label for="customFormulasOnly" check>
                        {t('lbl.customOnly', 'Custom formulas only')}
                      </Label>
                    </div>
                  </Col>
                </Row>
                <Row style={{ height: 'calc(100vh - 20.375rem)' }}>
                  {/* Actual customer table */}
                  <CustomerHistoryTable onSelect={this.orderClicked} />
                </Row>
              </Container>
            )}
            <ErrorBoundary>
              <CustomerModal
                show={this.state.customer_modal_open}
                allowSearch={false}
                onSave={this.handleSave}
                selectedCustomer={selected_customer}
                toggleShow={this.showCustomerModal}
              />
            </ErrorBoundary>
          </>
        )}
      </div>
    );
  }
}

CustomerPage.propTypes = propTypes;
CustomerPage.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    selected_customer: customerSelectors.selected_customer(state),
    customer_pending: customerSelectors.selected_customer_pending(state),
    ordersHistory: state.history,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      loadCustomer: customerActions.loadCustomer,
      selectCustomer: customerActions.selectCustomer,
      saveCustomer: customerActions.saveCustomer,
      searchCustomerOrderitems: historyActions.searchCustomerOrderitems,
      clearCustomerOrderitems: historyActions.clearCustomerOrderitems,
      fetchOrderitem: orderActions.fetchOrderitem,
      deleteCustomer: orderActions.deleteCustomer,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CustomerPage)
);
