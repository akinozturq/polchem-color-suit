import React from 'react';
import PropTypes from 'prop-types';
import {
  Stage,
  Layer,
  Image,
  Group,
  Ellipse,
  Shape,
  Text,
  Label,
  Tag,
} from 'react-konva';
import criticalLevel from 'img/canisters/criticalLevel.svg';
import warningLevel from 'img/canisters/warningLevel.svg';
import canBackground from 'img/canisters/canBackground.svg';
import canForegroundRight from 'img/canisters/canForegroundRight.svg';
import canForegroundLeft from 'img/canisters/canForegroundLeft.svg';

import { RGBColorToHex } from 'js/mylib/Utils';

const propTypes = {
  canister: PropTypes.shape({
    code: PropTypes.string.isRequired,
    circuits: PropTypes.array.isRequired,
    barcode: PropTypes.string,
    enabled: PropTypes.bool,
    minLevel: PropTypes.number.isRequired,
    rgb: PropTypes.number,
    currLevel: PropTypes.number.isRequired,
    warnLevel: PropTypes.number.isRequired,
    maxLevel: PropTypes.number.isRequired,
    specificgravity: PropTypes.number,
  }),
  warnChanged: PropTypes.func,
  currLevelChanged: PropTypes.func,
  shotFormatter: PropTypes.object.isRequired,
};

const defaultProps = {
  canister: null,
};

