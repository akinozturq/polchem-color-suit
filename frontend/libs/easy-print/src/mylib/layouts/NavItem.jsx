import React from 'react';
import PropTypes from 'prop-types';

export const NavItem = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const { className, children, style, ...rest } = props;

  return (
    <li className={className} style={style} {...rest}>
      {children}
    </li>
  );
};

NavItem.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
  className: PropTypes.string,
};

NavItem.defaultProps = {
  style: {},
};
