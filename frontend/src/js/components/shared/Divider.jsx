import React from 'react';
import PropTypes from 'prop-types';

export class Divider extends React.Component {
  render() {
    return <div className="my_menu_divider">{this.props.txt}</div>;
  }
}

Divider.propTypes = {
  txt: PropTypes.string,
};
