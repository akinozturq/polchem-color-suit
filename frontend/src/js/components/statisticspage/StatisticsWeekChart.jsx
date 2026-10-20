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
import { Col, Container, FormGroup, Label, Row } from 'reactstrap';
import { currency_formatter, customControlStyles } from '../../mylib/Utils';
import Select from 'react-select';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

class StatisticsWeekChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      week: null,
    };
  }

  numberFormatter = (cell) => {
    return (Math.round(cell * 100) / 100).toFixed(2);
  };

  mlToUnitFormatter = (cell) => {
    const { unit } = this.props;
    return (cell / unit.factor).toFixed(2);
  };

  yearWeekFormatter = (cell) => {
    if (cell && String(cell).length === 6) {
      const year = String(cell).substr(0, 4);
      const week = String(cell).substr(4, 2);
      return year + ' - ' + week;
    }
    return cell;
  };

  render() {
    const { t, data, zone, unit } = this.props;

    let selectOptions = [];

    let groupped_data = _.uniqBy(data, 'yearweek');

    // Using constants didn't work?
    selectOptions = groupped_data.map((x) => ({
      value: x.yearweek,
      label: this.yearWeekFormatter(x.yearweek),
    }));

    selectOptions = _.sortBy(selectOptions, 'value');

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
        },
        B: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: t('lbl.value', 'Value'),
          },
        },
      },
    };

    const group_by = this.state.week ? 'cntcode' : 'yearweek';

    let table_data = this.state.week
      ? _.cloneDeep(data.filter((x) => x.yearweek === this.state.week.value))
      : _.cloneDeep(data);

    const purge_ration =
      (_.sumBy(
        table_data.filter((x) => x.source === SOURCE_PURGE),
        'cntvolsum'
      ) *
        100) /
      _.sumBy(table_data, 'cntvolsum');

    const total_cnt_consumption = _.sumBy(table_data, 'cntvolsum');
    const total_cnt_price = _.sumBy(table_data, 'costsum');

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

    table_data = _.sortBy(table_data, group_by);

    const sales_data = {
      labels: table_data.map((x) => x[group_by]),
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
          <Col>
            <FormGroup row>
              <Label for="weekselector" sm={2}>
                {t('lbl.week.colon', 'Week:')}
              </Label>
              <Col sm={10}>
                <Select
                  styles={{
                    control: customControlStyles,
                    option: (base) => ({ ...base, color: 'black' }),
                  }}
                  id="weekselector"
                  options={selectOptions}
                  isClearable={true}
                  value={this.state.week}
                  onChange={(v) => this.setState({ week: v })}
                />
              </Col>
            </FormGroup>
          </Col>
        </Row>
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
          <Col xs={9} className={'p-0'} style={{ minHeight: '350px' }}>
            <Bar redraw options={options} data={sales_data} />
          </Col>
        </Row>
      </Container>
    );
  }
}

StatisticsWeekChart.propTypes = {
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

export default withTranslation('translations')(StatisticsWeekChart);
