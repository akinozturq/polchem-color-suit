import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { COLORS } from '../../Constants';
import _ from 'lodash';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Col, Container, Label, Row } from 'reactstrap';
import { currency_formatter } from '../../mylib/Utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.defaults.color = '#fff';

const options = {
  indexAxis: 'y',
  elements: {
    bar: {
      borderWidth: 2,
    },
  },
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        color: '#fff',
        borderColor: '#fff',
      },
    },
    y: {
      display: false,
      stacked: true,
      grid: {
        color: '#fff',
        borderColor: '#fff',
      },
    },
  },
};

class StatisticsChart extends Component {
  numberFormatter = (cell) => {
    return (Math.round(cell * 100) / 100).toFixed(2);
  };

  mlToUnitFormatter = (cell) => {
    const { unit } = this.props;
    return cell.toFixed(2) + ' ' + unit.label;
  };

  render() {
    const { t, data, group_by, zone, unit } = this.props;
    const ISO_WEEKDAYS = {
      1: t('lbl.weekday.1', 'Monday'),
      2: t('lbl.weekday.2', 'Tuesday'),
      3: t('lbl.weekday.3', 'Wednesday'),
      4: t('lbl.weekday.4', 'Thursday'),
      5: t('lbl.weekday.5', 'Friday'),
      6: t('lbl.weekday.6', 'Saturday'),
      7: t('lbl.weekday.7', 'Sunday'),
    };

    let groupping = group_by;
    let selectOptions = ISO_WEEKDAYS;
    let table_data = _.cloneDeep(data);
    if (group_by) {
      const grpd_data = _.groupBy(data, group_by);
      table_data = _.uniqBy(data, group_by);
      // calc sum
      table_data = table_data.map((x) => ({
        ...x,
        basevolsum: _.sumBy(grpd_data[x[group_by]], 'basevolsum'),
        cancount: _.sumBy(grpd_data[x[group_by]], 'cancount'),
        pricesum: _.sumBy(grpd_data[x[group_by]], 'pricesum'),
        cntvolsum: _.sumBy(grpd_data[x[group_by]], 'cntvolsum'),
      }));

      // Using constants didn't work?
      selectOptions = table_data.map((x) => x[group_by]);
    } else {
      groupping = 'weekday';
    }

    if (table_data.length > 15) {
      const sorted_by_basevol = _.sortBy(table_data, 'basevolsum').reverse();
      const pricesum = _.sumBy(sorted_by_basevol.slice(15), 'pricesum');
      const basevolsum = _.sumBy(sorted_by_basevol.slice(15), 'basevolsum');
      const cancount = _.sumBy(sorted_by_basevol.slice(15), 'cancount');
      table_data = _.cloneDeep(sorted_by_basevol.slice(0, 15));
      table_data.push({
        [groupping]: t('lbl.others', 'Others'),
        pricesum,
        basevolsum,
        cancount,
      });
    }

    table_data = table_data.map((x, i) => ({
      ...x,
      cntvolsum: x.cntvolsum / unit.factor,
      basevolsum: x.basevolsum / unit.factor,
    }));

    const sales_data = {
      labels: [''],
      datasets: table_data.map((x, i) => ({
        label: selectOptions[x[groupping]] || x[groupping],
        data: [x.pricesum],
        borderColor: 'rgb(' + COLORS[i] + ')',
        backgroundColor: 'rgba(' + COLORS[i] + ', 0.5)',
      })),
    };

    const paints_data = {
      labels: [''],
      datasets: table_data.map((x, i) => ({
        label: selectOptions[x[groupping]] || x[groupping],
        data: [x.basevolsum],
        borderColor: 'rgb(' + COLORS[i] + ')',
        backgroundColor: 'rgba(' + COLORS[i] + ', 0.5)',
      })),
    };

    const can_data = {
      labels: [''],
      datasets: table_data.map((x, i) => ({
        label: selectOptions[x[groupping]] || x[groupping],
        data: [x.cancount],
        borderColor: 'rgb(' + COLORS[i] + ')',
        backgroundColor: 'rgba(' + COLORS[i] + ', 0.5)',
      })),
    };

    return (
      <Container>
        <Row>
          <Col xs={8}>
            <Row>
              <Col xs={4} className="center">
                <div>
                  <Label>{t('lbl.sales', 'Sales')}</Label>
                  <br />
                  <Label>
                    {currency_formatter(_.sumBy(table_data, 'pricesum'), zone)}
                  </Label>
                </div>
              </Col>
              <Col xs={8}>
                <Bar redraw options={options} data={sales_data} />
              </Col>
            </Row>
            <Row>
              <Col xs={4} className="center">
                <div>
                  <Label>{t('lbl.paint_sold', 'Paint sold')}</Label>
                  <br />
                  <Label>
                    {this.mlToUnitFormatter(_.sumBy(table_data, 'basevolsum'))}
                  </Label>
                </div>
              </Col>
              <Col xs={8}>
                <Bar redraw options={options} data={paints_data} />
              </Col>
            </Row>
            <Row>
              <Col xs={4} className="center">
                <div>
                  <Label>{t('lbl.number_of_cans', 'Number of cans')}</Label>
                  <br />
                  <Label>{_.sumBy(table_data, 'cancount')}</Label>
                </div>
              </Col>
              <Col xs={8}>
                <Bar redraw options={options} data={can_data} />
              </Col>
            </Row>
          </Col>
          <Col
            xs={4}
            style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
          >
            {table_data.map((x, i) => (
              <div
                key={i}
                style={{ display: 'inline-flex', flexBasis: '100%' }}
              >
                <div
                  style={{
                    width: '1rem',
                    height: '1rem',
                    borderColor: 'rgb(' + COLORS[i] + ')',
                    backgroundColor: 'rgba(' + COLORS[i] + ', 0.5)',
                  }}
                />
                <div>{selectOptions[x[groupping]] || x[groupping]}</div>
              </div>
            ))}
          </Col>
        </Row>
      </Container>
    );
  }
}

StatisticsChart.propTypes = {
  t: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired,
  pending: PropTypes.bool.isRequired,
  error: PropTypes.any,
  zone: PropTypes.shape({
    currencydecimals: PropTypes.number,
    currencyformat: PropTypes.number,
    currencysymbol: PropTypes.string,
  }),
  group_by: PropTypes.string,
  unit: PropTypes.shape({
    label: PropTypes.string,
    factor: PropTypes.number,
    value: PropTypes.string,
  }).isRequired,
};

export default withTranslation('translations')(StatisticsChart);
