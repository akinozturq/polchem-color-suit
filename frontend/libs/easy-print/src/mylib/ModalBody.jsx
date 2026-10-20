import React from 'react';
import PropTypes from 'prop-types';

export const ModalBody = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const { children, style } = props;

  return (
    <div className="ep-modal-body" style={style}>
      {children}
    </div>
  );
};

ModalBody.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
};

ModalBody.defaultProps = {
  style: {},
};
