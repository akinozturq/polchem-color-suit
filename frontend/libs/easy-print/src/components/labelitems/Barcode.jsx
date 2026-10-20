import React from 'react';
import { Image, Rect, Text } from 'react-konva';
import AddTransformer from './Transformer';
import PropTypes from 'prop-types';
import { gridSize, dragBoundItem } from '../../containers/Utils';
import { BARCODE_EAN13 } from '../../mylib/Constants';
import bwipjs from 'bwip-js';

const DUMMY_BARCODE_CODE = {
  ean13: '978020137962',
  ean8: '9031101',
  code39: 'ABC-1234',
  ean14: '',
  upca: '72527273070',
  isbn: '9781234567897',
  issn: '9771234567898',
  pzn: '',
  itf14: '',
  code128: 'ABC-abc-1234',
  'gs1-128': '(01)12345678901231',
  'gs-128': '(01)12345678901231',
  qrcode: 'This is a QR Code',
  datamatrix: 'This is a Data Matrix',
  databarstacked: '(01)2401234567890',
  databarexpandedstacked: '(01)12345678901231(3202)123456(15)120202',
};

class Barcode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gsucc: true,
      barcodecanvas: '',
      options: {
        bcid: BARCODE_EAN13, // Barcode type code39
        text: DUMMY_BARCODE_CODE.ean13, // Text to encode 978020137962
        scale: 3, // 3x scaling factor
        height: 10, // Bar height, in millimeters
        includetext: false, // Show human-readable text
        textxalign: 'center', // Always good to set this

        dontlint: true,
      },
    };
    this.shapeRef = React.createRef();
    this.trRef = React.createRef();
  }

  //Set the correct state based on Store's props
  static getDerivedStateFromProps(nextProps, prevState) {
    const itm_type =
      nextProps.item.type === 'gs-128' ? 'gs1-128' : nextProps.item.type;
    const nextText = nextProps.useDummyData
      ? DUMMY_BARCODE_CODE[itm_type]
      : nextProps.item.text;
    if (
      prevState.options.bcid !== itm_type ||
      prevState.options.text !== nextText
    ) {
      return {
        ...prevState,
        options: {
          ...prevState.options,
          bcid: itm_type,

          text: nextText,
        },
      };
    }
    return null;
  }
  componentDidMount() {
    const canvas = document.createElement('canvas');

    try {
      // The return value is the canvas element
      if (this.state.options.text) {
        let rs = bwipjs.toCanvas(canvas, this.state.options);
        this.setState({
          //...item,
          ...this.state,
          barcodecanvas: rs,
          gsucc: true,
        });
      } else {
        this.setState({
          gsucc: false,
          barcodecanvas: '',
        });
      }
    } catch (e) {
      // `e` may be a string or Error object
      console.log(e);
      this.setState({
        gsucc: false,
        barcodecanvas: '',
      });
    }
    /*barcodePromise(canvas, this.state.options)
      .then(() => {
        this.setState({
          //...item,
          ...this.state,
          barcodecanvas: canvas,
          gsucc: true,
        });
      })
      .catch((err) => {
        // console.log(err);
        // Barcode generation failed. Let user know
        this.setState({
          gsucc: false,
          barcodecanvas: '',
        });
      });*/
  }

  componentDidUpdate(_, prevState) {
    const canvas = document.createElement('canvas');
    if (
      prevState.options.text !== this.state.options.text ||
      prevState.options.bcid !== this.state.options.bcid
    ) {
      this.setState(
        {
          ...this.state,
          options: {
            ...this.state.options,
            text: this.state.options.text,
            bcid: this.state.options.bcid,
          },
        },
        () => {
          try {
            // The return value is the canvas element
            if (this.state.options.text) {
              let rs = bwipjs.toCanvas(canvas, {
                ...this.state.options,
                includetext: false,
              });
              this.setState({
                //...item,
                ...this.state,
                barcodecanvas: rs,
                gsucc: true,
              });
            } else {
              this.setState({
                gsucc: false,
                barcodecanvas: '',
              });
            }
          } catch (e) {
            // `e` may be a string or Error object
            console.log(e);
            this.setState({
              gsucc: false,
              barcodecanvas: '',
            });
          }
        }
      );
    }
  }

  dragBound = (pos, rotation) => {
    const { x, y } = dragBoundItem(
      pos,
      this.props.layout,
      this.props.item,
      rotation
    );
    return { x, y };
  };

  render() {
    const { item, move, selectedItemId, readonly, selectItem, updateItem } =
      this.props;
    const name = 'barcode' + item.id;
    const isSelected = item.id === this.props.selectedItemId;
    return (
      <React.Fragment>
        {isSelected && !readonly && (
          <Rect
            x={item.x - 2}
            y={item.y - 2}
            width={item.width + 4}
            height={item.height + 4}
            stroke={'#99EEFF88'}
            strokeWidth={2}
            shadowBlur={10}
            shadowOffset={{ x: 5, y: 5 }}
            shadowOpacity={0.5}
            rotation={item.rotation}
          />
        )}
        {this.state.gsucc ? (
          <>
            <Image
              name={name}
              ref={this.shapeRef}
              x={item.x}
              y={item.y}
              image={this.state.barcodecanvas}
              width={item.width}
              height={item.height}
              rotation={item.rotation}
              draggable={move && selectedItemId === item.id}
              //fill={this.state.isDragging ? 'green' : 'black'}
              dragBoundFunc={(pos) =>
                this.dragBound(pos, Number(item.rotation))
              }
              onClick={readonly ? null : () => selectItem(item.id)}
              onTransformEnd={(e) => {
                // transformer is changing scale
                const node = this.shapeRef.current;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                // we will reset it back
                node.scaleX(1);
                node.scaleY(1);
                updateItem({
                  ...item,
                  x: node.x(),
                  y: node.y(),
                  width: Math.min(Math.max(node.width() * scaleX, 25), 150),
                  height: Math.min(Math.max(node.height() * scaleY, 25), 150),
                });
              }}
              onDragEnd={(e) => {
                const x = Math.round(e.target.x() / gridSize) * gridSize;
                const y = Math.round(e.target.y() / gridSize) * gridSize;
                this.shapeRef.current.position({
                  x,
                  y,
                });
                updateItem({
                  ...item,
                  x,
                  y,
                });
              }}
            />
            {item.showText && (
              <Text
                name={name}
                x={item.x}
                y={item.y + item.height}
                width={item.width}
                height={item.height}
                text={item.text || this.state.options.text}
              />
            )}
          </>
        ) : (
          // Now the data is displayed as red when impossible to render as barcode. Maybe something else would work better...
          <Text
            name={name}
            x={item.x}
            y={item.y}
            width={item.width}
            height={item.height}
            text={item.text}
            fill={'red'}
          />
        )}

        {readonly || !move ? null : (
          <AddTransformer
            ref={this.trRef}
            selectedShapeName={isSelected ? name : null}
          />
        )}
      </React.Fragment>
    );
  }
}
Barcode.propTypes = {
  readonly: PropTypes.bool,
  item: PropTypes.object,
  selectedItemId: PropTypes.number,
  selectItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  layout: PropTypes.object,
  standAlone: PropTypes.bool,
  useDummyData: PropTypes.bool,
  move: PropTypes.bool,
};

Barcode.defaultProps = {
  readonly: false,
  useDummyData: true,
  selectItem: () => {},
  updateItem: () => {},
};

export default Barcode;
