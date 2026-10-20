import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalBody,
  Row,
  Col,
  Button,
  ModalHeader,
  ModalFooter,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import machineActions, {
  propType as machineType,
  selectors as machineSelectors,
} from 'js/redux/reducers/Machine';
import barcodeActions from 'js/redux/reducers/BarcodeAction';
import ColorantBarcode from './ColorantBarcode';
import { selectors as userSelectors } from '../../../redux/reducers/User';
import BatchNumber from './BatchNumber';
import ColorThumbnail from '../../shared/ColorThumbnail';
import inventoryActions from '../../../redux/reducers/Inventory';
import { validate_machine_barcode } from './BarcodeValidator';

const NO_NEED_TO_CHECK = 'NO_NEED';

class MachineRefillModal extends React.Component {
  constructor(props) {
    super(props);

    this.batchNumber = React.createRef();
    this.state = {
      original_barcode_refill_action: null,
      original_barcode_canister_action: null,
      canister_barcode: '',
      colorant_barcode: '',
      batch_number: '',
      batch_note: '',
    };
  }

  handleBatchNumberChange = (e) => {
    this.setState({ batch_number: e.target.value });
  };

  handleBatchNoteChange = (e) => {
    this.setState({ batch_note: e.target.value });
  };

  static getDerivedStateFromProps(props, state) {
    let new_state = {};

    if (
      props.barcode_canister_action !== state.original_barcode_canister_action
    ) {
      new_state.original_barcode_canister_action =
        props.barcode_canister_action;

      if (props.barcode_canister_action) {
        new_state.canister_barcode =
          props.barcode_canister_action.barcode || '';
      }
    }

    if (props.barcode_refill_action !== state.original_barcode_refill_action) {
      new_state.original_barcode_refill_action = props.barcode_refill_action;

      if (props.barcode_refill_action) {
        new_state.colorant_barcode = props.barcode_refill_action.barcode || '';
      }
    }

    return new_state;
  }

  clear_actions = () => {
    this.props.clearBarcodeActions();
    this.props.setRefillTargetCanister(null);

    // Small workaround for hiding the modal.
    this.setState({
      original_barcode_refill_action: null,
      original_barcode_canister_action: null,
      canister_barcode: '',
      colorant_barcode: '',
      batch_number: '',
      batch_note: '',
    });
  };

  get_amount_to_add = (get_cansize = false) => {
    const {
      cache,
      target_canister: canister,
      config_values,
      barcode_refill_action,
      manual_cnt_barcode_details,
    } = this.props;

    // Initial values
    let to_add =
      (config_values.refill_custom_refill_amount || 1000) *
      (config_values.refill_factor || 1);

    /**
     * Barcode validation
     */
    const refill_action = barcode_refill_action || manual_cnt_barcode_details;
    const cansize = refill_action
      ? cache.cansizes.find((c) => c.cansizeid === refill_action.cansizeid)
      : null;

    if (cansize) {
      to_add = cansize.nominalamount * (config_values.refill_factor || 1);
    }
    if (canister) {
      if (canister.currLevel + to_add > canister.maxLevel) {
        to_add = 0;
      }
    }

    if (get_cansize) {
      return { cansize, to_add };
    }
    return to_add;
  };

  save_changes = () => {
    const { machine, dispID, target_canister, current_user, config_values } =
      this.props;

    // Initial values
    const { cansize, to_add } = this.get_amount_to_add(true);
    console.log('to_add', to_add, cansize);
    const canister = { ...target_canister };

    /**
     * Batch number saving
     */
    if (machine?.config?.batch_refill || config_values.enable_warehousing_v4) {
      const colorantRefillCans = canister.refillCans
        ? [...canister.refillCans]
        : [];
      const refill = {
        dispID,
        canisterIndex: canister.id,
        volume: to_add,
        machineid: machine.dbinfo.machineid,
        date: new Date().toISOString(),
        note: this.state.batch_note,
        user: current_user?.username ? current_user?.username : 'Guest',
        batch: this.state.batch_number,
      };
      colorantRefillCans[colorantRefillCans.length - 1]
        ? (colorantRefillCans[colorantRefillCans.length - 1] = refill)
        : (colorantRefillCans[0] = refill);
      canister.refillCans = colorantRefillCans;
    }

    canister.currLevel += to_add;
    const canisters = machine.colorants.map((c) =>
      c.id === canister.id ? canister : c
    );

    this.props.setMachineColorantsQT(dispID, canisters);

    // Remove one canister from inventory
    if (config_values.enable_warehousing_v4 && cansize) {
      this.props.reportConsumption({
        cntcode: canister.code,
        cansizecode: cansize.cansizecode,
      });
    }

    this.clear_actions();
  };

