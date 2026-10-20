import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import {
  currency_formatter,
  CustomScrollbars,
  sortCarret,
} from '../../mylib/Utils';
import filterFactory, {
  numberFilter,
  selectFilter,
  textFilter,
} from 'react-bootstrap-table2-filter';
import BootstrapTable from 'react-bootstrap-table-next';

import PropTypes from 'prop-types';
import _ from 'lodash';

import { Button } from 'reactstrap';
import { hasPrivilege } from '../../mylib/Privileges';
import { fitToColumn } from '../../mylib/Export';

class StatisticsData extends Component {
  getISOWeekdays = () => {
    const { t } = this.props;

    // Memoize the weekday map based on the current translation function.
    return {
      1: t('lbl.weekday.1', 'Monday'),
      2: t('lbl.weekday.2', 'Tuesday'),
      3: t('lbl.weekday.3', 'Wednesday'),
      4: t('lbl.weekday.4', 'Thursday'),
      5: t('lbl.weekday.5', 'Friday'),
      6: t('lbl.weekday.6', 'Saturday'),
      7: t('lbl.weekday.7', 'Sunday'),
    };
  };

  weekDayFormatter = (cell) => {
    const ISO_WEEKDAYS = this.getISOWeekdays();
    return ISO_WEEKDAYS[cell] || cell;
  };

  numberFormatter = (cell) => {
    return (Math.round(cell * 100) / 100).toFixed(2);
  };

  priceFormatter = (cell) => {
    const { zone } = this.props;
    return currency_formatter(cell, zone);
  };

  yearWeekFormatter = (cell) => {
    if (cell && String(cell).length === 6) {
      const year = String(cell).substr(0, 4);
      const week = String(cell).substr(4, 2);
      return year + ' - ' + week;
    }
    return cell;
  };

  handleExport = async (table_data) => {
    const { t, zone, from_date, to_date, columns_to_show, group_by, unit } =
      this.props;

    const symbol = zone.currencysymbol ? '(' + zone.currencysymbol + ')' : '';

    const trans_map = {
      weekday: t('lbl.weekday', 'Weekday'),
      basevolsum: t('lbl.basevolsum.unit', 'Base volume ({{value}})', unit),
      cancount: t('lbl.cancount', 'Can count'),
      pricesum: t('lbl.pricesum', 'Price') + symbol,
      costsum: t('lbl.costsum', 'Cost') + symbol,
      productname: t('lbl.productname', 'Product name'),
      basecode: t('lbl.basecode', 'Base code'),
      cansizecode: t('lbl.cansizecode', 'Can size code'),
      cntcode: t('lbl.cntcode', 'Colorant'),
      colourcode: t('lbl.colourcode', 'Color'),
      cntvolsum: t('lbl.cntvolsum.unit', 'Colorant volume ({{value}})', unit),
      yearweek: t('lbl.yearweek', 'Week'),
    };

    let ws, wb;

    table_data = _.sortBy(table_data, group_by);
    const data = table_data.map((row) => {
      return columns_to_show.map((col) => {
        if (col === 'basevolsum' || col === 'cntvolsum') {
          return row[col] ? Number(row[col]).toFixed(2) : null;
        }
        if (col === 'pricesum' || col === 'costsum') {
          return currency_formatter(row[col], zone);
        }
        if (col === 'yearweek') {
          return this.yearWeekFormatter(row[col]);
        }
        if (col === 'weekday') {
          return this.weekDayFormatter(row[col]);
        }
        return row[col];
      });
    });

    const XLSX = await import('xlsx');
    ws = XLSX.utils.aoa_to_sheet(data, { origin: 'A14' });

    // Add header
    const header = [columns_to_show.map((x) => trans_map[x])];
    XLSX.utils.sheet_add_aoa(ws, header, {
      origin: 'A13',
    });

    XLSX.utils.sheet_add_aoa(ws, [[t('lbl.date', 'Date'), new Date()]], {
      origin: 'A1',
    });

    XLSX.utils.sheet_add_aoa(
      ws,
      [[t('lbl.from', 'From'), new Date(from_date)]],
      { origin: 'A8' }
    );
    XLSX.utils.sheet_add_aoa(ws, [[t('lbl.to', 'To'), new Date(to_date)]], {
      origin: 'A9',
    });
    XLSX.utils.sheet_add_aoa(ws, [[zone.zonename]], {
      origin: 'A10',
    });

    ws['!cols'] = fitToColumn(_.concat(data, header));
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SheetJS');
    XLSX.writeFile(wb, columns_to_show[0] + '.xlsx');
  };

  getScrollStyle = () => {
    const { pending } = this.props;

    return {
      height: 'calc(100vh - 22rem)',
      background: '#112E40',
      color: 'white',
      cursor: pending ? 'progress' : 'unset',
      fontSize: 'small',
    };
  };

