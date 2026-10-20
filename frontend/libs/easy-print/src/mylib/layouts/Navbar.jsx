import React from 'react';
import PropTypes from 'prop-types';

export const Navbar = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const { className, children, style, ...rest } = props;

  let classes = ['ep-navbar', className];

  return (
    <nav className={classes.join(' ')} style={style} {...rest}>
      {children}
    </nav>
  );
};

Navbar.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
  className: PropTypes.string,
};

Navbar.defaultProps = {
  style: {},
};
