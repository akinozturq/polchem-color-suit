import { Component, createElement } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

const FONT_RESIZE_STEPS = [20, 16, 12, 10];

export default class TextFit extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentFontSize: null,
      prevText: null,
    };
    this.ref = null;
  }

  static getDerivedStateFromProps(props, state) {
    if (props.text !== state.prevText) {
      // reset font size when text changes
      return { currentFontSize: null, prevText: props.text };
    }
    return null;
  }

  componentDidMount() {
    this.resizeListener = _.debounce(this.resetFontSize, 150);
    window.addEventListener('resize', this.resizeListener);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeListener);
    this.resizeListener.cancel();
  }

  componentDidUpdate() {
    const { containerId } = this.props;
    const container = containerId
      ? document.getElementById(containerId)
      : this.ref;
    if (container && this.props.text) {
      const hasOverflowingChildren =
        container.offsetHeight < container.scrollHeight ||
        container.offsetWidth < container.scrollWidth;

      if (hasOverflowingChildren) {
        const fontsize =
          this.state.currentFontSize ||
          parseFloat(
            window.getComputedStyle(container).getPropertyValue('font-size')
          );
        const nextfontsize = FONT_RESIZE_STEPS.find((x) => x < fontsize);
        if (nextfontsize) {
          this.setState({ currentFontSize: nextfontsize });
        }
      }
    }
  }

  resetFontSize = () => {
    this.setState({
      currentFontSize: null,
    });
  };

  render() {
    const { currentFontSize } = this.state;
    const { component, text, style, containerId, ...rest } = this.props;
    const ref = containerId ? undefined : (elem) => (this.ref = elem);
    return createElement(
      component,
      {
        style: {
          ...style,
          fontSize: currentFontSize ? currentFontSize + 'px' : null,
        },
        ref,
        ...rest,
      },
      text
    );
  }
}

TextFit.propTypes = {
  /** Component type to render, default: 'div' */
  component: PropTypes.elementType.isRequired,
  /** Text to render */
  text: PropTypes.string,
  style: PropTypes.object,
  /** DOM id of element whose overflow to watch; omit to watch this component */
  containerId: PropTypes.string,
};
TextFit.defaultProps = {
  component: 'div',
};
