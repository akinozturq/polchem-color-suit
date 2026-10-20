import React from 'react';
import PropTypes from 'prop-types';
import { Label, Input, Row, Col } from 'reactstrap';
import { MINIMUM_BATCH_NUMBER_LENGHT } from 'js/Constants';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { createLevelFormatter } from '../../../redux/selectors/Formatters';
import { ArrayFindOneOrNull } from '../../../mylib/Utils';
import { dateToLocaleString } from '../../../mylib/DateUtils';

class BatchNumber extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      canister: null,
      levelFormatter: props.createLevelFormatter(),
    };
  }

  validate = (batch_number) => {
    const { t, canister, cache } = this.props;
    let valid_style = 'alert-success';
    let info_1st_line = batch_number
      ? t('msg.validBatchNumber', 'Valid batch number')
      : '';

    let info_txt = '';

    if (batch_number && batch_number.length < MINIMUM_BATCH_NUMBER_LENGHT) {
      return {
        blocked: false,
        batch_validation_ok: false,
        valid_style: 'alert-warning',
        info_1st_line: t('msg.batchNumberTooShort', 'Batch number too short'),
        info_txt: '',
      };
    }

    // Check cache.canister batch numbers if the batch is valid or not
    const db_cnt = ArrayFindOneOrNull(cache.cnts, 'cntcode', canister?.code);
    if (db_cnt) {
      const batch = ArrayFindOneOrNull(
        db_cnt.cntbatchinfo,
        'cntbatch',
        batch_number
      );
      if (batch) {
        let blocked = batch.blocked;
        if (!blocked && batch.expirationdate) {
          // Check expiration date
          if (new Date() > new Date(batch.expirationdate)) {
            blocked = true;
            valid_style = 'alert-danger';
            info_1st_line = t('msg.batchExpired', 'Batch expired');

            info_txt = t(
              'msg.batchExpiredDatetime',
              'Batch has been expired {{date}}',
              {
                date: dateToLocaleString(new Date(batch.expirationdate)),
              }
            );
          }
        } else if (blocked) {
          // Batch blocked
          valid_style = 'alert-danger';
          info_1st_line = t('msg.batchBlocked', 'Batch blocked');

          info_txt = t(
            'msg.batchBlockedInLab',
            'Usage of batch has been blocked'
          );
        }

        return {
          ...batch,
          blocked,
          batch_validation_ok: !blocked,
          valid_style,
          info_1st_line,
          info_txt,
        };
      }
    }
    return {
      blocked: false,
      batch_validation_ok: true,
      valid_style,
      info_1st_line,
      info_txt,
    };
  };

  render() {
    const {
      t,
      canister,
      handleBatchNumberChange,
      handleBatchNoteChange,
      batch_number,
      batch_note,
      to_add_volume,
    } = this.props;

    const valid = this.validate(batch_number);

    return (
      <Row>
        <Col xs={6} className="p-8">
          <Row>
            <Col>
              <Label for="amount">
                {t('lbl.amount_to_be_added', 'Amount to be added')}
              </Label>
            </Col>
          </Row>
          <Row>
            <Col>
              <Input
                id="amount"
                disabled
                value={`${this.state.levelFormatter.format({
                  volume: to_add_volume,
                  specificgravity: canister?.specificgravity,
                })} ${this.state.levelFormatter.getUnitName()}`}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Label for="note">{t('lbl.note', 'Note')}</Label>
            </Col>
          </Row>
          <Row>
            <Col>
              <Input
                type="textarea"
                id="note"
                onChange={handleBatchNoteChange}
                value={batch_note}
              />
            </Col>
          </Row>
        </Col>
        <Col xs={6} className="p-8">
          <Row>
            <Col>
              <Label for="batchnum">
                {t('lbl.batch_number', 'Batch number')}
              </Label>
            </Col>
          </Row>
          <Row>
            <Col>
              <Input
                id="batchnum"
                onChange={handleBatchNumberChange}
                value={batch_number}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Label for="info">{t('lbl.batch_info', 'Batch info')}</Label>
            </Col>
          </Row>
          <Row>
            <Col>
              <Input
                type="textarea"
                id="info"
                readOnly
                value={valid?.notes || ''}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}

BatchNumber.propTypes = {
  t: PropTypes.func.isRequired,
  canister: PropTypes.object,
  cache: PropTypes.object,
  createLevelFormatter: PropTypes.func,
  handleBatchNumberChange: PropTypes.func,
  handleBatchNoteChange: PropTypes.func,
  to_add_volume: PropTypes.number,
  batch_note: PropTypes.string,
  batch_number: PropTypes.string,
};
BatchNumber.defaultProps = {};

function mapStateToProps(store) {
  return {
    cache: store.cache,
    createLevelFormatter: createLevelFormatter(store),
  };
}

export default withTranslation('translations', { withRef: true })(
  connect(mapStateToProps, null, null, {
    forwardRef: true,
  })(BatchNumber)
);
