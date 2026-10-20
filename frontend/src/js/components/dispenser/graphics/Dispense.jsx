import React from 'react';
import PropTypes from 'prop-types';
import { Stage, Layer, Image, Group, Shape } from 'react-konva';
import Konva from 'konva';
import machineTintingTop from 'img/machineBar/machineTinting-top.png';
import machineTintingBottom from 'img/machineBar/machineTinting-bottom.png';
import machineTintingBottom_top from 'img/machineBar/machineTinting-bottom_top.png';

const propTypes = {
  dispensing: PropTypes.bool.isRequired,
  color: PropTypes.arrayOf(PropTypes.string),
  width: PropTypes.number,
  height: PropTypes.number,
};

const defaultProps = {
  dispensing: false,
  width: 110,
  height: 90,
  color: ['#3F00f4'],
};

export default class Dispense extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      top_image: null,
      bottom_image: null,
      animation: null,
      bottom_image_top: null,
    };
  }

  componentDidMount() {
    const top_image = new window.Image();
    top_image.src = machineTintingTop;
    top_image.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        top_image: top_image,
      });
    };
    const bottom_image = new window.Image();
    bottom_image.src = machineTintingBottom;
    bottom_image.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        bottom_image: bottom_image,
      });
    };
    const bottom_image_top = new window.Image();
    bottom_image_top.src = machineTintingBottom_top;
    bottom_image_top.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        bottom_image_top: bottom_image_top,
      });
    };

    var position = 0;

    var anim = new Konva.Animation(() => {
      // this.rect.opacity((Math.sin(frame.time / period) + 1) / 2);
      // var dist = velocity * (frame.timeDiff / 1000);
      position += 2;
      if (this.drop !== null) {
        this.drop.setY(position);
        if (position > this.props.height) {
          position = 0;
        }
      }
    }, this.drop.getLayer());

    this.setState({
      animation: anim,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.dispensing !== prevProps.dispensing) {
      if (this.props.dispensing) {
        this.drop.setY(0);
        this.state.animation.start();
      } else {
        this.state.animation.stop();
        this.drop.setY(0);
      }
    }
  }

  componentWillUnmount() {
    if (this.state.animation) {
      this.state.animation.stop();
    }
  }

  mapColorsToDrops = (color, index) => {
    let offset = -index * 8 + this.props.color.length * 4;

    return (
      <Shape
        key={index}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(0 + offset, 0);
          context.lineTo(-8 + offset, 15);
          context.bezierCurveTo(
            -8 + offset,
            30,
            8 + offset,
            30,
            8 + offset,
            15
          );
          context.lineTo(0 + offset, 0);
          context.closePath();

          // (!) Konva specific method, it is very important
          context.fillStrokeShape(shape);
        }}
        fill={color}
        strokeWidth={2}
        shadowBlur={5}
      />
    );
  };

  render() {
    return (
      <Stage width={this.props.width} height={this.props.height}>
        <Layer>
          <Image
            image={this.state.bottom_image_top}
            y={this.props.height - 40}
            x={this.props.width - 80}
            width={this.props.width - 60}
            height={7}
          />
          <Group
            x={this.props.width / 2}
            y={0}
            ref={(node) => {
              this.drop = node;
            }}
          >
            {this.props.color.map(this.mapColorsToDrops)}
          </Group>

          <Image
            image={this.state.top_image}
            y={0}
            x={0}
            width={110}
            height={30}
          />

          <Image
            image={this.state.bottom_image}
            y={this.props.height - 40}
            x={this.props.width - 80}
            width={this.props.width - 60}
            height={40}
          />
        </Layer>
      </Stage>
    );
  }
}

Dispense.propTypes = propTypes;
Dispense.defaultProps = defaultProps;
