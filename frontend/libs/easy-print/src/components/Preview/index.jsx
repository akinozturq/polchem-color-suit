import React, { forwardRef } from 'react';
import { Stage, Layer } from 'react-konva';
import PropTypes from 'prop-types';
import Item from '../labelitems/Item';
import { PrintImage } from '../../containers/Utils';
import _ from 'lodash';
import assignVariables from '../../mylib/AssignVariables';

class Preview extends React.Component {
  constructor(props) {
    super(props);

    this.stageref = React.createRef();
    this.state = {
      layout: null,
      prevLayout: null,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.standAlone) {
      // State layout and update is needed because the custom text editing needs to be send to Qt Side!
      if (!_.isEqual(props.layout, state.prevLayout)) {
        return {
          layout: props.layout,
          prevLayout: _.cloneDeep(props.layout),
        };
      }
    }
    return null;
  }

  printRequested = (printername) => {
    let stage = this.stageref.getStage();
    const layout = assignVariables(
      this.props.standAlone ? this.state.layout : this.props.layout,
      this.props.orderItem
    );
    PrintImage(
      stage.toDataURL({
        pixelRatio: 4, // or other value you need
      }),
      JSON.stringify(layout),
      printername,
      this.props.copies
    );
  };

  updateItem = (item) => {
    // State layout and update is needed because the custom text editing needs to be send to Qt Side!
    this.setState((state) => {
      return {
        layout: {
          ...state.layout,
          items: {
            ...state.layout.items,
            [item.id]: { ...item },
          },
        },
      };
    });
  };

  render() {
    const {
      selectItem,
      updateItem,
      selectedItemId,
      pWidth,
      pHeight,
      standAlone,
      useDummyData,
      orderItem,
      zIndex,
      formatters,
      classNames,
    } = this.props;

    const layout = assignVariables(
      standAlone ? this.state.layout : this.props.layout,
      orderItem
    );

    const itemsArray = layout.itemids.map((id) => layout.items[id]);

    const asp_rat = Math.min(
      pHeight / layout.height.pixel,
      pWidth / layout.width.pixel
    );

    const previewWidth =
      asp_rat * pWidth > pWidth
        ? layout.width.pixel
        : layout.width.pixel * asp_rat;
    const previewHeight =
      asp_rat * pHeight > pHeight
        ? layout.height.pixel
        : asp_rat * layout.height.pixel;
    return (
      <div
        className={classNames}
        style={{
          backgroundColor: 'white',
          width: previewWidth,
          height: previewHeight,
          paddingTop: layout.marginTop * asp_rat,
          paddingBottom: layout.marginBottom * asp_rat,
          paddingLeft: layout.marginLeft * asp_rat,
          paddingRight: layout.marginRight * asp_rat,
        }}
        id={'ep_editor_container'}
      >
        <Stage
          width={
            previewWidth +
            2 -
            layout.marginLeft * asp_rat -
            layout.marginRight * asp_rat
          }
          height={
            previewHeight +
            2 -
            layout.marginTop * asp_rat -
            layout.marginBottom * asp_rat
          }
          ref={(node) => {
            this.stageref = node;
          }}
          id="stage"
          //changing scaling of preview in relation to the height and width of editor
          scaleX={asp_rat > 1 ? 1 : asp_rat}
          scaleY={asp_rat > 1 ? 1 : asp_rat}
        >
          <Layer>
            {itemsArray.map((item) => (
              <Item
                isPreview
                standAlone={standAlone}
                useDummyData={useDummyData}
                key={item.id}
                item={item}
                layout={layout}
                selectItem={selectItem}
                updateItem={standAlone ? this.updateItem : updateItem}
                selectedItemId={selectedItemId}
                zIndex={zIndex}
                formatters={formatters}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    );
  }
}

//TODO: I would recommend handling the variable filling in preview for the label data. That way the task needs to be done only once.

Preview.propTypes = {
  readonly: PropTypes.bool,
  layout: PropTypes.object.isRequired,
  selectItem: PropTypes.func,
  updateItem: PropTypes.func,
  selectedItemId: PropTypes.number,
  pWidth: PropTypes.number,
  pHeight: PropTypes.number,
  standAlone: PropTypes.bool,
  orderItem: PropTypes.object, // Object containing data for variables to be shown on preview,
  zIndex: PropTypes.string,
  formatters: PropTypes.object, // Functions to call to get the data in required format
  copies: PropTypes.number, // Parameters to pass on Qt printer
  useDummyData: PropTypes.bool,
  classNames: PropTypes.string,
};

Preview.defaultProps = {
  readonly: false,
  pWidth: 350,
  pHeight: 350,
  standAlone: false,
  useDummyData: true,
  classNames: '',
  orderItem: {},
  zIndex: '0',
  copies: 1,
  selectItem: () => {},
  updateItem: () => {},
};
// eslint-disable-next-line react/display-name
const FinalPreview = forwardRef(function finalPreview(props, ref) {
  return <Preview {...props} ref={ref} />;
});

export default FinalPreview;
