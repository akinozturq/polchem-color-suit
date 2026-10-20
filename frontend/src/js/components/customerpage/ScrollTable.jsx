import React from 'react';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';

import { CustomScrollbars, rightToLeft } from 'js/mylib/Utils';
import { resizableGrid } from '../../mylib/ResizableTable';

const propTypes = {
  data: PropTypes.array,
  columns: PropTypes.array,
  keyField: PropTypes.string,
  noDataIndication: PropTypes.func,
  selectRow: PropTypes.object,
  fetchMore: PropTypes.func,
};

const defaultProps = {};

class ScrollTable extends React.Component {
  componentDidUpdate() {
    const table = document.getElementById('customer_table');
    const parent = document.getElementById('customer_holder');
    if (table) resizableGrid(table, parent);
  }

  handleScroll = (e) => {
    const bottom =
      Math.ceil(e.target.scrollTop) + e.target.clientHeight >=
      e.target.scrollHeight;
    if (bottom) {
      this.props.fetchMore();
    }
  };
  render() {
    const { data, columns, keyField, noDataIndication, selectRow } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const rowStyle = () => alignStyle;

    return (
      <CustomScrollbars
        id="customer_holder"
        className="br-8 fixed-table-header cursor-pointer"
        style={{
          height: '100%',
          background: '#112E40',
          color: 'white',
          ...alignStyle,
        }}
        onScroll={this.handleScroll}
      >
        <BootstrapTable
          id="customer_table"
          keyField={keyField}
          hover
          data={data}
          columns={columns}
          noDataIndication={noDataIndication}
          selectRow={selectRow}
          rowStyle={rowStyle}
        />
      </CustomScrollbars>
    );
  }
}

ScrollTable.propTypes = propTypes;
ScrollTable.defaultProps = defaultProps;

export default ScrollTable;
