import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { COLORS, SOURCE_PURGE } from '../../Constants';
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

class StatisticsCntChart extends Component {
  numberFormatter = (cell) => {
    return (Math.round(cell * 100) / 100).toFixed(2);
  };

  mlToUnitFormatter = (cell) => {
    const { unit } = this.props;
    return (cell / unit.factor).toFixed(2);
  };

  render() {
    const { t, data, zone, unit } = this.props;

    const options = {
      elements: {
        bar: {
          borderWidth: 2,
        },
      },
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
        title: {
          display: true,
        },
      },
      scales: {
        A: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: unit.label,
          },
          grid: {
            color: '#de3d6955',
            borderColor: '#de3d6955',
          },
        },
        B: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: t('lbl.value', 'Value'),
          },
          grid: {
            color: '#49cc6155',
            borderColor: '#49cc6155',
          },
        },
      },
    };

    const group_by = 'cntcode';

    let table_data = _.cloneDeep(data);

    const purge_ration =
      (_.sumBy(
        table_data.filter((x) => x.source === SOURCE_PURGE),
        'cntvolsum'
      ) *
        100) /
      _.sumBy(table_data, 'cntvolsum');

    const total_cnt_consumption = _.sumBy(table_data, 'cntvolsum');
    const total_cnt_price = _.sumBy(table_data, 'costsum');

    if (group_by) {
      const grpd_data = _.groupBy(data, group_by);
      table_data = _.uniqBy(data, group_by);
      // calc sum
      table_data = table_data.map((x) => ({
        ...x,
        basevolsum: _.sumBy(grpd_data[x[group_by]], 'basevolsum'),
        cancount: _.sumBy(grpd_data[x[group_by]], 'cancount'),
        costsum: _.sumBy(grpd_data[x[group_by]], 'costsum'),
        cntvolsum: _.sumBy(grpd_data[x[group_by]], 'cntvolsum'),
      }));
    }

    const sales_data = {
      labels: table_data.map((x) => x.cntcode),
      datasets: [
        {
          yAxisID: 'A',
          label: [
            t('lbl.used_quantity.unit', 'Used quantity ({{value}})', unit),
          ],
          data: table_data.map((x) => this.mlToUnitFormatter(x.cntvolsum)),
          borderColor: 'rgb(' + COLORS[0] + ')',
          backgroundColor: 'rgba(' + COLORS[0] + ', 0.5)',
        },
        {
          yAxisID: 'B',
          label: [t('lbl.value', 'Value')],
          data: table_data.map((x) => this.numberFormatter(x.costsum)),
          borderColor: 'rgb(' + COLORS[1] + ')',
          backgroundColor: 'rgba(' + COLORS[1] + ', 0.5)',
        },
      ],
    };

    return (
      <Container>
        <Row>
          <Col xs={3} className={'p-0'}>
            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>{t('lbl.dispensed_volume', 'Dispensed volume')}</Label>
                  <br />
                  <b>
                    {this.mlToUnitFormatter(total_cnt_consumption)} {unit.value}
                  </b>
                </div>
              </Col>
            </Row>

            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>{t('lbl.dispensed_value', 'Dispense value')}</Label>
                  <br />

                  <b> {currency_formatter(total_cnt_price, zone)}</b>
                </div>
              </Col>
            </Row>
            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>{t('lbl.purge_ratio', 'Purge ratio')}</Label>
                  <br />
                  <b>{this.numberFormatter(purge_ration)} %</b>
                </div>
              </Col>
            </Row>
          </Col>
          <Col xs={9} className={'p-0'} style={{ minHeight: '400px' }}>
            <Bar redraw options={options} data={sales_data} />
          </Col>
        </Row>
      </Container>
    );
  }
}

StatisticsCntChart.propTypes = {
  t: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired,
  pending: PropTypes.bool.isRequired,
  error: PropTypes.any,
  group_by: PropTypes.string,
  zone: PropTypes.shape({
    currencydecimals: PropTypes.number,
    currencyformat: PropTypes.number,
    currencysymbol: PropTypes.string,
  }),
  unit: PropTypes.shape({
    label: PropTypes.string,
    factor: PropTypes.number,
    value: PropTypes.string,
  }).isRequired,
};

export default withTranslation('translations')(StatisticsCntChart);
