import React from 'react';
import PropTypes from 'prop-types';
import { DebounceInput } from 'react-debounce-input';
import { detectMobile, rightToLeft } from '../../mylib/Utils';

export default function SearchInput(props) {
  let {
    use_default_style = true,
    nbrButtons,
    value,
    debounceTimeout = 300,
    className = 'input-normal',
    invalid = false,
    ...forward_props
  } = props;
  const style = use_default_style
    ? {
        borderRadius:
          nbrButtons > 0 && !detectMobile() && rightToLeft()
            ? '0 8px 8px 0'
            : nbrButtons > 0 && !detectMobile()
              ? '8px 0 0 8px'
              : '8px',
        width: detectMobile()
          ? '100%'
          : 'calc(100% - ' + 48 * nbrButtons + 'px)',
      }
    : null;

  if (invalid) {
    className += ' form-control is-invalid';
  }

  return (
    <DebounceInput
      autoComplete="off"
      style={style}
      autoFocus={true}
      type="search"
      value={value ?? ''}
      debounceTimeout={debounceTimeout}
      className={className}
      {...forward_props}
    />
  );
}

SearchInput.propTypes = {
  debounceTimeout: PropTypes.number,
  nbrButtons: PropTypes.number,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  key: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  use_default_style: PropTypes.bool,
  invalid: PropTypes.bool,
};
