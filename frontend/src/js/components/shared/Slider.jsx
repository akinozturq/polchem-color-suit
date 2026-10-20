import React from 'react';
import { Input, InputGroup, InputGroupAddon, InputGroupText } from 'reactstrap';
import PropTypes from 'prop-types';
import NumberInput from '../../mylib/NumberInput';
import { rightToLeft } from '../../mylib/Utils';

export const SliderWithValue = ({ value, setValue }) => {
  const in_range = value >= -50 && value <= 50;
  const isRtl = rightToLeft();
  const direction = isRtl ? 'rtl' : 'ltr';
  const inputStyle = {
    direction: 'ltr',
    textAlign: isRtl ? 'right' : 'left',
    borderRadius: isRtl ? '0 0.25rem 0.25rem 0' : '0.25rem 0 0 0.25rem',
  };
  const addonStyle = {
    borderRadius: isRtl ? '0.25rem 0 0 0.25rem' : '0 0.25rem 0.25rem 0',
  };
  const addonType = isRtl ? 'prepend' : 'append';
  const rangeStyle = {
    opacity: in_range ? 1 : 0,
    direction,
  };
  return (
    <div
      className={'pl-2 pr-2'}
      style={{ display: 'inline-flex', width: '100%' }}
      dir={direction}
    >
      <Input
        className={'pl-2 pr-2'}
        style={rangeStyle}
        dir={direction}
        type="range"
        name="range"
        min={-50}
        max={50}
        value={value}
        onChange={(v) => {
          if (in_range) {
            setValue(parseFloat(v.target.value));
          }
        }}
        id="exampleRange"
      />
      <InputGroup style={{ direction }}>
        {!isRtl && (
          <InputGroupAddon addonType={addonType}>
            <InputGroupText style={addonStyle}>%</InputGroupText>
          </InputGroupAddon>
        )}
        <NumberInput
          id={'scale_frm_input'}
          className="form-control"
          min={-99}
          value={value}
          onChange={setValue}
          style={inputStyle}
        />
        {isRtl && (
          <InputGroupAddon addonType={addonType}>
            <InputGroupText style={addonStyle}>%</InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
};

SliderWithValue.propTypes = {
  value: PropTypes.number,
  setValue: PropTypes.func,
};
