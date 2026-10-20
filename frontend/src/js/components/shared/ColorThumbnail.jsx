import React from 'react';
import { RGBColorToHex, invertColor } from 'js/mylib/Utils';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ColorThumbnail = (props) => {
  let {
    rgb,
    size,
    width,
    height,
    margin,
    hideIfNull,
    showNA,
    children,
    ...attrs
  } = props;
  if (size) {
    width = size;
    height = size;
  }
  const hasrgb = rgb != null;
  const backgroundColor = RGBColorToHex(rgb);
  const color = invertColor(backgroundColor, true);

  const style = hasrgb
    ? {
        minWidth: width,
        width,
        height,
        margin,
        backgroundColor,
        color,
        borderStyle: 'solid',
      }
    : {
        minWidth: width,
        width,
        height,
        margin,
        borderStyle: hideIfNull ? 'none' : 'dotted',
        boxShadow: 'none',
      };

  return (
    <div className="color-thumbnail" style={style} {...attrs}>
      {children}
      {showNA && !hasrgb && (
        <FontAwesomeIcon
          icon="eye-slash"
          color="#888A"
          style={{ verticalAlign: 'middle' }}
        />
      )}
    </div>
  );
};

ColorThumbnail.propTypes = {
  rgb: PropTypes.number,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.string,
  height: PropTypes.string,
  margin: PropTypes.string,
  hideIfNull: PropTypes.bool,
  showNA: PropTypes.bool,
  children: PropTypes.any,
};

export default ColorThumbnail;
