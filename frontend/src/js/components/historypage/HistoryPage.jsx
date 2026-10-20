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
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { push } from 'connected-react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bindActionCreators } from 'redux';

import { TopBar, TopBarLeft } from 'js/components/layout/Containers';
import BootstrapTable from 'react-bootstrap-table-next';
import actions, { selectors } from 'js/redux/reducers/History';
import orderActions from 'js/redux/reducers/Order';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import { CustomScrollbars, rightToLeft, sortCarret } from 'js/mylib/Utils';
import { resizableGrid } from '../../mylib/ResizableTable';
import SearchInput from '../shared/SearchInput';
import { hasPrivilege } from '../../mylib/Privileges';
import cellEditFactory from 'react-bootstrap-table2-editor';
import CustomerModal from '../shared/CustomerModal';
import ErrorBoundary from '../shared/ErrorBoundaryModal';
import {
  cansizeNcansFormatter,
  colorFormatter,
  notesFormatter,
  orderIdItemIDFormatter,
  productnameBasecodeFormatter,
  siteDateTimeFormatter,
} from './HistoryFormatters';
import { selectors as configurationSelectors } from '../../redux/reducers/Configuration';
import customerActions from '../../redux/reducers/Customer';
import { incrementalDataType } from '../../redux/factories/ApiCall';
import { TextModal } from '../shared/TextModal';
import { offline_mode } from '../../Constants';
import { exportXLSXArray } from '../../mylib/Export';
import { CustomDatePicker } from '../shared/CustomDatePicker.jsx';

const propTypes = {
  t: PropTypes.func.isRequired,
  orderitems: incrementalDataType.isRequired,
  navigateTo: PropTypes.func.isRequired,
  searchOrderitems: PropTypes.func.isRequired,
  fetchOrderitem: PropTypes.func.isRequired,
  is_pro: PropTypes.bool,
  customer: PropTypes.object,
  history: PropTypes.object,
  config_values: PropTypes.object,
  applyCustomer: PropTypes.func.isRequired,
  loadCustomer: PropTypes.func.isRequired,
  sitemap: PropTypes.object,
};

const defaultProps = {};

class HistoryPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  orderClicked = (order) => {
    this.props.fetchOrderitem(order.itemid, false, order.zoneid);
  };

  getInitialState() {
    return {
      searched: false,
      formControls: {
        search: '',
        fromDate: '',
        toDate: '',
        onlyCustomFormulas: false,
        onlyLocalOrders: true,
        seek: null,
      },
      selectedOrderid: null,
      customer_modal_open: false,
      notes: null,
    };
  }

  componentDidMount() {
    // Apply column resize actions
    const table = document.getElementById('history_table');
    const parent = document.getElementById('table_holder');

    if (table) resizableGrid(table, parent);
  }

  goBack() {
    this.props.navigateTo('/');
  }

  startSearch = () => {
    const {
      search,
      fromDate,
      toDate,
      onlyCustomFormulas,
      onlyLocalOrders,
      seek,
    } = this.state.formControls;
    const { allow_hiding_orders } = this.props.config_values;
    this.props.searchOrderitems(
      search,
      fromDate,
      toDate,
      onlyCustomFormulas,
      onlyLocalOrders,
      seek ? JSON.stringify(seek) : null,
      !allow_hiding_orders
    );
  };

  changeHandler = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState((state) => ({
      formControls: { ...state.formControls, [name]: value, seek: null },
    }));
  };

  getScrollStyle = () => {
    const { orderitems } = this.props;

    return {
      height: 'calc(100vh - 19.375rem)',
      background: '#112E40',
      color: 'white',
      cursor: orderitems.pending ? 'progress' : 'pointer',
    };
  };

  reset = () => {
    this.setState(this.getInitialState());
  };

  handleAddCustomer = (orderid) => {
    if (orderid != null)
      this.setState({ selectedOrderid: orderid, customer_modal_open: true });
  };

  handleSaveCustomer = (customer) => {
    this.props.applyCustomer(
      this.state.selectedOrderid,
      customer,
      this.state.formControls
    );
  };

  customerFormatter = (cell, row) => {
    return row.customername ? (
      <div
        data-testid={'customer' + row.itemid}
        onClick={() => {
          this.props.loadCustomer(row.customerid);
          this.props.history.push({
            pathname: '/customer',
          });
        }}
      >
        {row.customername}
      </div>
    ) : (
      <Button
        data-testid={'customer' + row.itemid}
        className="btn-small p-0"
        onClick={() => {
          this.handleAddCustomer(row.orderid);
        }}
        data-denied={!hasPrivilege('history_edit_order')}
        disabled={!hasPrivilege('history_edit_order')}
      >
        {this.props.t('fn.addCustomer', 'Add customer')}
      </Button>
    );
  };

  exportHandle = () => {
    const { t, orderitems } = this.props;

    const data = [
      [
        t('lbl.itemID', 'Item ID'),
        t('lbl.orderDateTime', 'Order Date/Time'),
        t('lbl.modificationDateTime', 'Modification Date/Time'),
        t('lbl.colorCode', 'Color code'),
        t('lbl.colorName', 'Color name'),
        t('lbl.productName', 'Product name'),
        t('lbl.baseCode', 'Base code'),
        t('lbl.canSize', 'Can size'),
        t('lbl.lotSize', 'Lot size'),
        t('lbl.customerName', 'Customer name'),
      ],
    ];
    orderitems.data.forEach((orderitem) => {
      data.push([
        orderitem.itemid,
        orderitem.orderdate,

        orderitem.modificationdate,
        orderitem.colourcode,
        orderitem.colourname,
        orderitem.productname,
        orderitem.basecode,
        orderitem.cansizecode,
        orderitem.ncans,
        orderitem.customername,
      ]);
    });

    exportXLSXArray(data, 'history.xlsx');
  };

  handleScroll = (e) => {
    const bottom =
      Math.ceil(e.target.scrollTop) + e.target.clientHeight >=
      e.target.scrollHeight;
    if (bottom) {
      const { orderitems } = this.props;
      if (!orderitems.pending && !orderitems.at_end && !this.state.searched) {
        this.setState(
          (state) => ({
            searched: true,
            formControls: {
              ...state.formControls,
              seek: orderitems.next_seek,
            },
          }),
          this.startSearch
        );
      }
    } else {
      this.setState({ searched: false });
    }
  };

  hideCustomerModal = () => {
    this.setState({ customer_modal_open: false });
  };

  render() {
    const { t, orderitems, sitemap } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const optionSpacingStyle = {
      ...alignStyle,
      paddingLeft: isRtl ? 0 : '16px',
      paddingRight: isRtl ? '16px' : 0,
      marginLeft: isRtl ? 0 : '16px',
      marginRight: isRtl ? '16px' : 0,
    };
    const optionPaddingStyle = {
      ...alignStyle,
      paddingLeft: isRtl ? 0 : '16px',
      paddingRight: isRtl ? '16px' : 0,
    };
    const checkboxRowStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexDirection: isRtl ? 'row-reverse' : 'row',
    };
    const searchInputStyle = {
      ...alignStyle,
      borderRadius: isRtl ? '0.25rem 0 0 0.25rem' : '0 0.25rem 0.25rem 0',
    };
    const searchAddonStyle = {
      borderRadius: isRtl ? '0 0.25rem 0.25rem 0' : '0.25rem 0 0 0.25rem',
    };

    let curr = new Date();
    let maxDate = curr.toLocaleDateString('sv');

    const rowStyle = (row, rowIndex) => {
      const style = {
        textAlign: alignStyle.textAlign,
        direction,
      };
      if (this.state.selectedOrderid === rowIndex) {
        style.backgroundColor = 'lightBlue';
      }

      return style;
    };

    let data = orderitems.data || [];

    let columns = [
      {
        dataField: 'itemid',
        text: t('lbl.itemID', 'Item ID'),
        headerFormatter: (p, _, elem) => {
          return (
            <div>
              <strong>
                {t('lbl.orderID', 'Order ID')}
                <div style={{ fontWeight: 'normal' }}>
                  / {t('lbl.itemID', 'Item ID')}
                </div>
              </strong>

              {elem.sortElement}
            </div>
          );
        },
        attrs: (cell, row) => ({
          'data-testid': `history_item_id_${row.itemid}`,
        }),
        formatter: orderIdItemIDFormatter,
        sort: true,
        sortCaret: sortCarret,
        editable: false,
        events: {
          onClick: (e, column, columnIndex, row, rowIndex) => {
            this.setState({ selectedOrderid: rowIndex });
            this.orderClicked(row);
          },
        },
      },
      {
        dataField: 'orderdate',
        headerFormatter: (p, _, elem) => {
          return (
            <div>
              <strong>
                {t('lbl.dateTime', 'Date/Time')}
                <div style={{ fontWeight: 'normal' }}>
                  / {t('lbl.site', 'Site')}
                </div>
              </strong>

              {elem.sortElement}
            </div>
          );
        },

        formatter: (cell, row) => siteDateTimeFormatter(cell, row, sitemap),
        sort: true,
        sortCaret: sortCarret,
        editable: false,
        events: {
          onClick: (e, column, columnIndex, row, rowIndex) => {
            this.setState({ selectedOrderid: rowIndex });
            this.orderClicked(row);
          },
        },
      },

      {
        dataField: 'colourcode',
        text: t('lbl.colorCode', 'Color code'),
        headerFormatter: (p, _, elem) => {
          return (
            <div>
              <strong>{t('lbl.colorCode', 'Color code')}</strong>
              <br />
              <strong>{t('lbl.colorName', 'Color name')}</strong>
              {elem.sortElement}
            </div>
          );
        },
        formatter: colorFormatter,
        sort: true,
        sortCaret: sortCarret,
        style: {
          overflow: 'hidden',
        },
        editable: false,
        events: {
          onClick: (e, column, columnIndex, row, rowIndex) => {
            this.setState({ selectedOrderid: rowIndex });
            this.orderClicked(row);
          },
        },
      },

      {
        dataField: 'productname',
        text: t('lbl.productName', 'Product name'),
        headerFormatter: (p, _, elem) => {
          return (
            <div>
              <strong>{t('lbl.productName', 'Product name')}</strong>
              <br />
              <strong>{t('lbl.baseCode', 'Base code')}</strong>
              {elem.sortElement}
            </div>
          );
        },
        sort: true,
        formatter: productnameBasecodeFormatter,
        sortCaret: sortCarret,
        editable: false,
        events: {
          onClick: (e, column, columnIndex, row, rowIndex) => {
            this.setState({ selectedOrderid: rowIndex });
            this.orderClicked(row);
          },
        },
      },

      {
        dataField: 'cansizecode',
        text: t('lbl.canSize', 'Can size'),
        headerFormatter: (p, _, elem) => {
          return (
            <div>
              <strong>{t('lbl.canSize', 'Can size')}</strong>
              <br />
              <strong>{t('lbl.lotSize', 'Lot size')}</strong>
              {elem.sortElement}
            </div>
          );
        },
        sort: true,
        formatter: cansizeNcansFormatter,
        sortCaret: sortCarret,
        editable: false,
        events: {
          onClick: (e, column, columnIndex, row, rowIndex) => {
            this.setState({ selectedOrderid: rowIndex });
            this.orderClicked(row);
          },
        },
      },
      {
        dataField: 'itemnotes',
        text: t('lbl.notes', 'Notes'),
        sort: true,
        sortCaret: sortCarret,
        editable: false,
        formatter: (cell, row) => {
          return notesFormatter(row.notes, row.itemnotes, (n) =>
            this.setState({ notes: n })
          );
        },
        events: {
          onClick: (e, column, columnIndex, row, rowIndex) => {
            this.setState({ selectedOrderid: rowIndex });
            this.orderClicked(row);
          },
        },
      },
    ];

    if (hasPrivilege('history_view_customer')) {
      columns.push({
        dataField: 'customername',
        text: t('lbl.customerName', 'Customer name'),
        sort: true,
        hidden: !this.props.is_pro,
        sortCaret: sortCarret,
        formatter: this.customerFormatter,
        editable: false,
      });
    }

    columns = columns.map((column) => ({
      ...column,
      headerStyle: { ...alignStyle, ...(column.headerStyle || {}) },
      style: { ...alignStyle, ...(column.style || {}) },
    }));

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
        <TopBar>
          <TopBarLeft>
            <h2
              data-testid="historyPageBackButton"
              className="clickable-text directly-over-bg mt-8"
              onClick={() => this.goBack()}
            >
              <FontAwesomeIcon
                icon={isRtl ? 'arrow-right' : 'arrow-left'}
                style={{ fontSize: '1.7rem' }}
              />{' '}
              {t('fn.history', 'History')}
            </h2>
          </TopBarLeft>
        </TopBar>
        <Container className="justify-content-center" style={alignStyle}>
          <Row style={alignStyle}>
            <Col xs="3" className="p-0">
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
                  value={this.state.formControls.search}
                  onChange={(e) =>
                    this.setState((state) => ({
                      formControls: {
                        ...state.formControls,
                        search: e.target.value,
                        seek: null,
                      },
                    }))
                  }
                  placeholder={t('prompt.search', 'Search')}
                  onKeyUp={(e) =>
                    e.key === 'Enter' ? this.startSearch() : null
                  }
                />
              </InputGroup>
            </Col>
            <Col xs="3" className="p-0">
              {/* From date */}
              <CustomDatePicker
                prefix={t('lbl.from.colon', 'From:')}
                id="fromDate"
                selected={this.state.formControls.fromDate}
                onChange={(date) =>
                  this.setState((pre) => {
                    return {
                      formControls: {
                        ...pre.formControls,
                        fromDate: date,
                      },
                    };
                  })
                }
                maxDate={maxDate}
                direction={direction}
              />
            </Col>
            <Col xs="3" className="p-0">
              {/* To date */}

              <CustomDatePicker
                id="toDate"
                prefix={t('lbl.to.colon', 'To:')}
                selected={this.state.formControls.toDate}
                onChange={(date) =>
                  this.setState((pre) => {
                    return {
                      formControls: {
                        ...pre.formControls,
                        toDate: date,
                      },
                    };
                  })
                }
                minDate={this.state.formControls.fromDate}
                maxDate={maxDate}
                direction={direction}
              />
            </Col>

            <Col xs="3" style={alignStyle}>
              <InputGroup className="p-0">
                <Button
                  onClick={this.startSearch}
                  className="btn-small"
                  data-testid="load"
                >
                  {t('fn.load', 'Load')}
                </Button>
              </InputGroup>
            </Col>
          </Row>

          <Row style={alignStyle}>
            {/* Options row */}
            <Col
              xs="4"
              className="pt-8 directly-over-bg"
              style={optionSpacingStyle}
            >
              <div style={checkboxRowStyle}>
                <Input
                  type="checkbox"
                  name="onlyCustomFormulas"
                  id="onlyCustomFormulas"
                  data-testid="onlyCustomFormulas"
                  checked={this.state.formControls.onlyCustomFormulas}
                  onChange={() =>
                    this.setState(
                      (state) => ({
                        formControls: {
                          ...state.formControls,
                          onlyCustomFormulas:
                            !state.formControls.onlyCustomFormulas,
                          seek: null,
                        },
                      }),
                      this.startSearch
                    )
                  }
                />
                <Label
                  for="onlyCustomFormulas"
                  check
                  className="white-nowrap"
                  style={alignStyle}
                >
                  {t('lbl.customOnly', 'Custom formulas only')}
                </Label>
              </div>
            </Col>
            <Col
              xs="3"
              className="pt-8 directly-over-bg"
              style={optionPaddingStyle}
            >
              <div style={checkboxRowStyle}>
                <Input
                  type="checkbox"
                  name="onlyLocalOrders"
                  id="onlyLocalOrders"
                  data-testid="onlyLocalOrders"
                  checked={this.state.formControls.onlyLocalOrders}
                  onChange={() =>
                    this.setState(
                      (state) => ({
                        formControls: {
                          ...state.formControls,
                          onlyLocalOrders: !state.formControls.onlyLocalOrders,
                          seek: null,
                        },
                      }),
                      this.startSearch
                    )
                  }
                />
                <Label
                  for="onlyLocalOrders"
                  check
                  className="white-nowrap"
                  style={alignStyle}
                >
                  {t('lbl.localOrdersOnly', 'Local orders only')}
                </Label>
              </div>
            </Col>
            <Col
              xs="2"
              className="directly-over-bg"
              style={optionPaddingStyle}
            />
            <Col />
          </Row>
          <Row style={alignStyle}>
            {/* Actual history table */}
            <>
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                }}
              >
                <Button
                  data-testid="export"
                  data-denied={!hasPrivilege('export')}
                  disabled={!hasPrivilege('export')}
                  onClick={this.exportHandle}
                  style={{
                    width: '20%',
                    marginBottom: '10px',
                  }}
                >
                  {t('fn.export', 'Export')}
                </Button>
                {this.props.is_pro && !offline_mode && (
                  <Button
                    data-testid="statistics"
                    data-denied={!hasPrivilege('detailed_stats')}
                    disabled={!hasPrivilege('detailed_stats')}
                    onClick={() => this.props.navigateTo('/statistics')}
                    style={{ width: '20%', marginBottom: '10px' }}
                  >
                    {t('cfg.h_statistics')}
                  </Button>
                )}
              </div>
              <CustomScrollbars
                id="table_holder"
                className="br-8 fixed-table-header cursor-pointer"
                style={{ ...this.getScrollStyle(), ...alignStyle, direction }}
                ref={this.scrollbars}
                onScroll={this.handleScroll}
              >
                <BootstrapTable
                  keyField="itemid"
                  id="history_table"
                  hover
                  data={data}
                  columns={columns}
                  noDataIndication={() =>
                    orderitems.error || orderitems.pending
                      ? t('msg.searching.ellipsis', 'Searching...')
                      : orderitems.params
                        ? t('lbl.noHistory', 'No history')
                        : t(
                            'lbl.clickLoadForHistory',
                            'Click Load to see order history'
                          )
                  }
                  rowStyle={rowStyle}
                  cellEdit={cellEditFactory({
                    mode: 'click',
                    blurToSave: true,
                    afterSaveCell: this.handleApplyCustomer,
                  })}
                />
              </CustomScrollbars>
              <ErrorBoundary>
                <CustomerModal
                  show={this.state.customer_modal_open}
                  toggleShow={this.hideCustomerModal}
                  onSave={this.handleSaveCustomer}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <TextModal
                  header={t('lbl.notes', 'Notes')}
                  text={this.state.notes}
                  onClose={() => this.setState({ notes: null })}
                />
              </ErrorBoundary>
            </>
          </Row>
        </Container>
      </div>
    );
  }
}

HistoryPage.propTypes = propTypes;
HistoryPage.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    orderitems: selectors.orderitems(state),
    is_pro: protectionSelectors.is_pro(state),
    config_values: configurationSelectors.config_values(state),
    customer: state.customer,
    sitemap: state.cache.sitemap,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      searchOrderitems: actions.searchOrderitems,
      fetchOrderitem: orderActions.fetchOrderitem,
      applyCustomer: orderActions.applyCustomer,
      loadCustomer: customerActions.loadCustomer,
      navigateTo: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(HistoryPage)
);
