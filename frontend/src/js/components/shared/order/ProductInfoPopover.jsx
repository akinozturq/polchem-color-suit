import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ORDER_MODE_MATCHING } from '../../../Constants';

const propTypes = {
  is_pro: PropTypes.bool.isRequired,
  productname: PropTypes.string.isRequired,
  url: PropTypes.string,
  order_mode: PropTypes.string.isRequired,
};

const defaultProps = {};

export default class ProductInfoPopover extends React.Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.state = {
      popoverOpen: false,
    };
  }

  toggle() {
    this.setState((state) => ({
      popoverOpen: !state.popoverOpen,
    }));
  }

  openInNewTab(url) {
    if (!this.props.is_pro || !url) {
      return;
    }

    if (window.qtside) {
      window.qtside.bridge.openProductInfo(url);
    } else {
      window.open(url, '_blank');
    }
  }

  render() {
    const { url, order_mode } = this.props;
    const onClick = url ? () => this.openInNewTab(this.props.url) : undefined;
    const text_style = {
      color: 'white',
      cursor: url && 'pointer',
      textDecoration: url && 'underline',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
    };

    return (
      <>
        <p
          className="directly-over-bg"
          data-testid="productNameToolTip"
          id="productinfo"
          style={text_style}
          onClick={onClick}
        >
          {url && this.props.is_pro && (
            <span>
              <FontAwesomeIcon icon="external-link-alt" />
            </span>
          )}
          <span
            style={{
              top: -4,
              left: 20,
              overflowWrap: 'break-word',
              lineHeight: this.props.productname.length > 30 ? 1 : 2,
              width: order_mode === ORDER_MODE_MATCHING ? '200%' : '90%',
              overflow: 'visible',
            }}
          >
            {this.props.productname}
          </span>
        </p>
        {/** 
      <Popover placement="bottom" isOpen={this.state.popoverOpen} target="productinfo" toggle={this.toggle}>
        <PopoverHeader>Product info</PopoverHeader>
        <PopoverBody>
          <iframe title="productinfo" src={this.props.url}>
            <p>Your browser does not support iframes.</p>
          </iframe>
        </PopoverBody>
      </Popover>
      */}
      </>
    );
  }
}

ProductInfoPopover.propTypes = propTypes;
ProductInfoPopover.defaultProps = defaultProps;
