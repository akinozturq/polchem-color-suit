import PropTypes from 'prop-types';
import { Button, Col, Input, Row, UncontrolledTooltip } from 'reactstrap';
import bottleFillDark from 'img/canisters/bottleFillDark.svg';
import bottleFill from 'img/canisters/bottleFill.svg';
import stockBlack from 'img/StockLevelBlack.png';
import stockWhite from 'img/StockLevelWhite.png';
import { LEVEL_UNITS } from 'js/Constants';
import bottlePlus from 'img/canisters/bottlePlus.svg';
import LevelInput from './LevelInput';
import React from 'react';

import { propType as machineType } from 'js/redux/reducers/Machine';
import { selectors as inventorySelectors } from 'js/redux/reducers/Inventory';
import { selectors as configSelectors } from 'js/redux/reducers/Configuration';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import { rightToLeft } from '../../../../mylib/Utils';

const propTypes = {
  t: PropTypes.func.isRequired,
  canister: PropTypes.object,
  darkIcon: PropTypes.bool,
  refillValue: PropTypes.number,
  level_unit: PropTypes.string,
  disable_input: PropTypes.bool,
  disable_add: PropTypes.bool,
  dsp_busy: PropTypes.bool,
  levelFormatter: PropTypes.object,
  setUnit: PropTypes.func,
  refillClicked: PropTypes.func,
  accessDenied: PropTypes.func,
  currLevelChange: PropTypes.func,
  purgeCanister: PropTypes.func,
  stirCanister: PropTypes.func,
  machine: machineType,
  canisterid: PropTypes.number,
};

export default function Refill({
  t,
  darkIcon,
  canister,
  refillValue,
  level_unit,
  disable_input,
  disable_add,
  dsp_busy,
  levelFormatter,
  setUnit,
  refillClicked,
  accessDenied,
  currLevelChange,
  purgeCanister,
  stirCanister,
  machine,
  canisterid,
}) {
  const colorants = useSelector(inventorySelectors.colorants);
  const config_values = useSelector(configSelectors.config_values);

  const inv = _.sum(
    colorants?.data
      .filter((x) => x.cntcode === canister?.code)
      .map((y) => y.count)
  );

  return (
    <>
      <Col>
        <Col
          className="pl-16 pr-16"
          style={{
            fontSize: '1rem',
            justifyContent: 'center',
          }}
          dir="ltr"
        >
          <img
            src={darkIcon ? bottleFillDark : bottleFill}
            alt="1"
            height={46}
          />
          <span
            style={{
              position: 'relative',
              left: '-2rem',
              top: '3px',
            }}
          >
            {canister &&
              Math.floor(
                (canister.maxLevel - canister.currLevel) / refillValue
              )}
          </span>
          <span style={{ fontSize: '1rem' }}>
            {' '}
            {!canister ? '' : canister.code}
          </span>
          {/** Stockmanagement enabled */}
          {config_values.enable_warehousing_v4 && (
            <>
              <div className="fa-pull-right m-0">
                <img
                  src={darkIcon ? stockBlack : stockWhite}
                  height={46}
                  alt="1"
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '2.25rem',
                    top: '1rem',
                  }}
                >
                  {inv}
                </span>
              </div>
            </>
          )}
        </Col>
        <h5
          style={{ paddingLeft: '6px', margin: '0' }}
          className="canisterProperties"
        >
          {t('lbl.description', 'Description')}
        </h5>
        <Col
          style={{ minHeight: '3rem', maxHeight: '3rem' }}
          className="text-break text-wrap pl-2 pr-2 scroll"
        >
          {canister?.description}
        </Col>
        {/** Colorant current fill level*/}
        <h5 style={{ padding: '0 6px' }} className="canisterProperties">
          {t('lbl.refill')}
        </h5>
        <div
          id="refill_div_section"
          style={{
            padding: '0 6px',
            height: 'calc(1.5em + 0.75rem + 8px)',
            width: '100%',
          }}
          className="d-inline-flex"
        >
          <Input
            type="text"
            value={
              canister
                ? levelFormatter.format({
                    volume: refillValue,
                    specificgravity: canister.specificgravity,
                  })
                : ''
            }
            readOnly={true /* TODO: onChange handler (?) */}
            style={{
              borderRadius: rightToLeft() ? '0px 5px 5px 0' : '5px 0 0 5px',
            }}
          />

          <Input
            type="select"
            value={level_unit}
            onChange={(event) => setUnit(event.target.value)}
            style={{
              width: '10rem',
              maxWidth: '10rem',
              fontSize: 'inherit',
              borderRadius: 0,
              borderLeft: 'none',
              borderRight: 'none',
            }}
            readOnly={disable_input}
          >
            {LEVEL_UNITS.map((opt) => (
              <option value={opt.display_name} key={opt.display_name}>
                {opt.display_name}
              </option>
            ))}
          </Input>

          <Button
            data-testid="btn_refill_add"
            color="success"
            onClick={() => refillClicked(canister)}
            style={{
              border: 'none',
              height: 38,
              width: 45,
              minWidth: 45,
              maxWidth: 45,
              overflow: 'hidden',
              padding: 0,
              borderRadius: rightToLeft() ? '5px 0 0 5px' : '0px 5px 5px 0',
            }}
            data-denied={accessDenied('canister_level_change')}
            disabled={
              !canister || disable_add || accessDenied('canister_level_change')
            }
          >
            <img src={bottlePlus} alt="+" height={40} />
          </Button>
        </div>
        {disable_add && (
          <UncontrolledTooltip placement="bottom" target="refill_div_section">
            {t(
              'tooltip.refillNotFit',
              'Unable to refill. The whole bottle wont fit into canister'
            )}
          </UncontrolledTooltip>
        )}
      </Col>
      <LevelInput
        label={t('lbl.currentLevel', 'Current level')}
        canister={canister}
        prop="currLevel"
        levelFormatter={levelFormatter}
        readOnly={accessDenied('canister_level_change') || !canister}
        onBlur={
          (!accessDenied('canister_level_change') && currLevelChange) || null
        }
        dataTestid="canister_current_level"
      />
      <LevelInput
        label={t('lbl.canisterCapacity', 'Canister capacity')}
        canister={canister}
        prop="maxLevel"
        levelFormatter={levelFormatter}
        readOnly
        borderBottom
      />
      <Row className="mt-20 p-8">
        <Button
          className="btn-primary"
          onClick={purgeCanister}
          disabled={dsp_busy || accessDenied('machine_command_purge')}
          data-denied={accessDenied('machine_command_purge')}
        >
          {t('fn.purgeCanister', 'Purge canister')}
        </Button>
        {machine.commands.stir && (
          <Button
            className="btn-primary"
            onClick={stirCanister}
            disabled={
              dsp_busy ||
              accessDenied('machine_command_stir') ||
              canisterid == null
            }
            data-denied={accessDenied('machine_command_stir')}
          >
            {t('fn.stirCanister', 'Stir canister')}
          </Button>
        )}
      </Row>
    </>
  );
}

Refill.propTypes = propTypes;
