import React from 'react';
import PropTypes from 'prop-types';

import {
  Col,
  Row,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Label,
  CustomInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from 'reactstrap';

import { propType as machineType } from 'js/redux/reducers/Machine';
import _ from 'lodash';
import { CustomScrollbars, rightToLeft } from '../../../mylib/Utils';
import { ShotFormatter } from 'polchem_base/common/formatters/ShotFormatter';
import AmountInput from '../../shared/AmountInput';
import ColorThumbnail from '../../shared/ColorThumbnail';

const propTypes = {
  t: PropTypes.func.isRequired,
  machine: machineType,
  dispID: PropTypes.string.isRequired,
  config: PropTypes.object,
  purge: PropTypes.func.isRequired,
  purgeAll: PropTypes.func.isRequired,
  purgeAutomaticPrepare: PropTypes.func.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  commands: PropTypes.object,
};

const defaultProps = {};

export default class PurgeActions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      canisters: [],
      sequential: false,
      purgeAmount: 1,
    };
    this._purgeAmount = this.state.purgeAmount;
  }

  componentDidMount() {
    this.loadCanisters();
  }

  componentDidUpdate() {
    this.syncCanisters();
  }

  // If canister is disabled from other tab then reflect the change into state
  syncCanisters = () => {
    if (this.state.canisters.length !== this.props.machine.colorants.length) {
      this.loadCanisters();
      return;
    }
    for (let i = 0; i < this.state.canisters.length; i++) {
      if (
        this.state.canisters[i].enabled !==
        this.props.machine.colorants[i].enabled
      ) {
        this.loadCanisters();
        return;
      }
    }
  };

  loadCanisters = () => {
    const canisters = this.props.machine.colorants.map((colorant) => {
      return {
        id: colorant.id,
        code: colorant.code,
        cntid: colorant.cntid,
        rgb: colorant.rgb,
        enabled: colorant.enabled,
        selected: false,
        volume: 0,
        circuits: [...colorant.circuits],
      };
    });

    if (canisters.length > 0) {
      this.setState({ canisters });
    }
  };

  handleApplyAll = () => {
    this.setState({
      purgeAmount: this._purgeAmount,
      canisters: this.state.canisters.map((canister) => {
        if (canister.enabled) canister.volume = parseFloat(this._purgeAmount);
        return canister;
      }),
    });
  };

  accessDenied = (key) => {
    const { privileges } = this.props;
    return !_.includes(privileges, key);
  };

  purgeAll = () => {
    /*
    this.props.purgeAll(
      this.props.dispID,
      parseFloat(this.state.purgeAmount),
      this.state.sequential
    );
     */
    let canisters = (this.state.canisters ? this.state.canisters : []).filter(
      (x) => x.enabled && x.volume !== 0
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
      this.props.purge(this.props.dispID, purge_formula, this.state.sequential);
    }
  };

  purgeAutomaticPrepare = () => {
    this.props.purgeAutomaticPrepare(this.props.dispID);
  };

  purge = () => {
    let canisters = (this.state.canisters ? this.state.canisters : []).filter(
      (x) => x.enabled && x.selected && x.volume !== 0
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
      this.props.purge(this.props.dispID, purge_formula, this.state.sequential);
    }
  };

  onAmountChange = (volume, canister) => {
    this.setState({
      canisters: this.state.canisters.map((c) => {
        if (c.id === canister.id) {
          c.volume = parseFloat(volume);
        }
        return c;
      }),
    });
  };
  getPurgeValue = (canister) => {
    let c = _.find(this.state.canisters, (x) => {
      return x.id === canister.id;
    });
    return parseFloat(c.volume);
  };

  handleCanisterSelection = (canister) => {
    this.setState({
      canisters: this.state.canisters.map((c) => {
        if (canister.id === c.id) c.selected = !canister.selected;
        return c;
      }),
    });
  };

  getCanister = (canister, i, disabled, shotFormatter, isRtl, direction) => {
    const block_input = disabled;

    const element_id =
      'formula_cnt_violation_' + String(canister.id) + '_input';

    return (
      <Row
        className={'ml-4 mr-4 mt-4 mb-4 pl-4 pr-4 pt-4 pb-4'}
        style={{
          flexDirection: 'row',
          textAlign: isRtl ? 'right' : 'left',
          direction,
        }}
      >
        <Col xs={1}>
          <CustomInput
            type="checkbox"
            id={canister.id}
            checked={canister.selected}
            disabled={!canister.enabled}
            onChange={() => {
              this.handleCanisterSelection(canister);
            }}
          />
        </Col>
        <Col
          xs={2}
          style={{
            minWidth: '2.5rem',
            paddingTop: '0.25rem',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
          id={element_id}
        >
          <ColorThumbnail hideIfNull rgb={canister.rgb} size="1.5rem" />
        </Col>
        <Col style={{ margin: 'auto 0' }}>{canister.code}</Col>
        <Col className={'p-0'}>
          <AmountInput
            className={
              block_input
                ? 'amount-input-blocked'
                : canister.volume
                  ? 'amount-input'
                  : 'amount-input-zero'
            }
            shotFormatter={shotFormatter}
            cnt={canister}
            value={this.getPurgeValue(canister)}
            onChange={(volume) =>
              volume !== null &&
              volume !== undefined &&
              this.onAmountChange(volume, canister)
            }
            disabled={block_input}
          />
        </Col>
      </Row>
    );
  };

  getCanistersForPurge = (isRtl, direction) => {
    let canisters = this.state.canisters;
    const mlFormatter = new ShotFormatter({ decimals: 1 });
    let arr = [];

    let startsAt = 0;
    let endsAt = 4;
    for (let r = 0; r < Math.ceil(canisters.length / 4); r++) {
      let row = [];
      let smallCntsArray = canisters.slice(
        startsAt,
        endsAt > canisters.length ? canisters.length : endsAt
      );
      for (let c = 0; c < smallCntsArray.length; c++) {
        row.push(
          <Col
            className="purge_formula_input_cell"
            key={smallCntsArray[c] && smallCntsArray[c].id}
          >
            {this.getCanister(
              smallCntsArray[c],
              smallCntsArray[c] && smallCntsArray[c].id,
              !smallCntsArray[c].enabled,
              mlFormatter,
              isRtl,
              direction
            )}
          </Col>
        );
      }
      let j = 0;

      while (true) {
        if (j + smallCntsArray.length < 4) {
          row.push(
            <Col key={'_add_' + j} className="purge_formula_input_cell" />
          );
          j += 1;
        } else {
          break;
        }
      }
      startsAt = endsAt;
      endsAt += 4;

      arr.push(
        <Row key={r} style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          {row}
        </Row>
      );
    }
    return arr;
  };

  getPurge = (isRtl, direction) => {
    const { t, machine } = this.props;
    //let canisters = this.props.machine.colorants || [];
    const rowDirection = 'row';
    const amountLabelStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const actionSpacingStyle = { marginLeft: '2.5rem' };
    const sequentialSpacingStyle = {
      marginLeft: '0.5rem',
      marginRight: '0.5rem',
      textAlign: isRtl ? 'right' : 'left',
    };

    return (
      <Card style={{ padding: '0.5rem 0.5rem' }}>
        <CardHeader style={amountLabelStyle} dir={direction}>
          {t('lbl.purgeOptions', 'Purge Options')}
        </CardHeader>
        <CardBody style={{ padding: '1rem 0.5rem' }}>
          <Row style={{ flexDirection: rowDirection }}>
            <Col sm={1}>
              <Label className="mt-2" style={amountLabelStyle}>
                {t('lbl.amount.colon', 'Amount:')}
              </Label>
            </Col>
            <Col sm={3}>
              <InputGroup>
                <Input
                  type="number"
                  min={0}
                  defaultValue={this.state.purgeAmount}
                  style={{
                    direction,
                    borderRadius: isRtl
                      ? '0 0.25rem 0.25rem 0'
                      : '0.25rem 0 0 0.25rem',
                  }}
                  onChange={(e) => {
                    this._purgeAmount = e.target.value;
                  }}
                />
                <InputGroupAddon addonType="append">
                  <InputGroupText
                    style={{
                      direction,
                      borderRadius: isRtl
                        ? '0.25rem 0 0 0.25rem'
                        : '0 0.25rem 0.25rem 0',
                    }}
                  >
                    {t('symbol.ml')}
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Col>
            <Col sm={3}>
              <Button
                onClick={this.handleApplyAll}
                disabled={this.accessDenied('machine_command_purge')}
                data-denied={this.accessDenied('machine_command_purge')}
              >
                {t('fn.applyToAll', 'Apply to all')}
              </Button>
            </Col>
            <Col style={sequentialSpacingStyle}>
              <CustomInput
                className="mt-2"
                type="checkbox"
                id="sequential"
                label={t('cfg.machine.purge_sequential', 'Sequential')}
                checked={this.state.sequential}
                onChange={() =>
                  this.setState((st) => ({
                    sequential: !st.sequential,
                  }))
                }
              />
            </Col>
          </Row>
          {machine.info?.purgeAmountSupported === false && (
            <Row style={{ fontSize: 'smaller', marginTop: '0.2rem' }}>
              {t('msg.cannotSetPurgeAmounts')}
            </Row>
          )}
          <Row style={{ marginTop: '2rem', flexDirection: rowDirection }}>
            <Col style={actionSpacingStyle}>
              <Button
                onClick={this.purge}
                disabled={
                  this.accessDenied('machine_command_purge') ||
                  !machine.commands?.purge
                }
                data-denied={this.accessDenied('machine_command_purge')}
              >
                {t('fn.PurgeSelected', 'Purge selected')}
              </Button>
            </Col>

            <Col style={actionSpacingStyle}>
              <Button
                onClick={this.purgeAll}
                disabled={
                  this.accessDenied('machine_command_purge') ||
                  !machine.commands?.purge_all
                }
                data-denied={this.accessDenied('machine_command_purge')}
              >
                {t('fn.PurgeAll', 'Purge All')}
              </Button>
            </Col>

            <Col style={{ ...actionSpacingStyle, minWidth: 'fit-content' }}>
              <Button
                data-testid="btn_automatic_purge"
                onClick={this.purgeAutomaticPrepare}
                disabled={this.accessDenied('machine_command_purge')}
                data-denied={this.accessDenied('machine_command_purge')}
              >
                {t('fn.automaticPurge', 'Automatic purge')}
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  };

  render() {
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    return (
      <React.Fragment>
        <CustomScrollbars
          className="bordered br-8"
          style={{
            height: 'calc(100vh - 13.5rem)',
            width: '100%',
            direction,
          }}
        >
          <Row style={{ marginBottom: '0.5rem' }}>
            <Col>
              {this.props.config.hide_purge_actions &&
                !this.props.config.hide_purge_actions.value &&
                this.getPurge(isRtl, direction)}
            </Col>
          </Row>
          <Row style={{ marginBottom: '0.5rem' }}>
            <Col>
              {this.props.config.hide_purge_actions &&
                !this.props.config.hide_purge_actions.value &&
                this.state.canisters && (
                  <Card>
                    <CardBody>
                      {this.getCanistersForPurge(isRtl, direction)}
                    </CardBody>
                  </Card>
                )}
            </Col>
          </Row>
        </CustomScrollbars>
      </React.Fragment>
    );
  }
}

PurgeActions.propTypes = propTypes;
PurgeActions.defaultProps = defaultProps;
