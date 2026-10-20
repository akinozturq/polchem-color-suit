import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Col, FormGroup, Label, Row } from 'reactstrap';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import { currencies2list } from '../../../mylib/Utils';

class CurrenciesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: null,
      edited: false,
    };
  }

  get_data = () => {
    const { item } = this.props;
    return currencies2list(item.value);
  };

  add_row = () => {
    this.props.updateItem(
      this.props.item,
      this.props.item.value ? this.props.item.value + ';(,1,2)' : '(,1,2)',
      this.props.idx
    );
  };

  remove_row = () => {
    let data = this.get_data();
    data.splice(this.state.selected.index, 1);

    const value = data
      .map((x) => {
        return `(${x.symbol},${x.rate},${x.decimals})`;
      })
      .join(';');

    this.props.updateItem(this.props.item, value, this.props.idx);
  };

  currency_changed = (oldValue, newValue, row, column) => {
    let data = this.get_data();
    if (column.dataField === 'rate') {
      const value = Number(String(newValue).replace(',', '.'));
      if (!isNaN(value)) {
        data[row.index][column.dataField] = value;
      }
    } else if (column.dataField === 'decimals') {
      const value = parseInt(newValue);
      if (!isNaN(value)) {
        data[row.index][column.dataField] = value;
      }
    } else {
      data[row.index][column.dataField] = newValue;
    }

    const value = data
      .map((x) => {
        return `(${x.symbol},${x.rate},${x.decimals})`;
      })
      .join(';');

    this.props.updateItem(this.props.item, value, this.props.idx);
  };

  render() {
    const { t, idx, item, accessDenied } = this.props;
    let disabled = item.islocked || accessDenied(item.code);

    const columns = [
      {
        dataField: 'symbol',
        text: t('lbl.currencysymbol', 'Currency symbol'),
        type: 'string',
      },
      {
        dataField: 'rate',
        text: t('lbl.exchangeRate', 'Exchange rate'),
        type: 'string',
      },
      {
        dataField: 'decimals',
        text: t('lbl.decimals', 'Decimals'),
        type: 'string',
      },
    ];

    const selectRowProp = {
      mode: 'radio',
      clickToSelect: true,
      clickToEdit: true,
      hideSelectColumn: true,
      bgColor: 'lightblue',
      style: { color: 'black' },
      onSelect: (tmp) => this.setState({ selected: tmp }),
    };

    const cellEdit = cellEditFactory({
      mode: 'click',
      blurToSave: true,
      beforeSaveCell: this.currency_changed,
    });

    return (
      <div key={idx}>
        <FormGroup row>
          <Label sm={5}>{item.name}</Label>
          <Col sm={7}>
            <Row>
              <Col>
                <BootstrapTable
                  data-testid={'currency_table'}
                  keyField="index"
                  hover
                  data={this.get_data()}
                  columns={columns}
                  selectRow={selectRowProp}
                  cellEdit={!disabled && cellEdit}
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Button
                  color={'success'}
                  data-testid={'add_currency'}
                  disabled={disabled}
                  onClick={this.add_row}
                >
                  {t('lbl.add', 'Add')}
                </Button>
              </Col>
              <Col />
              <Col>
                <Button
                  color={'danger'}
                  data-testid={'remove_currency'}
                  disabled={disabled}
                  onClick={this.remove_row}
                >
                  {t('lbl.remove', 'Remove')}
                </Button>
              </Col>
            </Row>
          </Col>
        </FormGroup>
      </div>
    );
  }
}

CurrenciesList.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string,
    code: PropTypes.string,
    value: PropTypes.string,
    islocked: PropTypes.bool,
  }),
  accessDenied: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  idx: PropTypes.number,
  t: PropTypes.func.isRequired,
};

export default CurrenciesList;
