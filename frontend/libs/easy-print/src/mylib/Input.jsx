import React from 'react';
import PropTypes from 'prop-types';

export const Input = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const {
    className,
    children,
    style,
    bsSize,
    bordered,
    disabled,
    plaintext,
    type,
    value,
    ...rest
  } = props;

  let classes = ['ep-input', className];

  if (bsSize === 'sm') {
    classes.push('ep-input-sm');
  }

  if (type === 'checkbox') {
    classes.push('ep-input-checkbox');
  }

  if (disabled) {
    classes.push('ep-input-disabled');
  }

  if (bordered) {
    classes.push('ep-input-bordered');
  }

  if (plaintext) {
    classes.push('ep-input-plaintext');
  }

  let value_to_show = '';
  if (value) {
    value_to_show = value;
  }

  return (
    <input
      type={type}
      value={value_to_show}
      className={classes.join(' ')}
      style={style}
      {...rest}
    >
      {children}
    </input>
  );
};

Input.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
  disabled: PropTypes.bool,
  bordered: PropTypes.bool,
  plaintext: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string,
  bsSize: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Input.defaultProps = {
  type: 'text',
  style: {},
  disabled: false,
  bordered: true,
  plaintext: false,
};
