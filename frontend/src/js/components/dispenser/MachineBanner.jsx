import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Button, Col, Row, UncontrolledTooltip } from 'reactstrap';
import {
  MACHINE_STATE_DISPENSE,
  MACHINE_STATE_GRAVIMETRIC_DISPENSING,
  MACHINE_HIDE_MESSAGES,
  MACHINE_MSG_ID_OPEN_REFILL_PANEL,
  MACHINE_ACTION_OK,
  MACHINE_ACTION_CONTINUE,
  MACHINE_ACTION_RETRY,
  MACHINE_ACTION_CANCEL,
  MACHINE_FLUID_MSG_ID_REMOVE_CAN,
  BARCODE_VALIDATION_OK,
  BARCODE_VALIDATION_ERROR,
  BARCODE_VALIDATION_SCAN,
  BARCODE_VALIDATION_CONFIRM,
  BARCODE_VALIDATION_NONE,
} from '../../Constants';
import machineActions, {
  selectors as machineSelectors,
} from 'js/redux/reducers/Machine';
import barcodeActionActions from 'js/redux/reducers/BarcodeAction';
import { selectors as cacheSelectors } from 'js/redux/reducers/Cache';
import printTaskActions from 'js/redux/reducers/PrintTask';
import { push } from 'connected-react-router';
import _ from 'lodash';
import { RGBColorToHex, rightToLeft } from 'js/mylib/Utils';
import ColorThumbnail from 'js/components/shared/ColorThumbnail';
import Dispense from './graphics/Dispense';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MachineColorants from './machinePage/canisters/MachineColorants';
import SlidingPane from 'react-sliding-pane';
import orderActions, { cnts_to_tint } from '../../redux/reducers/Order';
import { getColorantWarn } from '../../mylib/Utils';
import { createLevelFormatter } from '../../redux/selectors/Formatters';
import { hasPrivilege } from '../../mylib/Privileges';
import TextFit from '../shared/TextFit';
import { mstateErrorToTranslationKey } from 'js/mylib/MachineErrorUtils';

const propTypes = {
  machine: PropTypes.shape(),
  dispID: PropTypes.string.isRequired,
  drop_colors: PropTypes.array.isRequired,
  t: PropTypes.func.isRequired,
  i18n: PropTypes.object.isRequired,
  cnts: PropTypes.array,
  machineAction: PropTypes.func.isRequired,
  fetchMachineState: PropTypes.func.isRequired,
  order: PropTypes.shape({
    engine_check: PropTypes.array,
    can: PropTypes.shape(),
    tinting_error: PropTypes.object,
  }),
  config_values: PropTypes.object.isRequired,
  barcodeAction: PropTypes.shape({
    barcode: PropTypes.string,
    validation_state: PropTypes.string.isRequired,
  }),
  setBarcodeValidationState: PropTypes.func.isRequired,
  setCan: PropTypes.func.isRequired,
  cap: PropTypes.func,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  processTasksAfterError: PropTypes.func.isRequired,
  navigateTo: PropTypes.func,
  setMachineSlideOverVisible: PropTypes.func.isRequired,
  slideOverVisible: PropTypes.bool,
  createLevelFormatter: PropTypes.func,
  cache: PropTypes.shape(),
  current_user: PropTypes.shape({
    privileges: PropTypes.arrayOf(PropTypes.string),
  }),
  refills_list: PropTypes.array,
  refills_batch_list: PropTypes.array,
  shotFormatter: PropTypes.object.isRequired,
};

const defaultProps = {
  machine: {},
};

const DISPENSE_INSTRUCTIONS_BOX_ID = 'dispense_instructions_box';

function messageDigest(machine_state) {
  if (!machine_state?.msgText) return null;
  const { msgText, stateChangeCounter, messageSupported } = machine_state;
  return JSON.stringify([msgText, stateChangeCounter, messageSupported]);
}

