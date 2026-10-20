import React from 'react';
import PropTypes from 'prop-types';
import { NumberInputBase } from 'polchem_base/components/NumberInputBase';

function NumberInput({
  id,
  className,
  style,
  disabled,
  readOnly,
  value,
  emptyIsNull,
  min,
  max,
  step = 1,
  onChange,
  deferChange,
  decimals = 6,
  dataTestid,
}) {
  return (
    <NumberInputBase
      renderInput={(props) => (
        <input
          id={id}
          data-testid={dataTestid}
          type="text"
          autoComplete="off"
          className={className}
          style={style}
          disabled={disabled}
          readOnly={readOnly}
          {...props}
        />
      )}
      value={value}
      emptyIsNull={emptyIsNull}
      min={min}
      max={max}
      step={step}
      onChange={!deferChange ? onChange : undefined}
      updateOnBlur={deferChange ? onChange : undefined}
      decimals={decimals}
      dataTestid={dataTestid}
    />
  );
}

NumberInput.propTypes = {
  id: PropTypes.string,
  className: PropTypes.any,
  style: PropTypes.object,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  value: PropTypes.number,
  emptyIsNull: PropTypes.bool,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  deferChange: PropTypes.bool,
  decimals: PropTypes.number,
  dataTestid: PropTypes.string,
};

export default NumberInput;
