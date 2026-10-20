import PropTypes from 'prop-types';
import { useState } from 'react';
import { Button, CardBody, Col, Input, Row } from 'reactstrap';

import { intToR_G_B, RGBColorToHex } from '../../../mylib/Utils';
import { PreviewBox } from '../../shared/order/ColorPreview';

import ColorDiffPanel from './ColorDiffPanel';
import './styles.scss';

export const MatchingColorPanel = ({
  t,
  isRtl,
  alignStyle,
  direction,
  spectro_measurement_target,
  allow_matching,
  continueHandler,
}) => {
  const [colourcode, setColourcode] = useState('');

  if (!spectro_measurement_target) {
    return <CardBody style={{ margin: '0.75rem 1.5rem', ...alignStyle }} />;
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      continueHandler(colourcode);
    }
  };

  const targetRgb = spectro_measurement_target.rgb;

  return (
    <CardBody style={{ margin: '0.75rem 1.5rem', ...alignStyle }}>
      <div className="color__preview">
        <PreviewBox color={targetRgb} />
      </div>
      <div
        className="table-responsive table-borderless float-right color-preview-table"
        dir={direction}
        style={alignStyle}
      >
        <table className="table table-borderless table-sm">
          <thead>
            <tr>
              {/* <th>{color ? color.colourcode : ''}</th> */}
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {allow_matching && (
                <td colSpan="2">
                  <Input
                    data-testid="colorCodeInput"
                    autoFocus={true}
                    placeholder={t('prompt.typeColorCode')}
                    bsSize="md"
                    value={colourcode}
                    onChange={({ target }) => setColourcode(target.value)}
                    onKeyDown={handleKeyDown}
                    dir={direction}
                    style={{
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                  />
                </td>
              )}
            </tr>
            <tr>
              <td className="color__details">{t('extraInfo.rgb')}</td>
              <td>{intToR_G_B(targetRgb).join(', ')}</td>
            </tr>
            <tr>
              <td className="color__details">{t('extraInfo.rgbHex')}</td>
              <td>{RGBColorToHex(targetRgb)}</td>
            </tr>
            <tr>
              <td />
              <td>
                <Button
                  id="matching_continue"
                  className="color__btn--continue"
                  onClick={() => continueHandler(colourcode)}
                >
                  {t('fn.continue', 'Continue')}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardBody>
  );
};

MatchingColorPanel.propTypes = {
  t: PropTypes.func.isRequired,
  isRtl: PropTypes.bool.isRequired,
  alignStyle: PropTypes.object.isRequired,
  direction: PropTypes.string.isRequired,
  spectro_measurement_target: PropTypes.object,
  allow_matching: PropTypes.bool.isRequired,
  continueHandler: PropTypes.func.isRequired,
};

export const CorrectionColorPanel = ({
  t,
  isRtl,
  alignStyle,
  color,
  spectro_measurement_target,
  spectro_measurement_paint,
  spectro_busy,
  backHandler,
  correctFormula,
}) => {
  const desired_color = spectro_measurement_target || color;
  const canContinue =
    desired_color?.lab && spectro_measurement_paint?.lab && !spectro_busy;
  return (
    <CardBody
      style={{
        marginLeft: isRtl ? 0 : '20px',
        marginRight: isRtl ? '20px' : 0,
        ...alignStyle,
      }}
    >
      {(desired_color?.lab || spectro_measurement_paint?.lab) && (
        <>
          <ColorDiffPanel
            title={t('lbl.before_formulaCorrection', 'Before')}
            desired_color={desired_color}
            actual_color={spectro_measurement_paint}
          />
          <Row className="pt-3">
            <Col xs={6} className="text-center">
              <Button color="warning" id="matching_back" onClick={backHandler}>
                {t('fn.back', 'Back')}
              </Button>
            </Col>
            <Col xs={6} className="text-center">
              <Button
                id="formula_correct_continue"
                onClick={correctFormula}
                disabled={!canContinue}
              >
                {t('fn.continue')}
              </Button>
            </Col>
          </Row>
        </>
      )}
    </CardBody>
  );
};

CorrectionColorPanel.propTypes = {
  t: PropTypes.func.isRequired,
  isRtl: PropTypes.bool.isRequired,
  alignStyle: PropTypes.object.isRequired,
  color: PropTypes.object,
  spectro_measurement_target: PropTypes.object,
  spectro_measurement_paint: PropTypes.object,
  spectro_busy: PropTypes.bool.isRequired,
  backHandler: PropTypes.func.isRequired,
  correctFormula: PropTypes.func.isRequired,
};
