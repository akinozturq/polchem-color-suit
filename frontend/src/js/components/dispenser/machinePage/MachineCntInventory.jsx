import React from 'react';
import PropTypes from 'prop-types';
import { Col, Progress, Row } from 'reactstrap';
import { propType as machineType } from 'js/redux/reducers/Machine';

import BootstrapTable from 'react-bootstrap-table-next';
import { CustomScrollbars } from 'js/mylib/Utils';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import inventoryActions from 'js/redux/reducers/Inventory';

import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import ColorThumbnail from '../../shared/ColorThumbnail';
import cellEditFactory from 'react-bootstrap-table2-editor';

class MachineCntInventory extends React.Component {
  constructor(props) {
    super(props);
    this.state = { disable_clear: false };
  }

  componentDidMount() {
    this.props.fetchInventory();
  }

  accessDenied = (key) => {
    const { privileges } = this.props;
    return !_.includes(privileges, key);
  };

  cnt_formatter = (cell, row) => {
    return (
      <div style={{ display: 'inline-flex' }}>
        <div style={{ width: '32px' }} className="pl-4">
          <ColorThumbnail rgb={row.rgb} size="24px"></ColorThumbnail>
        </div>
        {cell}
      </div>
    );
  };

  level_formatter = (cell, row) => {
    let color = 'success';
    if (row.count < 1) {
      color = 'danger';
    } else if (row.count < row.warnlevel) {
      color = 'warning';
    }

    const max_pr = Math.max(row.warnlevel, row.count);

    return (
      <Progress
        value={row.count === 0 ? max_pr : row.count}
        max={max_pr}
        color={color}
      />
    );
  };

  number_validator = (newValue) => {
    try {
      if (!isNaN(parseInt(newValue))) {
        return true;
      }
    } catch (e) {
      return { valid: false, message: String(e) };
    }
  };

  update_inventory = (oldValue, newValue, row) => {
    this.props.updateInventory(row);
  };

  render() {
    const { t, inventory } = this.props;
    const { colorants } = this.props.machine;

    const codes = colorants.map((x) => x.code);

    let table_data = (inventory.data || [])
      .filter((x) => codes.includes(x.cntcode))
      .map((x) => ({
        ...x,
        ...colorants.find((y) => y.code === x.cntcode),
        keyfield: x.cntcode + x.cansizecode,
      }));

    table_data = _.sortBy(table_data, ['cntcode', 'cansizecode']);

    const selectRowProp = {
      mode: 'radio',
      clickToSelect: true,
      clickToEdit: true,
      hideSelectColumn: true,
      bgColor: 'lightblue',
    };

    const cellEdit = cellEditFactory({
      mode: 'click',
      blurToSave: true,
      afterSaveCell: this.update_inventory,
    });

    const columns = [
      {
        dataField: 'cntcode',
        text: t('lbl.colorant', 'Colorant'),
        formatter: this.cnt_formatter,
        editable: false,
      },
      {
        dataField: 'cansizecode',
        text: t('lbl.stock_unit', 'Stock unit'),
        editable: false,
      },
      {
        dataField: 'maxlevel',
        text: '',
        formatter: this.level_formatter,
        editable: false,
      },
      {
        dataField: 'count',
        text: t('lbl.stock_level', 'Stock level'),
        validator: this.number_validator,
      },
      {
        dataField: 'warnlevel',
        text: t('lbl.warnlevel', 'Warning level'),
      },
    ];
    return (
      <>
        <Row style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
          <Col>
            <CustomScrollbars
              id="table_holder"
              className="br-8 fixed-table-header"
              style={{
                height: 'calc(100vh - 102px - 9rem) ',
                background: '#112E40',
                color: 'white',
              }}
            >
              <BootstrapTable
                keyField="keyfield"
                hover
                data={table_data || []}
                columns={columns}
                noDataIndication={t('lbl.noErrors', 'No errors')}
                selectRow={selectRowProp}
                cellEdit={cellEdit}
              />
            </CustomScrollbars>
          </Col>
        </Row>
      </>
    );
  }
}

MachineCntInventory.propTypes = {
  t: PropTypes.func.isRequired,
  fetchInventory: PropTypes.func.isRequired,
  updateInventory: PropTypes.func.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  machine: machineType,
  inventory: PropTypes.shape({
    data: PropTypes.array,
  }),
};
MachineCntInventory.defaultProps = {};

function mapStateToProps(state) {
  return {
    inventory: state.inventory.colorants,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchInventory: inventoryActions.fetchInventory,
      updateInventory: inventoryActions.updateInventory,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MachineCntInventory)
);