  render() {
    const { t, data, pending, error, columns_to_show, group_by, zone, unit } =
      this.props;

    let selectOptions = this.getISOWeekdays;
    let table_data = _.cloneDeep(data).map((x) => ({
      ...x,
      basevolsum: x.basevolsum / unit.factor,
      cntvolsum: x.cntvolsum / unit.factor,
    }));

    if (group_by) {
      const grpd_data = _.groupBy(table_data, group_by);
      table_data = _.uniqBy(table_data, group_by);
      // calc sum
      table_data = table_data.map((x) => ({
        ...x,
        basevolsum: _.sumBy(grpd_data[x[group_by]], 'basevolsum'),
        cancount: _.sumBy(grpd_data[x[group_by]], 'cancount'),
        pricesum: _.sumBy(grpd_data[x[group_by]], 'pricesum'),
        cntvolsum: _.sumBy(grpd_data[x[group_by]], 'cntvolsum'),
        costsum: _.sumBy(grpd_data[x[group_by]], 'costsum'),
      }));

      // Using constants didn't work?
      selectOptions = table_data.map((x) => {
        if (group_by === 'yearweek') {
          return {
            value: x[group_by],
            label: this.yearWeekFormatter(x[group_by]),
          };
        } else {
          return {
            value: x[group_by],
            label: x[group_by],
          };
        }
      });
    }

    if (group_by === 'yearweek') {
      selectOptions = _.sortBy(selectOptions, 'value');
    }

    const symbol = zone?.currencysymbol ? '(' + zone?.currencysymbol + ')' : '';

    const trans_map = {
      weekday: t('lbl.weekday', 'Weekday'),
      yearweek: t('lbl.yearweek', 'Week'),
      basevolsum: t('lbl.basevolsum.unit', 'Base volume ({{value}})', unit),
      cancount: t('lbl.cancount', 'Can count'),
      pricesum: t('lbl.pricesum', 'Price') + symbol,
      productname: t('lbl.productname', 'Product name'),
      basecode: t('lbl.basecode', 'Base code'),
      cansizecode: t('lbl.cansizecode', 'Can size code'),
      cntcode: t('lbl.cntcode', 'Colorant'),
      colourcode: t('lbl.colourcode', 'Color'),
      cntvolsum: t('lbl.cntvolsum.unit', 'Colorant volume ({{value}})', unit),
      costsum: t('lbl.costsum', 'Cost') + symbol,
    };

    table_data = _.sortBy(table_data, group_by);
    // sum row
    const sum_text = '∑';
    table_data.push({
      weekday: sum_text,
      productname: sum_text,
      basecode: sum_text,
      cansizecode: sum_text,
      cntcode: sum_text,
      colourcode: sum_text,
      yearweek: sum_text,

      basevolsum: _.sumBy(table_data, 'basevolsum'),
      cancount: _.sumBy(table_data, 'cancount'),
      pricesum: _.sumBy(table_data, 'pricesum'),
      costsum: _.sumBy(table_data, 'costsum'),
      cntvolsum: _.sumBy(table_data, 'cntvolsum'),
    });

    const columns = columns_to_show.map((x) => {
      if (x === group_by || x === 'weekday') {
        return {
          dataField: x,
          text: trans_map[x],
          sortCaret: sortCarret,
          sort: true,
          filter: selectFilter({
            options: selectOptions,
          }),
          classes: 'cursor-pointer',
          formatter:
            x === 'weekday'
              ? this.weekDayFormatter
              : x === 'yearweek'
                ? this.yearWeekFormatter
                : null,
        };
      } else {
        return {
          dataField: x,
          text: trans_map[x],
          sortCaret: sortCarret,
          sort: true,
          filter:
            x === 'basevolsum' ||
            x === 'cancount' ||
            x === 'pricesum' ||
            x === 'costsum' ||
            x === 'cntvolsum'
              ? numberFilter()
              : textFilter(),
          classes: 'cursor-pointer',
          formatter:
            x === 'basevolsum' || x === 'cntvolsum'
              ? this.numberFormatter
              : x === 'pricesum' || x === 'costsum'
                ? this.priceFormatter
                : null,
        };
      }
    });

    return (
      <>
        <CustomScrollbars
          id="table_holder"
          className="br-8 fixed-table-header"
          style={this.getScrollStyle()}
        >
          <BootstrapTable
            keyField={columns_to_show[0]}
            hover
            data={table_data}
            columns={columns}
            noDataIndication={() =>
              error || pending
                ? t('msg.searching.ellipsis', 'Searching...')
                : t('lbl.noData', 'No data')
            }
            //selectRow={selectRowProp}
            //pagination={paginationFactory({
            //  ...pagination_options,
            //  onPageChange: () => this.forceUpdate(),
            //})}
            filter={filterFactory()}
            onDataSizeChange={() => this.forceUpdate()}
          />
        </CustomScrollbars>

        <Button
          style={{ maxWidth: '400px' }}
          className={'fa-pull-right'}
          color="primary"
          data-denied={!hasPrivilege('export')}
          disabled={!hasPrivilege('export') || !table_data}
          onClick={() => this.handleExport(table_data)}
        >
          {t('lbl.export', 'Export')}
        </Button>
      </>
    );
  }
}

StatisticsData.propTypes = {
  t: PropTypes.func.isRequired,
  unit: PropTypes.shape({
    label: PropTypes.string,
    factor: PropTypes.number,
    value: PropTypes.string,
  }).isRequired,
  data: PropTypes.array.isRequired,
  pending: PropTypes.bool.isRequired,
  error: PropTypes.any,
  columns_to_show: PropTypes.array.isRequired,
  group_by: PropTypes.string,
  from_date: PropTypes.any,
  to_date: PropTypes.any,
  zone: PropTypes.shape({
    currencydecimals: PropTypes.number,
    currencyformat: PropTypes.number,
    currencysymbol: PropTypes.string,
    zonename: PropTypes.string,
    zoneid: PropTypes.number,
  }),
};

export default withTranslation('translations')(StatisticsData);
