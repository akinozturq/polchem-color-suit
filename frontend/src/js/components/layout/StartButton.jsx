import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

const propTypes = {
  className: PropTypes.string,
  big: PropTypes.bool,
  children: PropTypes.any,
};

export const StartButtonContainer = (props) => (
  <div
    className={classnames(
      props.className,
      'd-flex flex-column start-button-container'
    )}
  >
    <div className="container d-flex flex-column flex-grow-1 flex-fill justify-content-center align-items-stretch align-content-center align-self-center flex-nowrap">
      {props.children}
    </div>
  </div>
);

export const StartButton = (props) => {
  const { big, className, ...attrs } = props;
  return (
    <button
      className={classnames(
        'btn btn-primary start-button',
        { 'start-button-big': big },
        className
      )}
      type="button"
      {...attrs}
    />
  );
};

StartButtonContainer.propTypes = propTypes;
StartButton.propTypes = propTypes;