class MachineBanner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      answered_message: null,
      selected_cntcode: null,
      barcode_warning: false,
      progressColorants: [],
      doneColorants: [],
    };
  }

  static getDerivedStateFromProps(props, state) {
    let result = null;
    if (
      state.answered_message !== messageDigest(props.machine?.machine_state)
    ) {
      result = { answered_message: null };
    }
    // Reset progress if it's not available
    if (!props.machine?.machine_state?.progress) {
      return { ...result, progressColorants: [], doneColorants: [] };
    }

    // Handle case when remove can message is shown.
    if (
      props.machine?.machine_state?.msgID === MACHINE_FLUID_MSG_ID_REMOVE_CAN
    ) {
      return {
        ...result,
        doneColorants: _.union(state.doneColorants, state.progressColorants),
      };
    }
    // Add colorant codes to state.doneColorants when they disappears
    // from machine_state.progress.colorantItems
    const progressColorants =
      props.machine?.machine_state?.progress?.colorantItems || [];
    if (progressColorants.length || state.progressColorants.length) {
      const doneJustNow = _.difference(
        state.progressColorants,
        progressColorants
      );
      return {
        ...result,
        progressColorants,
        doneColorants: _.union(state.doneColorants, doneJustNow),
      };
    }
    return result;
  }

  openMachinePopup = (cntcode) => {
    this.setState({
      selected_cntcode: cntcode,
    });
    this.props.setMachineSlideOverVisible(this.props.dispID, true);
  };

  componentDidMount() {
    // Reload machine state for machine 0
    this.props.fetchMachineState(this.props.dispID);
  }

  cancelTinting = () => {
    this.props.machineAction(this.props.dispID, MACHINE_ACTION_CANCEL);
    if (this.props.order.tinting_error) {
      this.props.processTasksAfterError();
    }
    this.props.navigateTo('/');
  };

  answerQuestion = (ans) => {
    this.setState({
      answered_message: messageDigest(this.props.machine.machine_state),
    });
    if (ans === MACHINE_ACTION_CANCEL) {
      this.cancelTinting();
    } else {
      this.props.machineAction(this.props.dispID, ans);
    }
  };

  barcodeAnswer = (ans) => {
    if (ans === MACHINE_ACTION_CANCEL) {
      // Cancelling the tint
      this.setState({
        answered_message: messageDigest(this.props.machine.machine_state),
      });
      this.cancelTinting();
    } else if (ans === MACHINE_ACTION_CONTINUE) {
      this.props.setBarcodeValidationState(BARCODE_VALIDATION_OK);
    }
  };

  getMachineText = (mstate) => {
    const { t, i18n, barcodeAction } = this.props;

    switch (barcodeAction.validation_state) {
      case BARCODE_VALIDATION_NONE:
      case BARCODE_VALIDATION_OK:
        break;
      case BARCODE_VALIDATION_SCAN:
        return <div>{t('msg.scanPaintBarcode')}</div>;
      case BARCODE_VALIDATION_ERROR:
        return <div>{t('msg.incorrectBarcode')}</div>;
      case BARCODE_VALIDATION_CONFIRM:
        return <div>{t('msg.correctBarcode')}</div>;
    }

    if (mstate.msgID) {
      if (MACHINE_HIDE_MESSAGES.includes(mstate.msgID)) {
        return '';
      }
      if (mstate.msgID === 2 && mstate.orderItem) {
        // Ask for inserting can
        return (
          <div>
            <p className="m-0">
              {t('msg.insertCanAndConfirm.insert', 'Insert')}
            </p>
            <table className="table-machine">
              <tbody>
                <tr>
                  <td>{t('lbl.product.colon', 'Product:')}</td>
                  <td>{mstate.orderItem.productName}</td>
                </tr>
                <tr>
                  <td>{t('lbl.base.colon', 'Base:')}</td>
                  <td>{mstate.orderItem.formula.base}</td>
                </tr>
                <tr>
                  <td>{t('lbl.can.colon', 'Can:')}</td>
                  <td>{mstate.orderItem.can.name}</td>
                </tr>
              </tbody>
            </table>
            <p className="m-0">
              {t('msg.insertCanAndConfirm.andConfirm', 'and confirm')}
            </p>
          </div>
        );
      }

      const translationKey = mstateErrorToTranslationKey(mstate, i18n);

      return (
        <TextFit
          containerId={DISPENSE_INSTRUCTIONS_BOX_ID}
          text={
            translationKey
              ? t(translationKey, {
                  ...mstate.msgParams,
                  defaultValue: mstate.msgText,
                })
              : mstate.msgText
          }
        />
      );
    }
  };

  getMachineButtons = (mstate) => {
    const { t } = this.props;
    if (mstate) {
      if (
        !mstate.barcode_scanning &&
        MACHINE_HIDE_MESSAGES.includes(mstate.msgID)
      ) {
        return null;
      }
      if (
        mstate.msgText &&
        this.state.answered_message !== messageDigest(mstate)
      ) {
        return mstate.msgButtons?.map((name, i) => (
          <Button
            data-denied={!hasPrivilege('order_tinting_process')}
            disabled={!hasPrivilege('order_tinting_process')}
            id={'action' + _.startCase(_.toLower(name))}
            autoFocus={i === 0}
            color={
              name === MACHINE_ACTION_OK ||
              name === MACHINE_ACTION_CONTINUE ||
              name === MACHINE_ACTION_RETRY
                ? 'primary'
                : 'warning'
            }
            key={name}
            onClick={() => {
              if (mstate.barcode_scanning) {
                this.barcodeAnswer(name);
              } else {
                this.answerQuestion(name);
              }
            }}
          >
            {t('machine.fn.' + name)}
          </Button>
        ));
      }
    }
  };

  getMachineState = () => {
    const { machine, barcodeAction, t } = this.props;
    let mstate = machine.machine_state || {};

    switch (barcodeAction.validation_state) {
      case BARCODE_VALIDATION_NONE:
      case BARCODE_VALIDATION_OK:
        // No special message or action needed
        break;
      case BARCODE_VALIDATION_SCAN:
        return {
          msgText: t('msg.scanPaintBarcode'),
          msgButtons: [MACHINE_ACTION_CANCEL],
          barcode_scanning: true,
          msgID: mstate.msgID,
        };
      case BARCODE_VALIDATION_ERROR:
        return {
          msgText: t('msg.incorrectBarcode'),
          msgButtons: [MACHINE_ACTION_CANCEL],
          barcode_scanning: true,
          msgID: mstate.msgID,
        };
      case BARCODE_VALIDATION_CONFIRM:
        return {
          msgText: t('msg.correctBarcode'),
          msgButtons: [MACHINE_ACTION_CONTINUE, MACHINE_ACTION_CANCEL],
          barcode_scanning: true,
          msgID: mstate.msgID,
        };
    }

    return mstate;
  };

  check_formula_split_refill = () => {
    const { machine } = this.props;
    let mstate = machine.machine_state || {};

    if (mstate.msgID === MACHINE_MSG_ID_OPEN_REFILL_PANEL) {
      // Ok to answer back to machine
      this.answerQuestion(mstate.msgButtons[0]);
    }
  };

  getMachineSlideOver = () => {
    const { t, machine, order, slideOverVisible, setMachineSlideOverVisible } =
      this.props;

    const cnts = order.engine_check;
    let cnt_with_lowest_volume = null;
    if (cnts) {
      const machineCnts = cnts
        .map((cnt) =>
          machine.colorants.find((mcnt) => mcnt?.code === cnt.cntcode)
        )
        .filter(Boolean);
      if (machineCnts.length)
        cnt_with_lowest_volume = machineCnts.reduce((prev, current) => {
          return prev.currLevel <= current.currLevel ? prev : current;
        });
    }
    return (
      <SlidingPane
        className="ml-16 mr-16"
        closeIcon={<FontAwesomeIcon icon="times" color="red" />}
        isOpen={slideOverVisible}
        title={t('lbl.machineColorants', 'Machine colorants')}
        from="bottom"
        width="calc(100%-2rem)"
        onRequestClose={() => {
          setMachineSlideOverVisible(this.props.dispID, false);
          this.props.setCan(order.can);
          this.check_formula_split_refill();
        }}
      >
        <MachineColorants
          t={t}
          machine={machine}
          selectedCnt={
            /* If refill is required during a process (e.g. tint process for split formula dispensing), then select canister with the lowest current level */
            this.state.selected_cntcode ||
            (machine.machine_state?.currentProcess !== null && window.qtside)
              ? cnt_with_lowest_volume?.code
              : null
          }
          dispID={this.props.dispID}
          formula={cnts}
        />
      </SlidingPane>
    );
  };

  render() {
    const mstate = this.getMachineState();

    const { machine, cnts, shotFormatter, config_values } = this.props;
    const show_formula_amounts = !config_values?.hide_formula_volumes;
    let dispensing = false;
    if (mstate) {
      dispensing =
        (mstate.state === MACHINE_STATE_DISPENSE ||
          mstate.state === MACHINE_STATE_GRAVIMETRIC_DISPENSING) &&
        mstate.msgID !== MACHINE_FLUID_MSG_ID_REMOVE_CAN;
    }
    const formula_splitting = _.get(machine, 'config.formula_splitting', false);

    let frm = null;
    let frm_tooltip = null;
    const tint_cnts = cnts_to_tint(this.props.order, true);
    if (tint_cnts) {
      frm = tint_cnts.map((cnt) => (
        <Row
          className={rightToLeft() ? 'pr-2' : 'pl-2'}
          key={cnt.cntid + cnt.cntcode}
          onClick={() => this.openMachinePopup(cnt.cntcode)}
        >
          <Col
            xs={3}
            style={{ display: 'flex', alignItems: 'center' }}
            className={'m-0 p-0'}
          >
            <ColorThumbnail rgb={cnt.rgb} size="1rem" />
          </Col>
          {this.state.doneColorants.includes(cnt.cntcode) && (
            <Col xs={3} className={'m-0 p-0'}>
              <FontAwesomeIcon icon="check" size="1rem" />
            </Col>
          )}

          <Col>
            <div
              className={'m-0 p-0 ml-1'}
              style={{ fontSize: '0.85rem', overflow: 'hidden' }}
              data-testid={'cnt_' + cnt.cntcode}
            >
              {show_formula_amounts
                ? shotFormatter.format({
                    volume: cnt.volume,
                    specificgravity: cnt.specificgravity,
                  })
                : cnt.cntcode}
            </div>
          </Col>

          <Col
            xs={2}
            className={'m-0 p-0'}
            style={{
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center',
              display: 'flex',
            }}
          >
            {getColorantWarn(cnt.warn, formula_splitting)}
          </Col>
        </Row>
      ));
      frm_tooltip = tint_cnts.map((cnt) => cnt.cntcode).join('\n');
    }
    const progressColors =
      machine.info && machine.info.progressSupported && mstate.progress
        ? mstate.progress.colorantItems.map(
            (clr) =>
              cnts.find((cnt) => cnt.cntcode === clr) &&
              RGBColorToHex(cnts.find((cnt) => cnt.cntcode === clr).rgb)
          )
        : this.props.drop_colors;

    return (
      <>
        <Col md="9" className="machine-box">
          {mstate && mstate.error && (
            <FontAwesomeIcon
              icon="exclamation-triangle"
              className="machine-error-icon"
            />
          )}

          <div className="card d-flex flex-row align-items-stretch justify-content-center align-content-center">
            <div
              id="frm_div"
              className="col-md-2 d-flex flex-column justify-content-center align-content-center dispense-machineActions-container pointer-cursor"
              style={
                rightToLeft()
                  ? { paddingLeft: 0, paddingRight: '1.2rem' }
                  : { paddingRight: 0, paddingLeft: '1.2rem' }
              }
            >
              {frm}
            </div>
            {frm_tooltip && (
              <UncontrolledTooltip placement="right" target="frm_div">
                <p style={{ whiteSpace: 'pre-line' }}>{frm_tooltip}</p>
              </UncontrolledTooltip>
            )}
            <div className="col-md-8 dispense-instructions-container">
              <div
                className="card-img-overlay d-flex flex-row flex-grow-1 justify-content-center align-items-center align-content-center"
                id={DISPENSE_INSTRUCTIONS_BOX_ID}
                style={{
                  position: 'relative',
                  top: 'auto',
                  bottom: 'auto',
                  right: 'auto',
                  left: 'auto',
                }}
              >
                <div className="text-center d-flex flex-column flex-row flex-grow-1 justify-content-center align-items-center align-content-center">
                  {this.getMachineText(mstate)}
                  {machine.info &&
                  machine.info.progressSupported &&
                  mstate.progress
                    ? mstate.progress.currentTask === 'dispensing' &&
                      mstate.progress.colorantItems.map((clr) => {
                        const decimals = mstate.progress.isGravimetric
                          ? (mstate.progress.scaleResolution ?? 2)
                          : 2;
                        return (
                          <p key={clr}>
                            {clr} -{' '}
                            {mstate.progress.colorantAmounts
                              .find((colorant) => colorant.code === clr)
                              ?.volume.toFixed(decimals) || '0.00'}
                            {mstate.progress.isGravimetric ? ' g' : ' ml'}
                          </p>
                        );
                      })
                    : null}
                </div>
              </div>
            </div>
            <div className="col-md-2 d-flex flex-column justify-content-between dispense-animation-container">
              <div style={{ marginLeft: '-8px' }}>
                <Dispense
                  height={16 * 12} // 13 rem height!
                  dispensing={dispensing}
                  progress={
                    machine.info &&
                    machine.info.progressSupported &&
                    mstate.progress
                      ? true
                      : false
                  }
                  color={progressColors}
                />
              </div>

              {/* <img alt='toptint' className="img-fluid d-block float-none" src={machineTintingTop}    style={{margin:'0 auto',maxWidth:'100%', width:'100%', maxHeight:'6rem', height:'auto'}}/>
              <div style={{margin:'0 auto',maxWidth:'100%',  maxHeight:'45px', display:'flex', overflow:'hidden'}}>
                {dispensing && <Icon fill="#3F00f4" />}
                {!window.qtside && <Icon fill="#3F00f4" />}
              </div>
              <img alt='dowtint' className="img-fluid d-block float-none" src={machineTintingBottom}    style={{margin:'0 auto',maxWidth:'30%', width:'100%', maxHeight:'6rem', height:'auto'}}/>
               */}
            </div>
          </div>
        </Col>
        <Col
          md="3"
          className={
            'info-buttons dispense-buttons ' +
            (rightToLeft() ? 'pr-16' : 'pl-16')
          }
        >
          {this.getMachineButtons(mstate)}
        </Col>
        {this.getMachineSlideOver()}
      </>
    );
  }
}

MachineBanner.propTypes = propTypes;
MachineBanner.defaultProps = defaultProps;

function mapStateToProps(state, ownProps) {
  return {
    machine: machineSelectors.machine(state, ownProps.dispID),
    cnts: cacheSelectors.cnts(state),
    drop_colors: machineSelectors.drop_colors(state),
    order: state.order,
    config_values: state.configurations.config_values,
    barcodeAction: state.barcodeaction,
    privileges: state.user.current_user.privileges,
    createLevelFormatter: createLevelFormatter(state),
    slideOverVisible: machineSelectors.slideOverVisible(state, ownProps.dispID),
    shotFormatter: state.configurations.shotFormatter,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      machineAction: machineActions.machineAction,
      fetchMachineState: machineActions.fetchMachineState,
      setMachineSlideOverVisible: machineActions.setMachineSlideOverVisible,
      setCan: orderActions.setCan,
      processTasksAfterError: printTaskActions.processTasksAfterError,
      navigateTo: push,
      fetchMachineError: machineActions.fetchMachineError,
      setBarcodeValidationState: barcodeActionActions.setValidationState,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachineBanner)
);
