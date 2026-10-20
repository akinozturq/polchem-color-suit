import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import PropTypes from 'prop-types';
import ErrorBoundary from '../shared/ErrorBoundaryModal';
import { bindActionCreators } from 'redux';

import actions, { propType as customerType } from 'js/redux/reducers/Customer';

import { rightToLeft, sortCarret } from 'js/mylib/Utils';
import { notesFormatter } from '../historypage/HistoryFormatters';
import { TextModal } from '../shared/TextModal';
import ScrollTable from './ScrollTable';

const propTypes = {
  t: PropTypes.func.isRequired,
  customer: customerType,
  searchCustomers: PropTypes.func.isRequired,
  selectCustomer: PropTypes.func.isRequired,
  navigateTo: PropTypes.func.isRequired,
  location: PropTypes.object,

  sitemap: PropTypes.object,
};

const defaultProps = {};

class CustomerSearchTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = { notes: null };
  }

  selectCustomer = (customer) => {
    this.props.selectCustomer(customer);
    this.props.navigateTo('/customer');
  };

  fetchMore = () => {
    const { search_results } = this.props.customer;
    if (
      !search_results.pending &&
      search_results.data &&
      !search_results.data?.at_end
    ) {
      this.props.searchCustomers(
        search_results.params.search,
        search_results.data.page + 1
      );
    }
  };

  render() {
    const {
      t,
      customer: { search_results },
      sitemap,
    } = this.props;
    const isRtl = rightToLeft();
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };
    const customer_data = search_results.data?.customers || [];
    const search = search_results.params?.search;

    const customer_selectRowProp = {
      mode: 'radio',
      clickToSelect: true,
      hideSelectColumn: true,
      bgColor: 'lightblue',
      onSelect: this.selectCustomer,
      selected: [''],
    };

    const match_search = (cell) => {
      if (cell && search && cell.includes(search)) {
        return 'cell-search-match';
      }
    };

    const customer_columns = [
      {
        dataField: 'customername',
        sort: true,
        sortCaret: sortCarret,
        classes: match_search,
        headerFormatter: (p, _, elem) => {
          return (
            <div>
              <strong>
                {t('lbl.customerName', 'Customer name')}
                <div style={{ fontWeight: 'normal' }}>
                  / {t('lbl.site', 'Site')}
                </div>
              </strong>

              {elem.sortElement}
            </div>
          );
        },
        formatter: (cell, row) => {
          return (
            <div>
              {row.customername}
              <br />
              {sitemap.get(row.siteid)?.sitename || row.siteid}
            </div>
          );
        },
      },
      {
        dataField: 'companyname',
        text: t('lbl.companyName', 'Company name'),
        sort: true,
        sortCaret: sortCarret,
        classes: match_search,
      },
      {
        dataField: 'address1',
        text: t('lbl.address', 'Address'),
        sort: true,
        sortCaret: sortCarret,
      },
      {
        dataField: 'email',
        text: t('lbl.email', 'Email'),
        sort: true,
        sortCaret: sortCarret,
        classes: match_search,
      },
      {
        dataField: 'phone',
        text: t('lbl.phone', 'Phone'),
        sort: true,
        sortCaret: sortCarret,
        classes: match_search,
      },
      {
        dataField: 'postcode',
        text: t('lbl.zipCode', 'Zip code'),
        sort: true,
        sortCaret: sortCarret,
      },
      {
        dataField: 'customernotes',
        text: t('lbl.customerNotes', 'Customer notes'),
        sort: true,
        sortCaret: sortCarret,
        formatter: (cell) => {
          return notesFormatter(cell, null, (n) => this.setState({ notes: n }));
        },
      },
    ];

    const aligned_columns = customer_columns.map((column) => ({
      ...column,
      headerStyle: { ...alignStyle, ...(column.headerStyle || {}) },
      style: { ...alignStyle, ...(column.style || {}) },
    }));

    return (
      <>
        <ScrollTable
          data={customer_data}
          columns={aligned_columns}
          keyField={'customerid'}
          noDataIndication={() =>
            search_results.error || search_results.pending
              ? t('msg.searching.ellipsis', 'Searching...')
              : t('lbl.noCustomers', 'No customers')
          }
          selectRow={customer_selectRowProp}
          fetchMore={this.fetchMore}
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

CustomerSearchTable.propTypes = propTypes;
CustomerSearchTable.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    customer: state.customer,
    sitemap: state.cache.sitemap,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      searchCustomers: actions.searchCustomers,
      selectCustomer: actions.selectCustomer,
      navigateTo: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CustomerSearchTable)
);
