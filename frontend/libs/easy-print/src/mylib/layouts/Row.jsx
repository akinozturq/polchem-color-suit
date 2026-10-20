import React from 'react';
import PropTypes from 'prop-types';

export const Row = (props) => {
  const { className, children, style, ...rest } = props;

  return (
    <div
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap', margin: 0, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
};

Row.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
  className: PropTypes.string,
};
