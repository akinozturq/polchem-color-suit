import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  Button,
  Col,
  Label,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from 'reactstrap';
import statisticsActions from 'js/redux/reducers/Statistics';

import StatisticsData from './StatisticsData';
import StatisticsChart from './StatisticsChart';
import StatisticsCntChart from './StatisticsCntChart';
import StatisticsColorChart from './StatisticsColorChart';
import Spinner from '../shared/Spinner';
import StatisticsWeekChart from './StatisticsWeekChart';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import Select from 'react-select';
import { customControlStyles } from '../../mylib/Utils.jsx';

import { CustomDatePicker } from '../shared/CustomDatePicker.jsx';

const units = [
  { label: 'Litre', factor: 1000, value: 'l' },
  { label: 'US Gallons', factor: 3785.411784, value: 'gal' },
  { label: 'US Quart', factor: 946.353, value: 'qt' },
];

class Statistics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'weekdays',
      formControls: {
        start_date: '',
        end_date: '',
      },
      data_days: {
        start_date: '',
        end_date: '',
      },
      unit: units[0],
      show_chart: false,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.pos_stats && props.pos_stats.data) {
      if (
        props.pos_stats.data.daterange[0] !== state.data_days.start_date ||
        props.pos_stats.data.daterange[1] !== state.data_days.end_date
      ) {
        return {
          formControls: {
            start_date: props.pos_stats.data.daterange[0],
            end_date: props.pos_stats.data.daterange[1],
          },
          data_days: {
            start_date: props.pos_stats.data.daterange[0],
            end_date: props.pos_stats.data.daterange[1],
          },
          unit: state.unit,
        };
      }
    }

    return {};
  }

  toggle = (tab) => {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab,
      });
    }
  };

  changeHandler = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState((state) => ({
      formControls: { ...state.formControls, [name]: value },
    }));
  };

  load = () => {
    this.props.getPosStats(
      this.state.formControls.start_date,
      this.state.formControls.end_date
    );
  };

  render() {
    const { t, pos_stats } = this.props;

    let curr = new Date();
    let maxDate = curr.toLocaleDateString('sv');

    const menu = [
      'weekdays',
      'products',
      'bases',
      'cans',
      'colorants',
      'colors',
    ];

    if (this.props.is_pro) {
      menu.splice(1, 0, 'weeks');
    }

    const menu_transl = {
      weekdays: t('lbl.weekdays', 'Weekdays'),
      weeks: t('lbl.weeks', 'Weeks'),
      products: t('lbl.products', 'Products'),
      bases: t('lbl.bases', 'Bases'),
      cans: t('lbl.cans', 'Cans'),
      colorants: t('lbl.colorants', 'Colorants'),
      colors: t('lbl.colors', 'Colors'),
    };

    let disable_load =
      pos_stats.pending ||
      (this.state.formControls.start_date === this.state.data_days.start_date &&
        this.state.formControls.end_date === this.state.data_days.end_date);

    const navs = menu.map((x) => (
      <NavItem key={x} className="tab-item">
        <NavLink
          className="tab-link"
          active={this.state.activeTab === x}
          data-cy={'nav2stat_' + x}
          onClick={() => {
            this.toggle(x);
          }}
        >
          {menu_transl[x]}
        </NavLink>
      </NavItem>
    ));

    return (
      <>
        <Row className="mt-2 mb-2">
          <Col xs={2} className="pr-0 pl-2" style={{ minWidth: '150px' }}>
            <Select
              id="unit_select"
              menuPlacement="auto"
              styles={{
                container: (base) => ({ ...base, zIndex: 2 }),
                control: customControlStyles,
                option: (base) => ({ ...base, color: 'black', zIndex: 2 }),
              }}
              isSearchable={false}
              onChange={(value) => this.setState({ unit: value })}
              options={units}
              value={this.state.unit}
            />
          </Col>
          <Col xs={4} className="pr-0 pl-2">
            <CustomDatePicker
              prefix={t('lbl.from.colon', 'From:')}
              id="start_date"
              selected={this.state.formControls.start_date}
              onChange={(date) =>
                this.setState((pre) => {
                  return {
                    formControls: {
                      ...pre.formControls,
                      start_date: date,
                    },
                  };
                })
              }
              maxDate={maxDate}
            />
          </Col>
          <Col xs={4} className="pr-0 pl-2">
            <CustomDatePicker
              id="end_date"
              prefix={t('lbl.to.colon', 'To:')}
              selected={this.state.formControls.end_date}
              onChange={(date) =>
                this.setState((pre) => {
                  return {
                    formControls: {
                      ...pre.formControls,
                      end_date: date,
                    },
                  };
                })
              }
              minDate={this.state.formControls.start_date}
              maxDate={maxDate}
            />
          </Col>
          <Col xs={'auto'} className="pr-2 pl-2">
            <Button
              color="primary"
              id="load_statistics"
              className="w-100"
              onClick={this.load}
              disabled={disable_load}
            >
              {t('fn.load', 'Load')}
              {pos_stats.pending && <Spinner />}
            </Button>
          </Col>
        </Row>

        <Nav className="tab-header small" tabs>
          {navs}
          <NavItem className="tab-item">
            <NavLink
              className="tab-link"
              active={false}
              data-cy={'nav2stat_type'}
            >
              <div className="d-inline-flex pl-20 pr-20">
                <Label className={'mr-1 mb-0'}>{t('lbl.table', 'Table')}</Label>
                <div
                  data-testid={'switch_table_chart'}
                  className="switch mr-10 ml-10"
                  onClick={() =>
                    this.setState((old) => ({
                      show_chart: !old.show_chart,
                    }))
                  }
                >
                  <div
                    className={
                      this.state.show_chart
                        ? 'switch-cirle-checked'
                        : 'switch-cirle'
                    }
                  />
                </div>
                <Label className={'ml-1 mb-0'}>{t('lbl.chart', 'Chart')}</Label>
              </div>
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent
          activeTab={this.state.activeTab}
          style={{ height: '100%' }}
          className="font-small p-8"
        >
          <TabPane tabId="weekdays">
            {this.state.show_chart ? (
              <StatisticsChart
                data={pos_stats.data ? pos_stats.data.weekdays : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                zone={pos_stats?.data?.zone}
                unit={this.state.unit}
              />
            ) : (
              <StatisticsData
                data={pos_stats.data ? pos_stats.data.weekdays : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                columns_to_show={[
                  'weekday',
                  'basevolsum',
                  'cancount',
                  'pricesum',
                ]}
                zone={pos_stats?.data?.zone}
                from_date={pos_stats?.data?.daterange[0]}
                to_date={pos_stats?.data?.daterange[1]}
                unit={this.state.unit}
              />
            )}
          </TabPane>
          <TabPane tabId="weeks">
            {this.state.show_chart ? (
              <StatisticsWeekChart
                data={pos_stats.data ? pos_stats.data.colorants : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                group_by={'yearweek'}
                zone={pos_stats?.data?.zone}
                unit={this.state.unit}
              />
            ) : (
              <StatisticsData
                data={pos_stats.data ? pos_stats.data.colorants : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                columns_to_show={['yearweek', 'cntvolsum', 'costsum']}
                group_by={'yearweek'}
                zone={pos_stats?.data?.zone}
                from_date={pos_stats?.data?.daterange[0]}
                to_date={pos_stats?.data?.daterange[1]}
                unit={this.state.unit}
              />
            )}
          </TabPane>
          <TabPane tabId="products">
            {this.state.show_chart ? (
              <StatisticsChart
                data={pos_stats.data ? pos_stats.data.products : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                group_by={'productname'}
                zone={pos_stats?.data?.zone}
                unit={this.state.unit}
              />
            ) : (
              <StatisticsData
                data={pos_stats.data ? pos_stats.data.products : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                columns_to_show={[
                  'productname',
                  //'basecode',
                  //'cansizecode',
                  'basevolsum',
                  'cancount',
                  'pricesum',
                ]}
                group_by={'productname'}
                zone={pos_stats?.data?.zone}
                from_date={pos_stats?.data?.daterange[0]}
                to_date={pos_stats?.data?.daterange[1]}
                unit={this.state.unit}
              />
            )}
          </TabPane>
          <TabPane tabId="bases">
            {this.state.show_chart ? (
              <StatisticsChart
                data={pos_stats.data ? pos_stats.data.products : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                group_by={'basecode'}
                zone={pos_stats?.data?.zone}
                unit={this.state.unit}
              />
            ) : (
              <StatisticsData
                data={pos_stats.data ? pos_stats.data.products : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                columns_to_show={[
                  //'productname',
                  'basecode',
                  //'cansizecode',
                  'basevolsum',
                  'cancount',
                  'pricesum',
                ]}
                group_by={'basecode'}
                zone={pos_stats?.data?.zone}
                from_date={pos_stats?.data?.daterange[0]}
                to_date={pos_stats?.data?.daterange[1]}
                unit={this.state.unit}
              />
            )}
          </TabPane>
          <TabPane tabId="cans">
            {this.state.show_chart ? (
              <StatisticsChart
                data={pos_stats.data ? pos_stats.data.products : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                group_by={'cansizecode'}
                zone={pos_stats?.data?.zone}
                unit={this.state.unit}
              />
            ) : (
              <StatisticsData
                data={pos_stats.data ? pos_stats.data.products : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                columns_to_show={[
                  //'productname',
                  //'basecode',
                  'cansizecode',
                  'basevolsum',
                  'cancount',
                  'pricesum',
                ]}
                group_by={'cansizecode'}
                zone={pos_stats?.data?.zone}
                from_date={pos_stats?.data?.daterange[0]}
                to_date={pos_stats?.data?.daterange[1]}
                unit={this.state.unit}
              />
            )}
          </TabPane>
          <TabPane tabId="colorants">
            {this.state.show_chart ? (
              <StatisticsCntChart
                data={pos_stats.data ? pos_stats.data.colorants : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                group_by={'cntcode'}
                zone={pos_stats?.data?.zone}
                unit={this.state.unit}
              />
            ) : (
              <StatisticsData
                data={pos_stats.data ? pos_stats.data.colorants : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                columns_to_show={['cntcode', 'cntvolsum', 'costsum']}
                group_by={'cntcode'}
                zone={pos_stats?.data?.zone}
                from_date={pos_stats?.data?.daterange[0]}
                to_date={pos_stats?.data?.daterange[1]}
                unit={this.state.unit}
              />
            )}
          </TabPane>
          <TabPane tabId="colors">
            {this.state.show_chart ? (
              <StatisticsColorChart
                data={pos_stats.data ? pos_stats.data.colours : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                zone={pos_stats?.data?.zone}
                unit={this.state.unit}
              />
            ) : (
              <StatisticsData
                data={pos_stats.data ? pos_stats.data.colours : []}
                pending={pos_stats.pending}
                error={pos_stats.error}
                columns_to_show={[
                  'colourcode',
                  'basevolsum',
                  'cancount',
                  'pricesum',
                ]}
                zone={pos_stats?.data?.zone}
                from_date={pos_stats?.data?.daterange[0]}
                to_date={pos_stats?.data?.daterange[1]}
                unit={this.state.unit}
              />
            )}
          </TabPane>
        </TabContent>
      </>
    );
  }
}

Statistics.propTypes = {
  t: PropTypes.func.isRequired,
  is_pro: PropTypes.bool.isRequired,
  pos_stats: PropTypes.shape({
    data: PropTypes.shape({
      daterange: PropTypes.array,
      weekdays: PropTypes.array,
      products: PropTypes.array,
      colorants: PropTypes.array,
      colours: PropTypes.array,
      zone: PropTypes.shape({
        currencydecimals: PropTypes.number,
        currencyformat: PropTypes.number,
        currencysymbol: PropTypes.string,
      }).isRequired,
    }),
    pending: PropTypes.bool.isRequired,
    error: PropTypes.any,
  }),
  getPosStats: PropTypes.func.isRequired,
};

function mapStateToProps(store) {
  return {
    pos_stats: store.statistics.pos_stats,
    is_pro: protectionSelectors.is_pro(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      getPosStats: statisticsActions.fetchPosStats,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Statistics)
);
