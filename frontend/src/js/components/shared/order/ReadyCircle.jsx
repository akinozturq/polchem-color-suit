import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getCanImage, intToR_G_B } from 'js/mylib/Utils';
import { COLORCODE_MAX_LENGTH } from '../../../Constants';
import { InputGroup, UncontrolledTooltip } from 'reactstrap';
import NumberInput from '../../../mylib/NumberInput';
import { connect } from 'react-redux';
import { isDarkColor } from '../../../mylib/ColorCalc';

const propTypes = {
  color: PropTypes.string,
  colorBeforeEdit: PropTypes.string,
  text: PropTypes.string,
  second_text: PropTypes.string,
  goTo: PropTypes.func,
  edit: PropTypes.func,
  section: PropTypes.string,
  dataTestid: PropTypes.string,
  img: PropTypes.string,
  plus: PropTypes.func,
  increment: PropTypes.func,
  decrement: PropTypes.func,
  minus: PropTypes.func,
  disabled: PropTypes.bool,
  dispensing: PropTypes.bool,
  readOnly: PropTypes.bool,
  type: PropTypes.string,
  product: PropTypes.object,
  displayEdit: PropTypes.bool.isRequired,
  order: PropTypes.object,
  formula: PropTypes.object,
  minNCans: PropTypes.number,
  maxNCans: PropTypes.number,
};

const defaultProps = {
  color: null,
  colorBeforeEdit: null,
  img: null,
  text: '',
  second_text: null,
  goTo: console.log,
  section: '',
  plus: null,
  increment: null,
  decrement: null,
  minus: null,
  disabled: false,
  readOnly: false, // if true not possible fire events
  dispensing: false, // True when order is beeing dispensed --> block click actions!
  displayEdit: false,
  minNCans: 1,
};

