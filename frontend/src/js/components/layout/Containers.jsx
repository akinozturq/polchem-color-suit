import React from 'react';
import classnames from 'classnames';
import Proptypes from 'prop-types';

const propTypes = {
  className: Proptypes.string,
  children: Proptypes.node,
};

export const TopBar = (props) => (
  <div
    className={classnames(
      props.className,
      'container d-flex flex-row flex-grow-1 flex-fill justify-content-end align-items-end align-content-end align-self-end flex-nowrap'
    )}
  >
    <div className="row d-flex flex-row flex-grow-1 flex-shrink-0 flex-fill justify-content-start align-items-start align-content-end align-self-end flex-wrap">
      {props.children}
    </div>
  </div>
);

export const TopBarLeft = (props) => (
  <div
    className={classnames(
      props.className,
      'col-auto d-flex flex-row flex-fill justify-content-start align-self-start top-action-buttons-container'
    )}
  >
    {props.children}
  </div>
);

export const TopBarRight = (props) => (
  <div
    className={classnames(
      props.className,
      'col-auto  d-flex flex-row flex-grow-0 flex-fill justify-content-between  top-action-buttons-container'
    )}
  >
    {props.children}
  </div>
);

TopBar.propTypes = propTypes;
TopBarLeft.propTypes = propTypes;
TopBarRight.propTypes = propTypes;