  searchColorantBarcode = (evt) => {
    let searchText = evt.target.value; // this is the search text
    this.setState({ colorant_barcode: searchText });

    //search
    this.props.manualCntBarcodeDetails(searchText.trim());
  };

  searchCanisterBarcode = (evt) => {
    let searchText = evt.target.value; // this is the search text
    this.setState({ canister_barcode: searchText });
  };

  render() {
    const {
      t,
      machine,
      barcode_refill_action,
      barcode_canister_action,
      target_canister: canister,
      manual_cnt_barcode_details,

      config_values,
      cache,
    } = this.props;

    /**
     * Barcode validation
     *
     */
    let valid_style = '';
    let info_1st_line = t('lbl.pleaseInput', 'Please fill in the fields');
    let info_txt = [];

    let barcode_validation_ok =
      machine?.config?.colorant_barcode_confirmation ||
      this.state.canister_barcode ||
      this.state.colorant_barcode ||
      config_values.enable_warehousing_v4
        ? false
        : NO_NEED_TO_CHECK;

    const barcode_rs =
      canister &&
      validate_machine_barcode(
        this.state.colorant_barcode.trim(),
        this.state.canister_barcode.trim(),
        barcode_refill_action?.barcode === this.state.colorant_barcode
          ? barcode_refill_action
          : manual_cnt_barcode_details,
        barcode_canister_action,
        config_values,
        cache,
        machine,
        t,
        canister
      );

    valid_style = barcode_rs?.valid_style || valid_style;
    info_1st_line = barcode_rs?.info_1st_line || info_1st_line;
    info_txt = barcode_rs?.info_txt || info_txt;
    barcode_validation_ok = barcode_rs
      ? barcode_rs.barcode_validation_ok
      : barcode_validation_ok;

    /**
     * Batch validation
     */
    let batch_validation_ok = machine?.config?.batch_refill
      ? false
      : NO_NEED_TO_CHECK;

    const batch_rs = this.batchNumber?.current?.validate(
      this.state.batch_number
    );

    batch_validation_ok = batch_rs
      ? batch_rs.batch_validation_ok
      : batch_validation_ok;

    if (!batch_validation_ok && batch_rs) {
      valid_style = batch_rs?.valid_style || valid_style;
      info_1st_line = batch_rs?.info_1st_line || info_1st_line;
      info_txt.push(batch_rs.info_txt);
    }

    const ok_to_save =
      canister &&
      (batch_validation_ok || batch_validation_ok === NO_NEED_TO_CHECK) &&
      (barcode_validation_ok || barcode_validation_ok === NO_NEED_TO_CHECK);

    return (
      <Modal
        className="customer-width"
        isOpen={!!canister}
        toggle={this.clear_actions}
        centered
        fade={true}
        size="lg"
      >
        <ModalHeader>
          <div style={{ display: 'inline-flex' }}>
            <div>{t('fn.refillColorant', 'Refill colorant')}</div>
            <div style={{ display: 'inline-flex', marginLeft: '3rem' }}>
              <div style={{ width: '32px' }} className="pl-4">
                <ColorThumbnail rgb={canister?.rgb} size="24px" />
              </div>
              {canister?.code}
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          {
            <Row
              className={valid_style + '  mb-8 br-8'}
              style={{ minHeight: '6rem' }}
            >
              <Col className="m-auto">
                <h5 className="align-text-center" data-testid="info_1st_line">
                  {info_1st_line}
                </h5>
                <div className="align-text-center" data-testid="info_2nd_line">
                  {info_txt.map((info, i) => (
                    <p className={'m-0 p-0'} key={i}>
                      {info}
                    </p>
                  ))}
                </div>
              </Col>
            </Row>
          }

          <ColorantBarcode
            require_machine_canister_barcode={
              machine?.config?.canister_barcode_confirmation
            }
            canister={canister}
            cansize={barcode_rs?.cansize}
            searchColorantBarcode={this.searchColorantBarcode}
            searchCanisterBarcode={this.searchCanisterBarcode}
            canister_barcode={this.state.canister_barcode}
            colorant_barcode={this.state.colorant_barcode}
          />

          {machine?.config?.batch_refill && (
            <BatchNumber
              ref={this.batchNumber}
              canister={canister}
              handleBatchNumberChange={this.handleBatchNumberChange}
              handleBatchNoteChange={this.handleBatchNoteChange}
              batch_number={this.state.batch_number}
              batch_note={this.state.batch_note}
              selectedCanister={canister}
              to_add_volume={this.get_amount_to_add(false)}
            />
          )}
        </ModalBody>

        <ModalFooter>
          <Row className="w-100">
            <Col>
              <Button
                color="danger"
                id="actionCancel"
                onClick={this.clear_actions}
              >
                {t('fn.cancel', 'Cancel')}
              </Button>
            </Col>
            <Col />
            <Col>
              <Button
                color="primary"
                id="actionOk"
                disabled={!ok_to_save}
                onClick={this.save_changes}
              >
                {t('fn.ok', 'OK')}
              </Button>
            </Col>
          </Row>
        </ModalFooter>
      </Modal>
    );
  }
}

