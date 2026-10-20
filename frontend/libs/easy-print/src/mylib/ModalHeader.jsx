import React from 'react';
import PropTypes from 'prop-types';

export const ModalHeader = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const { children, style } = props;

  return (
    <div className="ep-modal-header" style={style}>
      <h5> {children}</h5>
    </div>
  );
};

ModalHeader.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
};

ModalHeader.defaultProps = {
  style: {},
};
