import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  FORMULA_VERSION_ALTERNATIVE,
  FORMULA_VERSION_HISTORY,
} from '../../../Constants';
import { Button, Card, CardBody } from 'reactstrap';
import { scale_to_can } from '../../../mylib/Formula';
import { bindActionCreators } from 'redux';
import orderActions, {
  propType as orderType,
} from '../../../redux/reducers/Order';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import FormulaTable from './FormulaTable';

import { CustomScrollbars } from '../../../mylib/Utils';
import { createShotFormatter } from '../../../redux/selectors/Formatters';
import {
  dateTimeToLocaleString,
  dateToLocaleString,
} from '../../../mylib/DateUtils';
import { get_cnt_for_product } from '../../../mylib/Product';
import { isSiteUser } from '../../../api/WebRequest.js';

const selectItems = (array, x) => {
  if (x <= 0) {
    return []; // Return an empty array for x <= 0
  }
  if (x > array.length) {
    return array; // Return the entire array if x exceeds its length
  }
  return array.slice(0, x); // Return the first x items
};

class FormulaVersionModal extends Component {
  handleAlternativeFormulaClick = (formula, can) => {
    this.props.setFormula(formula, true);
    this.props.setCan(can);
    this.props.setItemNotes(
      formula.ishistory
        ? this.props.t('lbl.valid_formula', 'Valid: {{start}} - {{end}}', {
            start: dateToLocaleString(formula.startdate),
            end: dateToLocaleString(formula.enddate),
          })
        : ''
    );

    this.props.toggleFormulaVersionModal();
  };

  getFormulaPreviewData = (formula) => {
    const { cntmap, order, t } = this.props;
    if (!formula) {
      return null;
    }

    let cntinformula = formula.cntinformula.map((cntin) => ({
      ...get_cnt_for_product(cntin.cntid, cntmap, order.product),
      cntid: cntin.cntid,
      volume: cntin.volume,
    }));

    const base = order.product?.basepaints.find(
      (basepaint) => basepaint.baseid === formula.baseid
    );
    const isCustomCan =
      order.can?.cansizeid === null || order.can?.cansizeid === undefined;
    const can = isCustomCan
      ? order.can
      : base?.cans.find((item) => item.cansizecode === order.can?.cansizecode);
    const canScaleFailed = !!base && order.can && !can;

    if (base && can) {
      cntinformula = scale_to_can(cntinformula, base, can);
    } else if (canScaleFailed) {
      cntinformula = null;
    }

    return {
      base,
      can,
      scaledFormula: {
        ...formula,
        cntinformula,
      },
      emptyMessage: canScaleFailed
        ? t(
            'lbl.customCanHistoryFormulaUnavailable',
            'Formula preview unavailable for this custom can size'
          )
        : undefined,
    };
  };

  createFormulaButton = (formula, idx) => {
    const { t } = this.props;
    if (!formula) {
      return;
    }

    const preview = this.getFormulaPreviewData(formula);
    const base = preview?.base;
    const can = preview?.can;
    const scaledFormula = preview?.scaledFormula || formula;
    const emptyMessage = preview?.emptyMessage;

    let borderColor =
      formula.ishistory || formula.isalternative || formula.isfallback
        ? '#133347'
        : 'white';

    return (
      <Button
        className="formula_version_card_body_button"
        key={idx}
        data-testid={'formula_' + idx}
        onClick={() => this.handleAlternativeFormulaClick(formula, can)}
        style={{ width: '250px', borderColor }}
      >
        <p>{base?.basecode}</p>
        {formula.startdate && (
          <p>
            <span>{t('lbl.from.colon')}</span>
            {dateTimeToLocaleString(formula.startdate)}
          </p>
        )}
        {formula.enddate && (
          <p>
            <span>{t('lbl.to.colon')}</span>
            {dateTimeToLocaleString(formula.enddate)}
          </p>
        )}
        <FormulaTable
          dispID={this.props.dispID}
          largefrm={false}
          shotFormatter={
            this.props.shotFormatter || this.props.createShotFormatter()
          }
          formula={scaledFormula}
          emptyMessage={emptyMessage}
          onlyTable={true}
        />
      </Button>
    );
  };

  render() {
    const {
      formula_version_modal_type,
      formula: { isfallback },
    } = this.props.order;
    const history_frms_available =
      this.props.config_values?.history_frms_available !== undefined
        ? this.props.config_values?.history_frms_available
        : -1;

    let formulas = this.props.formula.frms.filter((x) => {
      const iscurrent =
        !x.ishistory &&
        !x.isalternative &&
        (isfallback ? x.isfallback : !x.isfallback);
      if (formula_version_modal_type === FORMULA_VERSION_HISTORY) {
        return x.ishistory || iscurrent;
      }
      if (formula_version_modal_type === FORMULA_VERSION_ALTERNATIVE) {
        if (isSiteUser()) {
          return (
            ((isfallback ? x.isfallback : !x.isfallback) && x.isalternative) ||
            iscurrent
          );
        } else {
          return !x.ishistory;
        }
      }
      return false;
    });

    // limit the formula count
    if (
      formula_version_modal_type === FORMULA_VERSION_HISTORY &&
      history_frms_available !== -1
    ) {
      if (history_frms_available === 0) {
        return; // nothing to show
      }
      formulas = selectItems(formulas, history_frms_available);
    }

    return (
      formula_version_modal_type && (
        <div className="formula_version_modal">
          <div
            className="formula_input_options_triangle--right"
            onClick={() => this.props.toggleFormulaVersionModal()}
          />
          <Card className="formula_version_card">
            <CardBody className="formula_version_card_body">
              <CustomScrollbars style={{ height: '100%', paddingTop: 0 }}>
                {formulas.map((formula, idx) =>
                  this.createFormulaButton(formula, idx)
                )}
              </CustomScrollbars>
            </CardBody>
          </Card>
        </div>
      )
    );
  }
}

FormulaVersionModal.propTypes = {
  dispID: PropTypes.string,
  order: orderType.isRequired,
  formula: PropTypes.object.isRequired,
  cntmap: PropTypes.instanceOf(Map).isRequired,
  toggleFormulaVersionModal: PropTypes.func.isRequired,
  setCan: PropTypes.func.isRequired,
  setFormula: PropTypes.func.isRequired,
  setOriginalFormula: PropTypes.func.isRequired,
  setItemNotes: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  shotFormatter: PropTypes.object, // currently not passed from OrderPage
  createShotFormatter: PropTypes.func.isRequired,
  config_values: PropTypes.shape(),
};

function mapStateToProps(store) {
  return {
    config_values: store.configurations.config_values,
    order: store.order,
    formula: store.formula,
    cntmap: store.cache.cntmap,
    createShotFormatter: createShotFormatter(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      toggleFormulaVersionModal: orderActions.toggleFormulaVersionModal,
      setCan: orderActions.setCan,
      setFormula: orderActions.setFormula,
      setOriginalFormula: orderActions.setOriginalFormula,
      setItemNotes: orderActions.setItemNotes,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(FormulaVersionModal)
);