export default class Canister extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      image_critical: null,
      image_warning: null,
      image_can: null,
      image_scale: null,
      image_shadow: null,
      image_levels: null,
    };
  }

  componentDidMount() {
    const image_criti = new window.Image();
    image_criti.src = criticalLevel;
    image_criti.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        image_critical: image_criti,
      });
    };
    const image_warn = new window.Image();
    image_warn.src = warningLevel;
    image_warn.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        image_warning: image_warn,
      });
    };
    const canbackground = new window.Image();
    canbackground.src = canBackground;
    canbackground.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        image_can: canbackground,
      });
    };
    const canforegroundRight = new window.Image();
    canforegroundRight.src = canForegroundRight;
    canforegroundRight.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        image_scale: canforegroundRight,
      });
    };
    const canforegroundLeft = new window.Image();
    canforegroundLeft.src = canForegroundLeft;
    canforegroundLeft.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        image_shadow: canforegroundLeft,
      });
    };
  }

  warnLevelChanged(evt) {
    if (this.props.canister) {
      let warn_top_pos = evt.currentTarget.attrs.y;
      let tmp = 250;
      let warn_level = ((tmp - (warn_top_pos - 15)) * 100) / tmp;
      warn_level = Math.floor(
        this.props.canister.maxLevel * (warn_level / 100)
      );
      this.props.warnChanged(warn_level);
    }
  }

  currentColorantLevelChanged(evt) {
    if (this.props.canister) {
      let crit_level = this.props.canister
        ? (this.props.canister.minLevel * 100) / this.props.canister.maxLevel
        : 10; // as percents of the max size
      let curr_top_pos = evt.currentTarget.attrs.y;
      let tmp = 250;
      let curr_level = ((tmp - (curr_top_pos - 15)) * 100) / tmp;
      if (curr_level < crit_level) {
        curr_level = crit_level;
      }

      curr_level = Math.floor(
        this.props.canister.maxLevel * (curr_level / 100)
      );

      this.props.currLevelChanged(
        Math.min(curr_level, this.props.canister.maxLevel)
      );
    }
  }

  render() {
    let colorFill = this.props.canister
      ? RGBColorToHex(this.props.canister.rgb) + 'EE'
      : 'rgba(255, 255, 255, 0)';

    let level = this.props.canister
      ? (this.props.canister.currLevel * 100) / this.props.canister.maxLevel
      : 100; // as percents of the max size
    let warn_level = this.props.canister
      ? (this.props.canister.warnLevel * 100) / this.props.canister.maxLevel
      : 20; // as percents of the max size
    let crit_level = this.props.canister
      ? (this.props.canister.minLevel * 100) / this.props.canister.maxLevel
      : 10; // as percents of the max size

    let myheight = 300;
    let mywidth = myheight * 0.7;
    let tmp = myheight - 50;
    let cnt_top_pos = Math.floor(tmp - (tmp * level) / 100) + 35;
    let warn_top_pos = Math.floor(tmp - (tmp * warn_level) / 100) + 15;
    let crit_top_pos = Math.floor(tmp - (tmp * crit_level) / 100) + 15;

    return (
      <Stage width={280} height={myheight + 50}>
        <Layer>
          <Group>
            <Image
              image={this.state.image_can}
              y={0}
              x={0}
              width={mywidth}
              height={myheight + 30}
            />

            {/* Colorant level in canister visualization */}
            <Shape
              sceneFunc={(context, shape) => {
                context.beginPath();
                context.moveTo(13, myheight - 10);

                context.bezierCurveTo(
                  13,
                  myheight + 20,
                  197,
                  myheight + 20,
                  197,
                  myheight - 10
                );
                context.lineTo(197, cnt_top_pos);
                context.bezierCurveTo(
                  197,
                  cnt_top_pos - 30,
                  13,
                  cnt_top_pos - 30,
                  13,
                  cnt_top_pos
                );
                context.lineTo(13, myheight - 10);
                context.closePath();

                // (!) Konva specific method, it is very important
                context.fillStrokeShape(shape);
              }}
              fill={colorFill}
              strokeWidth={2}
              shadowBlur={5}
            />

            {/**CNT border */}
            <Ellipse
              x={mywidth / 2}
              y={cnt_top_pos}
              radius={{ x: 90, y: 20 }}
              fill={colorFill}
            />

            <Image
              image={this.state.image_scale}
              y={40}
              x={(mywidth / 3) * 2}
              width={mywidth / 3}
              height={myheight - 40}
            />
          </Group>

          {/**Critical border */}
          <Group
          /*draggable
            dragBoundFunc = {(pos) =>{
              let y = pos.y;
              if (y < -(myheight-90)) {
                y=-(myheight-90);
              }
              if (y>20){
                y=20;
              }
              return {
                x:0,
                y:y
              };
            }}*/
          >
            <Image
              image={this.state.image_critical}
              y={crit_top_pos}
              x={13}
              ref={(node) => {
                this.imageNode = node;
              }}
              width={mywidth + 57}
              //height={30}
            />
          </Group>
          {this.props.canister && (
            <Group>
              <Label
                x={200}
                y={cnt_top_pos}
                onDragEnd={(evt) => this.currentColorantLevelChanged(evt)}
                draggable={!!this.props.currLevelChanged}
                dragBoundFunc={(pos) => {
                  let y = pos.y;

                  if (y < 15) {
                    y = 15;
                  }
                  if (y > crit_top_pos) {
                    y = crit_top_pos;
                  }

                  return {
                    x: 200,
                    y: y,
                  };
                }}
              >
                <Tag
                  fill="black"
                  pointerDirection="left"
                  pointerWidth={15}
                  pointerHeight={15}
                  lineJoin="round"
                  shadowColor="black"
                />
                <Text
                  text={
                    this.props.canister
                      ? this.props.shotFormatter.format({
                          volume: this.props.canister.currLevel,
                          specificgravity: this.props.canister.specificgravity,
                        })
                      : ''
                  }
                  fill="white"
                  fontSize={16}
                  padding={5}
                />
              </Label>
            </Group>
          )}

          {/**Warning border */}
          <Group
          //draggable
          >
            <Image
              image={this.state.image_warning}
              y={warn_top_pos}
              x={13}
              ref={(node) => {
                this.imageNode = node;
              }}
              width={mywidth + 57}
              onMouseEnter={() => {
                document.body.style.cursor = 'pointer';
              }}
              onMouseLeave={() => {
                document.body.style.cursor = 'default';
              }}
              //.dragEndNode.attrs.y
              onDragEnd={(evt) => this.warnLevelChanged(evt)}
              draggable={!!this.props.warnChanged}
              dragBoundFunc={(pos) => {
                let y = pos.y;
                if (y < 15) {
                  y = 15;
                }
                if (y > crit_top_pos) {
                  y = crit_top_pos;
                }
                return {
                  x: 13,
                  y: y,
                };
              }}
            />
          </Group>

          <Image
            image={this.state.image_shadow}
            y={28}
            x={0}
            width={mywidth / 5}
            height={myheight - 4}
          />
        </Layer>
      </Stage>
    );
  }
}

Canister.propTypes = propTypes;
Canister.defaultProps = defaultProps;
