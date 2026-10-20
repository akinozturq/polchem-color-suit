import React from 'react';
import PropTypes from 'prop-types';

export const Modal = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const { isOpen, children } = props;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="ep-modal-backdrop">
      <div className="ep-modal-dialog">{children}</div>
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.any,
  isOpen: PropTypes.bool,
};

Modal.defaultProps = {
  isOpen: false,
};
