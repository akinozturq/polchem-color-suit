import React from 'react';
import PropTypes from 'prop-types';
import NumberInput from '../../mylib/NumberInput';

const propTypes = {
  className: PropTypes.string,
  shotFormatter: PropTypes.object,
  cnt: PropTypes.object,
  onChange: PropTypes.func,
  value: PropTypes.number,
  style: PropTypes.object,
  disabled: PropTypes.bool,
};

/**
 * Handles user input of amount and conversion to volume if input is gravimetric.
 */
export default function AmountInput({
  value,
  shotFormatter,
  cnt = {},
  onChange,
  disabled,
  className,
  style,
}) {
  if (shotFormatter.unit.gravimetric) {
    value *= cnt.specificgravity || 1;
  }
  if (!value || isNaN(value)) {
    value = '';
  }

  const values = shotFormatter.VolToList(value);

  const handleChange = (val, i) => {
    let newValue = shotFormatter.ListToVol(
      values.map((v, j) => (i === j ? val : v))
    );
    if (shotFormatter.unit.gravimetric) {
      newValue /= cnt.specificgravity || 1;
    }
    onChange(newValue);
  };

  const backgroundColor = disabled ? '#6c757d' : '#FFF';
  const inputStyle = {
    width: 100 / shotFormatter.divisors.length + '%',
    backgroundColor,
    color: disabled ? '#a5a5a5' : '#000',
    transition: 'unset',
  };

  return (
    <div className={className} style={{ ...style, backgroundColor }}>
      <NumberInput
        dataTestid={cnt.cntcode + '0'}
        min={0}
        value={values[0]}
        decimals={
          shotFormatter.divisors.length === 1 ? shotFormatter.decimals : 0
        }
        style={inputStyle}
        onChange={(val) => handleChange(val, 0)}
        disabled={disabled}
      />
      {shotFormatter.divisors.length > 1 ? (
        <>
          -
          <NumberInput
            dataTestid={cnt.cntcode + '1'}
            min={0}
            value={values[1]}
            decimals={
              shotFormatter.divisors.length === 2 ? shotFormatter.decimals : 0
            }
            style={inputStyle}
            onChange={(val) => handleChange(val, 1)}
            disabled={disabled}
          />
        </>
      ) : null}
      {shotFormatter.divisors.length > 2 ? (
        <>
          -
          <NumberInput
            dataTestid={cnt.cntcode + '2'}
            min={0}
            decimals={shotFormatter.decimals}
            value={values[2]}
            style={inputStyle}
            onChange={(val) => handleChange(val, 2)}
            disabled={disabled}
          />
        </>
      ) : null}
    </div>
  );
}

AmountInput.propTypes = propTypes;
