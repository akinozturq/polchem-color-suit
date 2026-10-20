import React from 'react';
import PropTypes from 'prop-types';

export const Container = (props) => {
  return (
    <div style={{ maxWidth: '100% !important', padding: 0 }}>
      {props.children}
    </div>
  );
};

Container.propTypes = { children: PropTypes.node };
