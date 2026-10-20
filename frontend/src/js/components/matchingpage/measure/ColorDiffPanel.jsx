import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Col, Row } from 'reactstrap';
import _ from 'lodash';
import { array_to_lab } from 'polchem_base/common/color_calc/color_conv';
import { color_diff } from 'polchem_base/common/color_calc/color_diff';

import { PreviewBox } from '../../shared/order/ColorPreview';
import { selectors as cacheSelectors } from 'js/redux/reducers/Cache';
import { makeFormatters } from '../../../redux/selectors/EIValues';
import {
  RGBColorToHex,
  findMatchLimit,
  rightToLeft,
} from '../../../mylib/Utils';
import { handle_db_name } from '../../../redux/Utils';

function calculateColorDifference(
  desired_color,
  actual_color,
  matchLimits,
  deoption
) {
  if (!desired_color?.lab || !actual_color?.lab) {
    return null;
  }

  const desired_lab = array_to_lab(desired_color.lab);
  const measured_lab = array_to_lab(actual_color.lab);

  const simpleColorDifference = _.mapValues(
    desired_lab,
    (desired_value, key) => measured_lab[key] - desired_value
  );
  const delta_e = color_diff(measured_lab, desired_lab, deoption);
  const matchLimit = findMatchLimit(matchLimits, delta_e);

  return { simpleColorDifference, delta_e, matchLimit };
}

function ColorDiffPanel({
  title,
  desired_color,
  actual_color,
  configurations,
  matchLimits,
}) {
  const isRtl = rightToLeft();
  const direction = isRtl ? 'rtl' : 'ltr';
  const alignStyle = {
    textAlign: isRtl ? 'right' : 'left',
    direction,
  };
  const { de_function_index_v4 } = configurations.config_values;
  const numberFormatter = makeFormatters(configurations).EI_TYPE_NUMBER;
  const diff = calculateColorDifference(
    desired_color,
    actual_color,
    matchLimits,
    de_function_index_v4
  );
  const desiredRgbHex =
    desired_color?.rgb != null
      ? RGBColorToHex(desired_color.rgb)
      : 'transparent';
  const actualRgb = actual_color?.rgb ?? null;
  return (
    <Row dir={direction} style={alignStyle}>
      <Col xs={4}>
        <div
          data-testid="desired_color"
          className="bordered box-shadow"
          style={{
            height: '20.5vh',
            paddingTop: '5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            borderRadius: '.5rem',
            overflow: 'hidden',
            backgroundColor: desiredRgbHex,
          }}
        >
          <PreviewBox
            height={'10.5vh'}
            ignoreBoxShadow={true}
            color={actualRgb}
          />
        </div>
      </Col>
      <Col>
        {' '}
        <div
          style={{
            paddingLeft: isRtl ? '1rem' : 0,
            paddingRight: isRtl ? 0 : '1rem',
          }}
        >
          <table
            className="table table-sm"
            dir={direction}
            style={{ ...alignStyle, opacity: diff ? 1 : 0 }}
          >
            <thead>
              <tr>
                <th width={'50%'}></th>
                <th>{title}</th>
              </tr>
            </thead>
            <tbody>
              {diff && (
                <>
                  <tr>
                    <td>{'dL'}</td>
                    <td>
                      {numberFormatter.format(diff.simpleColorDifference.l)}
                    </td>
                  </tr>
                  <tr>
                    <td>{'da'}</td>
                    <td>
                      {numberFormatter.format(diff.simpleColorDifference.a)}
                    </td>
                  </tr>
                  <tr>
                    <td>{'db'}</td>
                    <td>
                      {numberFormatter.format(diff.simpleColorDifference.b)}
                    </td>
                  </tr>
                  <tr>
                    <td>{'dE'}</td>
                    <td>{numberFormatter.format(diff.delta_e)}</td>
                  </tr>
                </>
              )}
              {diff?.matchLimit && (
                <tr>
                  <td>
                    {diff.matchLimit.imageid && (
                      <div>
                        <img
                          style={{
                            maxHeight: 'calc(100% - 8rem)',
                            maxWidth: 'calc(100% - 2rem)',
                          }}
                          alt="limit"
                          src={handle_db_name(
                            `/rest/image/${diff.matchLimit.imageid}/data?hash=${diff.matchLimit.md5_hash}`
                          )}
                        />
                      </div>
                    )}
                  </td>
                  <td>{diff.matchLimit.commenttext}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Col>
    </Row>
  );
}

const colorType = PropTypes.shape({
  lab: PropTypes.array,
  rgb: PropTypes.number,
});

ColorDiffPanel.propTypes = {
  title: PropTypes.string,
  desired_color: colorType,
  actual_color: colorType,
  configurations: PropTypes.object.isRequired,
  matchLimits: PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
  configurations: state.configurations,
  matchLimits: cacheSelectors.matchLimits(state),
});

export default connect(mapStateToProps)(ColorDiffPanel);
