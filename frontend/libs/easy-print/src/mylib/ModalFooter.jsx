import React from 'react';
import PropTypes from 'prop-types';

export const ModalFooter = (props) => {
  /**
   * flex: 0 0 16.666667%;
   * max-width: 16.666667%;
   */

  const { children, style } = props;

  return (
    <div className="ep-modal-footer" style={style}>
      {children}
    </div>
  );
};

ModalFooter.propTypes = {
  children: PropTypes.any,
  style: PropTypes.object,
};

ModalFooter.defaultProps = {
  style: {},
};
