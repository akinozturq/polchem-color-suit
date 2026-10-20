import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Col, Container, Label, Row } from 'reactstrap';
import { currency_formatter, RGBColorToHex } from '../../mylib/Utils';
import { SOURCE_USER } from '../../Constants';

ChartJS.register(ArcElement, Tooltip, Legend);

ChartJS.defaults.color = '#fff';

class StatisticsColorChart extends Component {
  constructor(props) {
    super(props);
    this.state = { hovering: false };
  }

  numberFormatter = (cell) => {
    if (cell) {
      return (Math.round(cell * 100) / 100).toFixed(2);
    }
  };

  mlToUnitFormatter = (cell) => {
    if (cell) {
      const { unit } = this.props;
      return (cell / unit.factor).toFixed(2);
    }
  };

  onHover = (evt, item, legend) => {
    const chart = legend.chart;
    const tooltip = chart.tooltip;

    const chartArea = chart.chartArea;
    tooltip.setActiveElements(
      [
        {
          datasetIndex: 0,
          index: item.index,
        },
      ],
      {
        x: (chartArea.left + chartArea.right) / 2,
        y: (chartArea.top + chartArea.bottom) / 2,
      }
    );

    chart.update();
  };

  onLeave = (evt, legendItem, legend) => {
    legend.chart.tooltip._active = [];
    legend.chart.update();
    legend.chart.draw();
  };

  render() {
    const { t, data, zone, unit } = this.props;

    const options = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          onHover: this.onHover,
          onLeave: this.onLeave,
        },
        title: {
          display: true,
          text: t(
            'lbl.most_sold_colors.unit',
            'Most sold colors ({{value}})',
            unit
          ),
        },
      },
    };

    let table_data = _.cloneDeep(data);

    const sorted_by_basevol = _.sortBy(table_data, 'basevolsum').reverse();
    const top_20_colors = sorted_by_basevol.slice(0, 20);
    const top_20_ration =
      (_.sumBy(top_20_colors, 'basevolsum') /
        _.sumBy(table_data, 'basevolsum')) *
      100.0;

    const custom_color_ration =
      (table_data.filter((x) => x.source === SOURCE_USER).length /
        table_data.length) *
      100.0;

    const most_sold = _.maxBy(table_data, 'basevolsum');

    const most_valuable = _.maxBy(table_data, 'pricesum');

    const most_tinted = _.maxBy(table_data, 'cancount');

    if (table_data.length > 15) {
      const basevolsum = _.sumBy(sorted_by_basevol.slice(15), 'basevolsum');
      table_data = _.cloneDeep(sorted_by_basevol.slice(0, 15));
      table_data.push({
        colourcode: t('lbl.others', 'Others'),
        basevolsum: basevolsum,
      });
    }

    const sales_data = {
      labels: table_data.map((x) => x.colourcode),
      datasets: [
        {
          data: table_data.map((x) => this.mlToUnitFormatter(x.basevolsum)),
          borderColor: table_data.map(() => 'rgba(0,0,0,0.15)'),
          backgroundColor: table_data.map((x) => RGBColorToHex(x.rgb)),
        },
      ],
    };

    return (
      <Container>
        <Row>
          <Col xs={3}>
            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>
                    {t('lbl.most_sold.unit', 'Most sold ({{value}})', unit)}
                  </Label>
                  <br />
                  <b>{most_sold?.colourcode}</b>
                  <br />
                  <Label>{this.mlToUnitFormatter(most_sold?.basevolsum)}</Label>
                </div>
              </Col>
            </Row>
            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>{t('lbl.most_valuable', 'Most valuable')}</Label>
                  <br />
                  <b>{most_valuable?.colourcode}</b>
                  <br />
                  <Label>
                    {currency_formatter(most_valuable?.pricesum, zone)}
                  </Label>
                </div>
              </Col>
            </Row>
            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>{t('lbl.most_tinted', 'Most tinted (times)')}</Label>
                  <br />
                  <b>{most_tinted?.colourcode}</b>
                  <br />
                  <Label>{most_tinted?.cancount}</Label>
                </div>
              </Col>
            </Row>
          </Col>
          <Col xs={6}>
            <Row>
              <Col xs={12} style={{ minHeight: '400px' }}>
                <Pie redraw data={sales_data} options={options} />
              </Col>
            </Row>
          </Col>
          <Col xs={3}>
            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>
                    {t('lbl.custom_color_ratio', 'Custom color ratio')}
                  </Label>
                  <br />
                  <Label data-testid={'custom_color_ratio'}>
                    {this.numberFormatter(custom_color_ration)} %
                  </Label>
                </div>
              </Col>
            </Row>
            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>{t('lbl.top_20_sales', 'Top 20 sales')}</Label>
                  <br />
                  <Label>{this.numberFormatter(top_20_ration)} %</Label>
                </div>
              </Col>
            </Row>
            <Row style={{ height: '33%' }}>
              <Col className="center">
                <div>
                  <Label>
                    {t('lbl.unique_colors_tinted', 'Unique colors tinted')}
                  </Label>
                  <br />
                  <Label>{data.length}</Label>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    );
  }
}

StatisticsColorChart.propTypes = {
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

export default withTranslation('translations')(StatisticsColorChart);
