import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ErrorBoundary from '../shared/ErrorBoundaryModal';
import { bindActionCreators } from 'redux';
import historyActions, {
  selectors as historySelectors,
} from 'js/redux/reducers/History';

import { rightToLeft, sortCarret } from 'js/mylib/Utils';
import {
  cansizeNcansFormatter,
  colorFormatter,
  notesFormatter,
  orderIdItemIDFormatter,
  productnameBasecodeFormatter,
  siteDateTimeFormatter,
} from '../historypage/HistoryFormatters';
import { TextModal } from '../shared/TextModal';
import ScrollTable from './ScrollTable';
import { incrementalDataType } from '../../redux/factories/ApiCall';

const propTypes = {
  t: PropTypes.func.isRequired,
  customer_orderitems: incrementalDataType,
  searchCustomerOrderitems: PropTypes.func.isRequired,
  multiSelect: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func,
  sitemap: PropTypes.object,
};

const defaultProps = {};

class CustomerHistoryTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = { notes: null };
  }

  fetchMore = () => {
    const { customer_orderitems } = this.props;
    const { next_seek } = customer_orderitems;
    if (next_seek && !customer_orderitems.pending) {
      const { search, start_date, end_date, custom_only, customerid } =
        customer_orderitems.params;
      this.props.searchCustomerOrderitems(
        search,
        start_date,
        end_date,
        custom_only,
        false, //local_only
        customerid,
        next_seek
      );
    }
  };

  render() {
    const { t, customer_orderitems, multiSelect, sitemap } = this.props;
    const history_data = customer_orderitems.data;
    const isRtl = rightToLeft();
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };

    const history_selectRowProp = multiSelect
      ? {
          mode: 'checkbox',
          clickToSelect: true,
          hideSelectColumn: false,
          bgColor: 'lightblue',
          onSelect: this.props.onSelect,
          onSelectAll: this.props.onSelectAll,
        }
      : {
          mode: 'radio',
          clickToSelect: true,
          hideSelectColumn: true,
          bgColor: 'lightblue',
          onSelect: this.props.onSelect,
        };

    const history_columns = [
      {
        dataField: 'itemid',
        text: '',
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
        formatter: orderIdItemIDFormatter,
        sort: true,
        sortCaret: sortCarret,
      },
      {
        dataField: 'orderdate',
        formatter: (cell, row) => siteDateTimeFormatter(cell, row, sitemap),
        sort: true,
        sortCaret: sortCarret,
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

        formatter: productnameBasecodeFormatter,
        sort: true,
        sortCaret: sortCarret,
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
        formatter: cansizeNcansFormatter,
        sort: true,
        sortCaret: sortCarret,
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
      },
    ];

    const aligned_columns = history_columns.map((column) => ({
      ...column,
      headerStyle: { ...alignStyle, ...(column.headerStyle || {}) },
      style: { ...alignStyle, ...(column.style || {}) },
    }));

    return (
      <>
        <ScrollTable
          fetchMore={this.fetchMore}
          data={history_data}
          columns={aligned_columns}
          keyField={'itemid'}
          noDataIndication={() =>
            customer_orderitems.error || customer_orderitems.pending
              ? t('msg.searching.ellipsis', 'Searching...')
              : customer_orderitems.params
                ? t('lbl.noHistory', 'No history')
                : t(
                    'lbl.clickLoadForHistory',
                    'Click Load to see order history'
                  )
          }
          selectRow={history_selectRowProp}
        />
        <ErrorBoundary>
          <TextModal
            header={t('lbl.notes', 'Notes')}
            text={this.state.notes}
            onClose={() => this.setState({ notes: null })}
          />
        </ErrorBoundary>
      </>
    );
  }
}

CustomerHistoryTable.propTypes = propTypes;
CustomerHistoryTable.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    customer_orderitems: historySelectors.customer_orderitems(state),
    sitemap: state.cache.sitemap,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      searchCustomerOrderitems: historyActions.searchCustomerOrderitems,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CustomerHistoryTable)
);
