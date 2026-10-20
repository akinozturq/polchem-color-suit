import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';

import {
  Col,
  Row,
  Button,
  Table,
  CustomInput,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from 'reactstrap';
import CanisterRow from '../CanisterRow.jsx';
import Canister from '../../graphics/Canister';
import {
  RGBColorToHex,
  findObjectByKey,
  CustomScrollbars,
  rightToLeft,
  sortCanistersPanel,
} from 'js/mylib/Utils';
import machineActions, {
  selectors as machineSelectors,
  propType as machineType,
} from 'js/redux/reducers/Machine';
import { createLevelFormatter } from 'js/redux/selectors/Formatters';
import _ from 'lodash';

import { LEVEL_UNITS } from 'js/Constants';
import MachineRefillModal from '../MachineRefillModal';
import RefillHistory from './RefillHistory';
import ColorantBatches from './ColorantBatches';
import LevelInput from './LevelInput';
import Refill from './Refill';
import { offline_mode } from '../../../../Constants.js';

const propTypes = {
  t: PropTypes.func.isRequired,
  fetchMachineColorants: PropTypes.func.isRequired,
  fetchRefillsList: PropTypes.func.isRequired,
  barcode_canister_action: PropTypes.shape({
    barcode: PropTypes.string,
    cntcode: PropTypes.string,
    canisterid: PropTypes.number,
  }),
  clearBarcodeActions: PropTypes.func,
  setMachineColorantsQT: PropTypes.func.isRequired,
  stir: PropTypes.func.isRequired,
  purge: PropTypes.func.isRequired,
  setDropColors: PropTypes.func.isRequired,
  config_values: PropTypes.object.isRequired,
  machine: machineType,
  needFetchMachineColorants: PropTypes.bool,
  dispID: PropTypes.string.isRequired,
  selectedCnt: PropTypes.string,
  formula: PropTypes.array,
  base_check: PropTypes.object,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  moveToFill: PropTypes.func.isRequired,
  cache: PropTypes.object,
  refills_list: PropTypes.array,
  refills_batch_list: PropTypes.array,
  createLevelFormatter: PropTypes.func,
  fetchBatchRefillsList: PropTypes.func,
  current_user: PropTypes.object,
  setMachineBarcodeRefillAction: PropTypes.func.isRequired,
  setRefillTargetCanister: PropTypes.func.isRequired,
};

const defaultProps = {
  formula: null,
  needFetchMachineColorants: true,
};

// tabs
const REFILL = 0;
const COLORANTBATCHES = 2;
const REFILLHISTORY = 3;

class MachineColorants extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      canisterid: null,
      levelFormatter: props.createLevelFormatter(),
      currentTab: 0,
      canisters: {},
      prevColorants: null,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const { colorants } = props.machine; //actually canisters
    if (colorants !== state.prevColorants) {
      const canisters = _.fromPairs(colorants.map((x) => [x.id, x]));
      return {
        prevColorants: colorants,
        canisters,
        originalCanisters: canisters,
        canisterid: canisters[state.canisterid] ? state.canisterid : null,
      };
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState) {
    const { barcode_canister_action, selectedCnt } = this.props;
    if (
      barcode_canister_action &&
      barcode_canister_action !== prevProps.barcode_canister_action
    ) {
      this.selectCanister(barcode_canister_action.canisterid);
    }
    if (selectedCnt && selectedCnt !== prevProps.selectedCnt) {
      this.selectCanisterByCode(selectedCnt);
    }

    const canisterChanged =
      this.props.dispID !== prevProps.dispID ||
      this.state.canisterid !== prevState.canisterid;

    if (canisterChanged && this.state.canisterid != null)
      this.props.moveToFill(this.props.dispID, this.state.canisterid);

    switch (this.state.currentTab) {
      case COLORANTBATCHES:
        if (prevState.currentTab !== COLORANTBATCHES || canisterChanged) {
          const canister = this.selectedCanister();
          this.props.fetchBatchRefillsList(
            this.props.dispID,
            this.state.canisterid,
            canister?.currLevel
          );
        }
        break;
      case REFILLHISTORY:
        if (prevState.currentTab !== REFILLHISTORY || canisterChanged) {
          this.props.fetchRefillsList(this.props.dispID, this.state.canisterid);
        }
        break;
    }
  }

  componentWillUnmount() {
    this.props.clearBarcodeActions();
  }

  hasChanges = () => this.state.canisters !== this.state.originalCanisters; // used from MachinePage via ref

  accessDenied = (key) => {
    const { privileges } = this.props;
    return !_.includes(privileges, key);
  };

  getRefillVolume = () => {
    const { config_values } = this.props;
    return (
      (config_values.refill_custom_refill_amount || 1000) *
      (config_values.refill_factor || 1)
    );
  };

  findCanister = (cntcode) =>
    findObjectByKey(this.props.machine.colorants, 'code', cntcode).object;

  selectedCanister = () => this.state.canisters[this.state.canisterid];

  updateCanister = (canisterid, key, value) => {
    if (canisterid != null && this.state.canisters[canisterid])
      this.setState((state) => ({
        canisters: {
          ...state.canisters,
          [canisterid]: { ...state.canisters[canisterid], [key]: value },
        },
      }));
  };

  purgeCanister = () => {
    // One canister can have multiple circuits, purgeCanister will purge every associated circuit
    const canister = this.selectedCanister();
    if (canister) {
      this.props.setDropColors([RGBColorToHex(canister.rgb)]);
      this.props.purge(
        this.props.dispID,
        canister.circuits.map((circuit) => ({ id: circuit, volume: 1 }))
      );
      this.resetMachineLevels();
    }
  };

  purgeFormula = () => {
    let canisters = this.props.machine.colorants || [];
    canisters = _.intersectionBy(
      canisters,
      this.props.formula.map(({ cntcode }) => ({ code: cntcode })),
      'code'
    );
    if (canisters.length > 0) {
      let purge_formula = [];
      canisters.forEach((c) =>
        c.circuits.forEach((circuit) =>
          purge_formula.push({
            id: circuit,
            volume: c.volume,
          })
        )
      );

      this.props.setDropColors(
        canisters.map((code) => RGBColorToHex(code.rgb))
      );
      this.props.purge(this.props.dispID, purge_formula);

      this.resetMachineLevels();
    }
  };

  stirCanister = () => {
    // One canister can have multiple circuits, stirCanister will stir every associated circuit
    const canister = this.selectedCanister();
    if (canister) {
      canister.circuits.forEach((circuit) => {
        this.props.stir(this.props.dispID, circuit, 1);
      });
    }
  };

  componentDidMount() {
    if (this.props.needFetchMachineColorants) {
      this.resetMachineLevels();
    }
    // Load selected colorant
    const { selectedCnt, barcode_canister_action, formula } = this.props;
    if (selectedCnt) {
      this.selectCanisterByCode(this.props.selectedCnt);
    } else if (barcode_canister_action) {
      this.selectCanister(barcode_canister_action.canisterid);
    } else if (formula) {
      // in case of formula select first colorant from the list
      const canister = this.props.machine.colorants.find(
        (x) => x.cntid === formula[0].cntid
      );
      if (canister) {
        this.selectCanister(canister.id);
      }
    }
  }

  resetMachineLevels = () => {
    this.props.fetchMachineColorants(this.props.dispID);
  };

  saveMachineLevels = () => {
    this.props.setMachineColorantsQT(
      this.props.dispID,
      _.values(this.state.canisters)
    );
  };

  enableClicked = () => {
    const canister = this.selectedCanister();
    this.updateCanister(canister.id, 'enabled', !canister.enabled);
  };

  selectCanisterByCode = (cntcode) => {
    const canister = this.findCanister(cntcode);
    if (canister) {
      this.selectCanister(canister.id);
    }
  };

  selectCanister = (canisterid) => {
    this.setState({ canisterid });
  };

  currLevelChange = (value) => {
    const canister = this.selectedCanister();
    this.updateCanister(
      this.state.canisterid,
      'currLevel',
      Math.min(value, canister.maxLevel)
    );
  };

  warnLevelChange = (value) => {
    const canister = this.selectedCanister();
    this.updateCanister(
      this.state.canisterid,
      'warnLevel',
      Math.min(value, canister.maxLevel)
    );
  };

  barcodeChange = (value) => {
    this.updateCanister(this.state.canisterid, 'barcode', value);
  };

  addColorant = (canister) => {
    const { machine, dispID } = this.props;
    const value = this.getRefillVolume();
    const original = machine.colorants.find((x) => x.id === canister.id);

    const newLevel = Math.min(canister.currLevel + value, canister.maxLevel);
    const delta = newLevel - original.currLevel;

    const colorantRefillCans = [
      {
        dispID,
        canisterIndex: canister.id,
        volume: delta,
        machineid: machine.dbinfo.machineid,
        date: new Date().toISOString(),
        note: '', //TODO? This was always '' in previous code
        user: this.props.current_user?.username || 'Guest',
        batch: '', //TODO? This was always '' in previous code
      },
    ];
    this.updateCanister(canister.id, 'currLevel', newLevel);
    this.updateCanister(canister.id, 'refillCans', colorantRefillCans);
  };

  setUnit = (unit) => {
    const { createLevelFormatter } = this.props;
    const tmp = LEVEL_UNITS.find((u) => u.display_name === unit);
    this.setState({
      levelFormatter: createLevelFormatter(tmp?.unitname),
    });
  };

  refillClicked = (canister) => {
    if (
      this.props.machine.config.colorant_barcode_confirmation ||
      this.props.machine.config.batch_refill ||
      this.props.config_values.enable_warehousing_v4
    ) {
      this.props.setMachineBarcodeRefillAction(canister.cntid, canister.id);
      this.props.setRefillTargetCanister(canister);
    } else {
      this.addColorant(canister);
    }
  };

  render() {
    const { t, formula, machine, dispID, base_check } = this.props;
    let canisters = _.values(this.state.canisters);
    let table_height = { height: 'calc(100vh - 102px - 11rem)' };
    let table_style = 'table-sm table-dark';

    if (formula != null) {
      // limit cnts to ones in formula
      table_style = '';
      table_height = { height: 'calc(100vh - 250px)' };
      canisters = _.intersectionBy(
        canisters,
        formula.map(({ cntcode }) => ({ code: cntcode })),
        'code'
      );

      // base_check means base validation from machine has been made and base dosing is enabled
      // push the base cnt into formula cnts
      if (base_check) {
        const baseCnt = _.find(
          machine.colorants,
          (colorant) => colorant.code === base_check.basecode
        );
        if (baseCnt) canisters.push(baseCnt);
      }
    }

    canisters = sortCanistersPanel(this.props.config_values, canisters);

    const dsp_busy = machine.machine_state ? machine.machine_state.busy : true;
    const canister = this.selectedCanister();
    const refillValue = this.getRefillVolume();

    const disable_add =
      canister && canister.currLevel + refillValue > canister.maxLevel;
    const disable_input = !canister;

    const selected_style = {
      backgroundColor: formula != null ? 'lightblue' : 'darkblue',
    };

    const table_data = canisters.map((canister) => {
      return (
        //TODO: Check what should be used enabled or canEnabled
        canister.canEnable && (
          <tr
            key={canister.id}
            style={
              canister.id === this.state.canisterid ? selected_style : null
            }
          >
            <td
              data-testid={'cnt_' + canister.id}
              onClick={() => this.selectCanister(canister.id)}
            >
              <CanisterRow
                canister={canister}
                levelFormatter={this.state.levelFormatter}
              />
            </td>
          </tr>
        )
      );
    });

    const tabs = [
      t('lbl.refill'),
      t('lbl.canisterDetails'),
      t('lbl.colorantBatches'),
      t('lbl.refillHistory'),
    ];

    const level_unit = this.state.levelFormatter.getUnitName();
    const has_changes = this.hasChanges();

    return (
      <>
        <MachineRefillModal machine={machine} dispID={dispID} />
        <Row className="pt-8 machineColorants__panel">
          <Col sm="4" className="pl-0">
            <Row
              style={{ backgroundColor: 'rgb(17, 51, 71)' }}
              className="mb-1"
            >
              <Col xs={5} className="mt-2">
                {t('lbl.canisters', 'Canisters')}
              </Col>
              <Col className="mt-2" style={{ textAlign: 'center' }}>
                {t('lbl.levels', 'Levels')}
              </Col>
            </Row>
            <Row>
              <Col>
                <CustomScrollbars style={table_height}>
                  <>
                    <Table className={table_style}>
                      <tbody>{table_data}</tbody>
                    </Table>

                    {
                      /**Purging formula  if presend*/
                      this.props.formula ? (
                        <Button
                          className="btn-primary m-16 fill-available "
                          onClick={this.purgeFormula}
                          disabled={
                            dsp_busy ||
                            this.accessDenied('machine_command_purge')
                          }
                          data-denied={this.accessDenied(
                            'machine_command_purge'
                          )}
                        >
                          {t('fn.purgeAll', 'Purge all')}
                        </Button>
                      ) : null
                    }
                  </>
                </CustomScrollbars>
              </Col>
            </Row>
          </Col>
          <Col
            sm={8}
            className="p-0"
            style={{
              backgroundColor: '#112E40',
            }}
          >
            <Nav>
              {tabs.map((tab, index) =>
                offline_mode && index === 1 ? null : (
                  <NavItem
                    data-testid={'colorant_tab_' + index}
                    style={{
                      width: offline_mode ? '33%' : '25%',
                      textAlign: 'center',
                    }}
                    key={index}
                  >
                    <NavLink
                      style={{
                        width: '100%',
                        height: '100%',
                        color: 'white',
                        backgroundColor:
                          this.state.currentTab === index
                            ? '#112E40'
                            : '#113347',
                        border: 'none !important',
                        borderRadius: '0',
                        borderRight: '1px solid #256E9B',
                        borderTop:
                          this.state.currentTab === index
                            ? '1px solid  #256E9B'
                            : 'none',
                        borderBottom:
                          this.state.currentTab === index
                            ? 'none'
                            : '1px solid #256E9B',
                      }}
                      active={this.state.currentTab === index}
                      onClick={() => this.setState({ currentTab: index })}
                    >
                      {tab}
                    </NavLink>
                  </NavItem>
                )
              )}
            </Nav>
            <Row
              className="mt-16"
              style={{
                height: 'calc(100% - 5rem)',
              }}
            >
              <Col
                style={{
                  display: this.state.currentTab > 1 ? 'none' : 'block',
                }}
                sm={7}
              >
                <Row className="pt-1">
                  <CustomInput
                    type="checkbox"
                    id="cnt_can_enabled"
                    label={t('lbl.canisterEnabled', 'Canister enabled')}
                    disabled={
                      this.accessDenied('canister_enabled_change') || !canister
                    }
                    checked={!canister ? false : canister.enabled}
                    onChange={this.enableClicked}
                  />
                </Row>
                <Row style={{ margin: 'auto', padding: '1rem' }}>
                  <Canister
                    canister={canister}
                    warnChanged={
                      (!this.accessDenied('canister_warning_level_change') &&
                        this.warnLevelChange) ||
                      null
                    }
                    currLevelChanged={
                      (!this.accessDenied('canister_level_change') &&
                        this.currLevelChange) ||
                      null
                    }
                    shotFormatter={this.state.levelFormatter}
                  />
                </Row>

                <Row>
                  <Col sm="5">
                    <Button
                      data-testid="btn_canister_save"
                      className="btn-primary"
                      disabled={!has_changes}
                      onClick={this.saveMachineLevels}
                    >
                      {t('fn.save', 'Save')}
                    </Button>
                  </Col>
                  <Col sm="2" />
                  <Col sm="5">
                    <Button
                      data-testid="btn_canister_reset"
                      className="btn-warning"
                      disabled={!has_changes}
                      onClick={this.resetMachineLevels}
                    >
                      {t('fn.uiReset', 'Reset')}
                    </Button>
                  </Col>
                </Row>
              </Col>

              <Col
                sm={this.state.currentTab > 1 ? 12 : 5}
                style={{
                  borderLeft: rightToLeft()
                    ? 'none'
                    : '.125rem dashed  #e7eff5',
                  borderRight: rightToLeft()
                    ? '.125rem dashed  #e7eff5'
                    : 'none',
                  padding: '0',
                }}
              >
                <TabContent activeTab={this.state.currentTab}>
                  <TabPane tabId={REFILL}>
                    <Refill
                      t={t}
                      darkIcon={!!formula}
                      canister={canister}
                      refillValue={refillValue}
                      level_unit={level_unit}
                      disable_input={disable_input}
                      disable_add={disable_add}
                      dsp_busy={dsp_busy}
                      levelFormatter={this.state.levelFormatter}
                      setUnit={this.setUnit}
                      refillClicked={this.refillClicked}
                      accessDenied={this.accessDenied}
                      currLevelChange={this.currLevelChange}
                      purgeCanister={this.purgeCanister}
                      stirCanister={this.stirCanister}
                      machine={machine}
                      canisterid={this.state.canisterid}
                    />
                  </TabPane>
                  <TabPane tabId={1}>
                    <LevelInput
                      label={t('lbl.canisterCapacity', 'Canister capacity')}
                      canister={canister}
                      prop="maxLevel"
                      levelFormatter={this.state.levelFormatter}
                      readOnly
                      borderBottom
                    />
                    <LevelInput
                      label={t('lbl.warningLevelInCanister', 'Warning level')}
                      canister={canister}
                      prop="warnLevel"
                      levelFormatter={this.state.levelFormatter}
                      readOnly={
                        this.accessDenied('canister_warning_level_change') ||
                        !canister
                      }
                      onBlur={
                        (!this.accessDenied('canister_warning_level_change') &&
                          this.warnLevelChange) ||
                        null
                      }
                      dataTestid="canister_warning_level"
                    />
                    <LevelInput
                      label={t('lbl.reserveLevelInCanister', 'Reserve level')}
                      canister={canister}
                      prop="minLevel"
                      levelFormatter={this.state.levelFormatter}
                      readOnly
                      borderBottom
                    />
                    <LevelInput
                      label={t('lbl.barcode', 'Barcode')}
                      canister={canister}
                      prop="barcode"
                      readOnly={
                        this.accessDenied('canister_barcode_change') ||
                        !canister
                      }
                      onBlur={
                        (!this.accessDenied('canister_barcode_change') &&
                          this.barcodeChange) ||
                        null
                      }
                      dataTestid="canister_barcode"
                    />
                  </TabPane>
                  <TabPane tabId={COLORANTBATCHES}>
                    <ColorantBatches
                      t={t}
                      canister={canister}
                      canisterid={this.state.canisterid}
                      refills_batch_list={this.props.refills_batch_list}
                      cache_cnts={this.props.cache?.cnts}
                    />
                  </TabPane>
                  <TabPane tabId={REFILLHISTORY}>
                    <RefillHistory
                      t={t}
                      canister={canister}
                      levelFormatter={this.state.levelFormatter}
                      refills_list={this.props.refills_list}
                    />
                  </TabPane>
                </TabContent>
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  }
}

MachineColorants.propTypes = propTypes;
MachineColorants.defaultProps = defaultProps;

function mapStateToProps(state, ownProps) {
  const { dispID } = ownProps;
  return {
    dispID,
    privileges: state.user.current_user.privileges,
    config_values: state.configurations.config_values,
    current_user: state.user.current_user,
    refills_list: machineSelectors.refills_list(state, dispID),
    refills_batch_list: machineSelectors.refills_batch_list(state, dispID),
    createLevelFormatter: createLevelFormatter(state),
    cache: state.cache,
    barcode_canister_action: state.machine.barcode_canister_action,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchMachineColorants: machineActions.fetchMachineColorants,
      setMachineColorantsQT: machineActions.setMachineColorantsQT,
      moveToFill: machineActions.moveToFill,
      stir: machineActions.stir,
      purge: machineActions.purge,
      setDropColors: machineActions.setDropColors,
      clearBarcodeActions: machineActions.clearBarcodeActions,
      fetchRefillsList: machineActions.fetchMachineRefillsList,
      fetchBatchRefillsList: machineActions.fetchMachineBatchRefillsList,
      setMachineBarcodeRefillAction:
        machineActions.setMachineBarcodeRefillAction,
      setRefillTargetCanister: machineActions.setRefillTargetCanister,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps, null, {
  forwardRef: true,
})(MachineColorants);
