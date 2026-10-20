import React from 'react';
import PropTypes from 'prop-types';

export const Button = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const {
    className,
    children,
    style,
    active,
    primary,
    bordered,
    disabled,
    ...rest
  } = props;

  const defaultStyle = {};

  let classes = ['ep-btn', className];

  if (primary) {
    classes.push('ep-btn-primary');
  }

  if (disabled) {
    classes.push('ep-btn-disabled');
  }

  if (bordered) {
    classes.push('ep-btn-bordered');
  }

  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={{
        ...defaultStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
  primary: PropTypes.bool,
  disabled: PropTypes.bool,
  bordered: PropTypes.bool,
  active: PropTypes.bool,
  className: PropTypes.string,
};

Button.defaultProps = {
  style: {},
  primary: false,
  disabled: false,
  bordered: true,
  active: false,
};
