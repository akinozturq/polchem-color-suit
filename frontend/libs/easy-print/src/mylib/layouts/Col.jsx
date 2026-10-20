import React from 'react';
import PropTypes from 'prop-types';

export const Col = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const { className, children, style, xs, ...rest } = props;

  let width;
  let flex;
  let maxWidth;
  if (xs === 'auto') {
    width = 'auto';
    flex = ' 0 0 auto';
    maxWidth = '100%';
  } else if (xs) {
    width = (100 * (xs / 12)).toString() + '%';
    maxWidth = width;
    flex = width;
  } else {
    maxWidth = '100%';
    width = null;
  }

  return (
    <div
      className={className}
      style={{
        flex,
        width,
        maxWidth,
        paddingTop: '0',
        paddingBottom: '0',
        paddingLeft: '15px',
        paddingRight: '15px',
        flexBasis: 0,
        flexGrow: 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

Col.propTypes = {
  xs: PropTypes.any,
  children: PropTypes.any,
  style: PropTypes.object,
  className: PropTypes.string,
};

Col.defaultProps = {
  style: {},
};
