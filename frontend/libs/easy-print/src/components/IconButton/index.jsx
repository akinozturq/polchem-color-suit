import React from 'react';
import './styles.css';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '../../mylib/Button';

const IconButton = (props) => {
  const {
    icon,
    iconSize,
    text,
    inNavbar,
    onClick,
    color,
    active,
    draggable,
    id,
    onDragStart,
    spin,
  } = props;
  const buttonStyle = classnames({
    btn__container: true,
    'btn__container--navbar': inNavbar,
    'btn__container--toolbar': !inNavbar,
  });
  const iconStyle = classnames({
    icon: true,
    'icon--toolbar': !inNavbar,
  });
  return (
    <Button
      bordered={false}
      type="button"
      color={color}
      className={buttonStyle}
      size="md"
      onClick={onClick}
      active={active}
      draggable={draggable}
      id={id}
      onDragStart={onDragStart}
      style={{ backgroundColor: color === 'danger' ? '#dc3545' : 'unset' }}
    >
      <span className={iconStyle}>
        {icon && (
          <FontAwesomeIcon icon={`${icon}`} size={iconSize} spin={spin} />
        )}
      </span>
      {text}
    </Button>
  );
};

IconButton.defaultProps = {
  inNavbar: false,
  iconSize: '2x',
  text: '',
  onClick: () => {},
  active: false,
  draggable: false,
  spin: false,
};

IconButton.propTypes = {
  icon: PropTypes.string,
  text: PropTypes.string,
  iconSize: PropTypes.string,
  inNavbar: PropTypes.bool,
  onClick: PropTypes.func,
  color: PropTypes.string,
  active: PropTypes.bool,
  draggable: PropTypes.bool,
  id: PropTypes.string,
  onDragStart: PropTypes.func,
  spin: PropTypes.bool,
};

export default IconButton;
