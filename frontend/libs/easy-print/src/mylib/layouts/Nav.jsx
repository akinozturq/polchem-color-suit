import React from 'react';
import PropTypes from 'prop-types';

export const Nav = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const { className, children, style, ...rest } = props;

  let classes = ['ep-nav', className];

  return (
    <ul className={classes.join(' ')} style={style} {...rest}>
      {children}
    </ul>
  );
};

Nav.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
  className: PropTypes.string,
};

Nav.defaultProps = {
  style: {},
};