class ReadyCircle extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editNoOfCans: false,
    };
  }

  componentDidUpdate() {
    if (this.state.editNoOfCans) {
      document.getElementById('noOfCansInput')?.focus();
    }
  }

  getContent = () => {
    if (this.props.color) {
      let circleStyle_preview = {
        height: '100%',
        width: '100%',
        backgroundColor: this.props.color,
        //borderStyle: 'solid',
        borderRadius: '50%',
        //display: 'inline-block',
        position: 'absolute',
        margin: 'auto',
        display: 'flex',
        flexFlow: 'column',
      };

      const rgb = this.props.order?.item?.rgb || this.props.order?.color?.rgb;

      const isDark = rgb != null ? isDarkColor(intToR_G_B(rgb)) : false;

      const textColor = isDark ? '#FFF' : 'unset';

      let textStyle = {
        alignContent: 'center',
        display: 'flex',
        flex: '0 1 auto',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        fontSize: 'min(1.5vw, 2vh)',
        fontWeight: 'bold',
        color:
          this.props.text.length > COLORCODE_MAX_LENGTH ? 'red' : textColor,
      };

      const primer_color = this.props.order.item.primer_color;

      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {primer_color && (
            <div
              className={'ready-circle-border'}
              style={{
                ...circleStyle_preview,
                backgroundColor: `rgb(${intToR_G_B(primer_color.rgb).join(',')})`,
                position: 'absolute',
                right: '-0.75rem',
                zIndex: 0,
              }}
            />
          )}
          <div
            className={primer_color && 'ready-circle-border'}
            data-testid={this.props.dataTestid}
            style={{
              ...circleStyle_preview,
              zIndex: 1,
              left: primer_color ? '-0.75rem' : 'unset',
            }}
          >
            <div
              style={{
                flex: '1 1 auto',
                backgroundColor: this.props.colorBeforeEdit,
              }}
            />
            <h5 data-testid={this.props.dataTestid + '_text'} style={textStyle}>
              {this.props.text}
              {this.props.displayEdit && (
                <div>
                  <FontAwesomeIcon
                    icon="pencil-alt"
                    style={{ color: 'blue' }}
                  />
                </div>
              )}
            </h5>
            <div style={{ flex: '1 1 auto' }} />
          </div>
        </div>
      );
    } else if (this.props.product) {
      let img_style = {
        margin: 'auto',
        maxHeight: 'min(10vw, 14vh)',
        maxWidth: 'min(10vw, 14vh)',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      };
      let src = this.props.img;
      if (!this.props.img) {
        img_style.filter = 'invert(1)';
        src = getCanImage(this.props.order?.can?.nominalamount || 10000);
      }
      return (
        <img
          data-testid={this.props.dataTestid}
          style={img_style}
          src={src}
          alt={this.props.text}
        />
      );
    } else if (
      this.props.type === 'numberOfCans' &&
      this.props.order.item.ncans === 0
    ) {
      return (
        <div className={'mt-1'}>
          <FontAwesomeIcon icon="save" style={{ fontSize: '3.5vw' }} />
        </div>
      );
    } else {
      let text_style = {
        alignContent: 'center',
        display: 'grid',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        height: '100%',
        fontSize:
          this.props.text && this.props.text.length > 8
            ? 'min(1.5vw, 2vh)'
            : 'min(2.5vw, 4vh)',
        fontWeight: 'bold',
      };
      return (
        <>
          <div style={text_style}>
            <div data-testid={this.props.dataTestid}>
              {this.props.text?.length > 10 &&
              this.props.type === 'machineSwitching'
                ? this.props.text.slice(0, 10) + '...'
                : this.props.text}

              {this.props.displayEdit && !this.props.disabled && (
                <div>
                  <FontAwesomeIcon
                    icon="pencil-alt"
                    style={{ color: 'blue' }}
                  />
                </div>
              )}
            </div>

            {this.props.second_text && (
              <div style={{ fontSize: 'min(1.5vw, 2vh)' }}>
                {this.props.second_text}
              </div>
            )}
          </div>
          {this.props.type === 'machineSwitching' && (
            <UncontrolledTooltip
              placement="top"
              target={'div' + 'machineSwitching'}
            >
              {this.props.text}
            </UncontrolledTooltip>
          )}
        </>
      );
    }
  };

  showEditNoOfCansField = () => {
    return (
      <InputGroup>
        <NumberInput
          className="form-control text-center font-weight-bold margin-0"
          id={'noOfCansInput'}
          min={this.props.minNCans}
          max={this.props.maxNCans}
          decimals={0}
          style={{ height: 'min(4vw, 6vh)', fontSize: 'min(2.5vw, 3vh)' }}
          value={this.props.order.item.ncans}
          onChange={(value) => {
            if (value >= this.props.order.ncans_tinted + 1)
              this.props.edit(value);
            this.setState({ editNoOfCans: false });
          }}
          deferChange
        />
      </InputGroup>
    );
  };

  render() {
    const {
      disabled,
      readOnly,
      dispensing,
      minNCans,
      maxNCans,
      color,
      order: {
        item: { primer_color },
      },
    } = this.props;

    let classes =
      (disabled ? ' disabled ' : '') + (readOnly ? ' read-only ' : '');

    if (this.props.plus && !dispensing && !disabled && !readOnly) {
      return (
        <div
          id={'div' + this.props.type}
          className={'ready-circle ' + classes}
          tabIndex={0}
          onKeyUp={(e) => {
            e.key === 'Enter' && this.props.goTo(this.props.section);
          }}
        >
          {this.props.type === 'numberOfCans' &&
          this.props.order.item.ncans >= maxNCans ? null : (
            <div
              className={'ready-circle-plus ' + classes}
              data-testid={`${this.props.type}plus`}
              onClick={this.props.plus}
            >
              <FontAwesomeIcon icon="plus" />
            </div>
          )}
          <div
            className={'ready-circle-text ' + classes}
            onClick={
              this.props.type === 'numberOfCans' && this.props.edit
                ? () => {
                    this.setState({ editNoOfCans: true });
                  }
                : () => this.props.goTo(this.props.section)
            }
          >
            {this.state.editNoOfCans
              ? this.showEditNoOfCansField()
              : this.getContent()}
          </div>
          {this.props.type === 'numberOfCans' &&
          this.props.order.item.ncans <= minNCans ? null : (
            <div
              data-testid={`${this.props.type}minus`}
              className={'ready-circle-minus ' + classes}
              onClick={this.props.minus}
            >
              <FontAwesomeIcon icon="minus" />
            </div>
          )}
        </div>
      );
    } else if (this.props.increment && !dispensing && !disabled && !readOnly) {
      return (
        <div
          id={'div' + this.props.type}
          className={'ready-circle ' + classes}
          tabIndex={0}
          onKeyUp={(e) => {
            e.key === 'Enter' && this.props.goTo(this.props.section);
          }}
        >
          <div
            className={'ready-circle-plus ' + classes}
            data-testid={`${this.props.type}plus`}
            onClick={this.props.increment}
          >
            <FontAwesomeIcon
              icon="caret-up"
              size="2x"
              style={{ marginTop: '-7px' }}
            />
          </div>
          <div
            className={'ready-circle-text ' + classes}
            onClick={() => this.props.goTo(this.props.section)}
          >
            {this.getContent()}
          </div>
          <div
            className={'ready-circle-minus ' + classes}
            onClick={this.props.decrement}
          >
            <FontAwesomeIcon icon="caret-down" size="2x" />
          </div>
        </div>
      );
    } else {
      return (
        <div
          id={'div' + this.props.type}
          className={'ready-circle ' + classes}
          tabIndex={disabled || readOnly ? -1 : 0}
          onKeyUp={
            disabled || dispensing || readOnly
              ? null
              : (e) => {
                  e.key === 'Enter' && this.props.goTo(this.props.section);
                }
          }
          onClick={
            disabled || dispensing || readOnly
              ? null
              : () => this.props.goTo(this.props.section)
          }
          style={
            primer_color && color
              ? {
                  overflow: 'visible',
                  borderColor: 'transparent',
                  backgroundColor: 'transparent',
                }
              : undefined
          }
        >
          {this.getContent()}
        </div>
      );
    }
  }
}

ReadyCircle.propTypes = propTypes;
ReadyCircle.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    order: store.order,
    formula: store.formula,
  };
}

export default connect(mapStateToProps, null)(ReadyCircle);