MachineRefillModal.propTypes = {
  t: PropTypes.func.isRequired,
  clearBarcodeActions: PropTypes.func.isRequired,
  setMachineColorantsQT: PropTypes.func.isRequired,
  machine: machineType,
  cache: PropTypes.shape({
    cnts: PropTypes.array,
    cansizes: PropTypes.array,
  }),
  barcode_refill_action: PropTypes.shape({
    cntid: PropTypes.number,
    cansizeid: PropTypes.number,
    barcode: PropTypes.string,
    canisterid: PropTypes.number,
  }),
  manual_cnt_barcode_details: PropTypes.shape({
    cntid: PropTypes.number,
    cansizeid: PropTypes.number,
  }),
  current_user: PropTypes.shape({
    username: PropTypes.string,
  }),
  manualCntBarcodeDetails: PropTypes.func.isRequired,
  dispID: PropTypes.string,
  config_values: PropTypes.object,
  barcode_canister_action: PropTypes.shape({
    barcode: PropTypes.string,
    canisterid: PropTypes.number,
  }),
  barcodeaction: PropTypes.shape({
    action: PropTypes.string,
  }),
  target_canister: PropTypes.shape({
    id: PropTypes.number,
    code: PropTypes.string,
    cntid: PropTypes.number,
    barcode: PropTypes.string,
    rgb: PropTypes.number,
    currLevel: PropTypes.number,
    maxLevel: PropTypes.number,
    refillCans: PropTypes.array,
  }),
  setRefillTargetCanister: PropTypes.func.isRequired,
  reportConsumption: PropTypes.func.isRequired,
};

MachineRefillModal.defaultProps = {};

function mapStateToProps(store) {
  return {
    cache: store.cache,
    config_values: store.configurations.config_values,
    manual_cnt_barcode_details: store.barcodeaction.manual_cnt_barcode_details,
    barcodeaction: store.barcodeaction.barcodeaction,
    current_user: userSelectors.current_user(store),
    target_canister: machineSelectors.refill_target_canister(store),
    inventory: store.inventory.colorants,
    barcode_refill_action: store.machine.barcode_refill_action,
    barcode_canister_action: store.machine.barcode_canister_action,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      clearBarcodeActions: machineActions.clearBarcodeActions,
      setMachineColorantsQT: machineActions.setMachineColorantsQT,
      setRefillTargetCanister: machineActions.setRefillTargetCanister,
      manualCntBarcodeDetails: barcodeActions.manualCntBarcodeDetails,
      reportConsumption: inventoryActions.reportConsumption,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachineRefillModal)
);
