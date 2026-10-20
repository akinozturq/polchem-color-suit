import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { eachDayOfInterval, parseISO } from 'date-fns';
import { fromPairs } from 'lodash';
import { selectors } from 'js/redux/reducers/Statistics';
import { Table } from 'reactstrap';
import { CustomScrollbars, spinner } from '../../../mylib/Utils';
import { dateToLocaleString, formatISODate } from '../../../mylib/DateUtils';
import { NumberFormatter } from 'polchem_base/common/formatters/NumberFormatter';

function MachinePurgeStatsTable({ t, pending, params, cnts, dates, total }) {
  if (pending) {
    return spinner('5rem');
  }

  if (!dates.length) {
    return (
      <Table size="xs" bordered>
        <tbody>
          <tr>
            <th>{t('lbl.noData', 'No data')}</th>
          </tr>
        </tbody>
      </Table>
    );
  }

  const nf = new NumberFormatter({ decimals: 1 });
  const start = parseISO(params.start_date);
  const end = parseISO(params.end_date);
  const datesObj = fromPairs(dates.map((x) => [x.date, x]));

  let header = cnts.map((x) => <th key={x}>{x}</th>);
  header.unshift(<th key={'_date_'}>{t('lbl.date', 'Date')}</th>);
  let tdata = eachDayOfInterval({ start, end }).map((d) => {
    const date = formatISODate(d);
    return (
      <tr key={date}>
        <td>{dateToLocaleString(d)}</td>
        {cnts.map((cnt) => (
          <td key={cnt}>{nf.format(datesObj[date]?.volumes[cnt])}</td>
        ))}
      </tr>
    );
  });

  tdata.push(
    <tr key={'_total_'}>
      <td>{t('lbl.totalMl', 'Total (ml)')}</td>
      {cnts.map((v) => (
        <td key={v}>{nf.format(total[v])}</td>
      ))}
    </tr>
  );

  return (
    <CustomScrollbars style={{ height: '65vh' }}>
      <Table size="xs" bordered>
        <thead>
          <tr>{header}</tr>
        </thead>
        <tbody>{tdata}</tbody>
      </Table>
    </CustomScrollbars>
  );
}

MachinePurgeStatsTable.propTypes = {
  t: PropTypes.func.isRequired,
  pending: PropTypes.bool.isRequired,
  params: PropTypes.shape({
    start_date: PropTypes.string,
    end_date: PropTypes.string,
  }),
  cnts: PropTypes.arrayOf(PropTypes.string),
  dates: PropTypes.arrayOf(
    PropTypes.shape({ date: PropTypes.string, volumes: PropTypes.object })
  ),
  total: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    pending: state.statistics.purge.pending,
    params: state.statistics.purge.params,
    cnts: selectors.purged_cntcodes(state),
    dates: selectors.purged_by_date(state),
    total: selectors.purged_totals(state),
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(MachinePurgeStatsTable)
);
