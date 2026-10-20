import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import statisticActions from 'js/redux/reducers/Statistics';
import {
  Button,
  Card,
  CardBody,
  Col,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from 'reactstrap';
import SlidingPane from 'react-sliding-pane';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatISODate, statsDefaultDateRange } from '../../../mylib/DateUtils';
import { propType as machineType } from '../../../redux/reducers/Machine';
import MachinePurgeStatsTable from './MachinePurgeStatsTable';
import MachinePurgeStatsCnts from './MachinePurgeStatsCnts';
import { addYears, clamp, isValid, parseISO } from 'date-fns';
import { CustomDatePicker } from '../../shared/CustomDatePicker.jsx';

class MachinePurgeStatistics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      active_tab: 0,
      disableLoad: true,
      formControls: statsDefaultDateRange(), // current values
      lastValid: statsDefaultDateRange(), // last valid values
    };
  }

  fetchData = () => {
    const { start_date, end_date } = this.state.lastValid;
    const { machineid } = this.props.machine.dbinfo;
    this.props.fetchPurge(start_date, end_date, machineid);
    this.setState({ disableLoad: true });
  };

  reset = () => {
    this.setState({
      formControls: statsDefaultDateRange(),
      lastValid: statsDefaultDateRange(),
      disableLoad: false,
    });
  };

  changeHandler = (event) => {
    const { name, value } = event.target;
    if (isValid(parseISO(value))) {
      this.setState((state) => ({
        lastValid: { ...state.lastValid, [name]: value },
        disableLoad: false,
      }));
    }
    this.setState((state) => ({
      formControls: { ...state.formControls, [name]: value },
    }));
  };

  blurStartHandler = () => {
    // limit range to one year
    this.setState((state) => {
      const { start_date, end_date } = state.lastValid;
      const start = parseISO(start_date);
      const range = {
        start_date,
        end_date: formatISODate(
          clamp(parseISO(end_date), { start, end: addYears(start, 1) })
        ),
      };
      return {
        formControls: range,
        lastValid: range,
      };
    });
  };

  blurEndHandler = () => {
    // limit range to one year
    this.setState((state) => {
      const { start_date, end_date } = state.lastValid;
      const end = parseISO(end_date);
      const range = {
        start_date: formatISODate(
          clamp(parseISO(start_date), { start: addYears(end, -1), end })
        ),
        end_date,
      };
      return {
        formControls: range,
        lastValid: range,
      };
    });
  };

  render() {
    const {
      t,
      showPurgeStats,
      purge: { pending },
    } = this.props;

    const maxDate = formatISODate(new Date());

    return (
      <SlidingPane
        isOpen={showPurgeStats}
        from="bottom"
        width="100%"
        closeIcon={<FontAwesomeIcon icon="times" color="red" />}
        onRequestClose={this.props.toggle}
        title={t('lbl.statisticsOfPurge', 'Purge statistics')}
      >
        <Card style={{ borderRadius: 0, height: '100%' }}>
          <CardBody>
            <form>
              <Row>
                <Col xs="3" className="p-0">
                  {/* From date */}

                  <CustomDatePicker
                    prefix={t('lbl.from.colon', 'From:')}
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
                    onBlur={this.blurStartHandler}
                  />
                </Col>
                <Col xs="3" className="p-0">
                  {/* To date */}
                  <CustomDatePicker
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
                    onBlur={this.blurEndHandler}
                  />
                </Col>

                <Col xs="3" className="pl-2">
                  <Button
                    onClick={this.fetchData}
                    className="btn-small"
                    disabled={this.state.disableLoad || pending}
                  >
                    {t('fn.load', 'Load')}
                  </Button>
                </Col>
                <Col xs="3">
                  <Button onClick={this.reset} className="btn-small">
                    {t('fn.resetFields', 'Reset fields')}
                  </Button>
                </Col>
              </Row>
            </form>
            <Row>
              <Col>
                <Nav tabs>
                  <NavItem>
                    <NavLink
                      active={this.state.active_tab === 0}
                      onClick={() => this.setState({ active_tab: 0 })}
                      style={{
                        borderColor:
                          this.state.active_tab === 0
                            ? '#dee2e6 #dee2e6 transparent'
                            : 'none',
                        border:
                          this.state.active_tab === 0 ? '1px solid' : 'none',
                        borderBottom:
                          this.state.active_tab === 0 ? 'transparent' : 'none',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {t('lbl.overview', 'Overview')}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      active={this.state.active_tab === 1}
                      onClick={() => this.setState({ active_tab: 1 })}
                      style={{
                        borderColor:
                          this.state.active_tab === 1
                            ? '#dee2e6 #dee2e6 transparent'
                            : 'none',
                        border:
                          this.state.active_tab === 1 ? '1px solid' : 'none',
                        borderBottom:
                          this.state.active_tab === 1 ? 'transparent' : 'none',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {t('lbl.colorantDetails', 'Colorant details')}
                    </NavLink>
                  </NavItem>
                </Nav>

                <TabContent activeTab={this.state.active_tab}>
                  <TabPane tabId={0}>
                    {/** Purge overview */}
                    <MachinePurgeStatsTable />
                  </TabPane>
                  <TabPane tabId={1}>
                    {/** Cnt purge details */}
                    <MachinePurgeStatsCnts machine={this.props.machine} />
                  </TabPane>
                </TabContent>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </SlidingPane>
    );
  }
}

MachinePurgeStatistics.propTypes = {
  t: PropTypes.func.isRequired,
  machine: machineType,
  showPurgeStats: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  purge: PropTypes.shape({
    pending: PropTypes.bool.isRequired,
    data: PropTypes.any,
    error: PropTypes.any,
  }),
  fetchPurge: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    purge: state.statistics.purge,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchPurge: statisticActions.fetchPurge,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachinePurgeStatistics)
);
