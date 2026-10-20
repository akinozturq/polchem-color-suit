import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import configActions from '../../../redux/reducers/Configuration';
import { Col, CustomInput, FormGroup, Label, Row, Table } from 'reactstrap';

class CustomCanSize extends Component {
  updateItem = (item, value) => {
    this.props.setConfig(item, value);
  };
  createCheckBox = (item, colSize, parentEnable) => {
    let disabled =
      item.islocked || this.props.accessDenied(item.code) || !parentEnable;
    return (
      <Col sm={colSize} className="custom-input-checkbox">
        <CustomInput
          data-testid={`${item.code}_checkbox`}
          type="checkbox"
          checked={item.value}
          disabled={disabled}
          invalid={disabled}
          id={item.code}
          onChange={(event) => this.updateItem(item.code, event.target.checked)}
        />
      </Col>
    );
  };
  render() {
    const { t, options } = this.props;
    const parentEnable = !!options[0].value;
    const columns = [
      {},
      { text: t('lbl.visible', 'Visible') },
      { text: t('lbl.nominalAmount') },
      { text: t('lbl.baseAmount') },
      { text: t('lbl.colorant') },
      { text: t('lbl.total') },
    ];
    const types = [
      t('lbl.volumetric', 'Volumetric'),
      t('lbl.gravimetric', 'Gravimetric'),
      t('lbl.databaseunits', 'Database units'),
    ];

    const volumetricData = options.slice(1, 6);
    const gravimetricData = options.slice(6, 11);
    const formulaData = options.slice(11, 16);

    const data = types.map((type, index) =>
      index === 0
        ? { index, data: volumetricData }
        : index === 1
          ? { index, data: gravimetricData }
          : { index, data: formulaData }
    );

    return (
      <>
        <FormGroup row>
          <Label xs={4}>{options[0].name}</Label>
          {this.props.unsetColumn(options[0], 1, true)}
          {this.createCheckBox(options[0], 7, true)}
        </FormGroup>
        <div style={{ margin: '1rem' }}>
          <Table size="md">
            <thead style={{ textAlign: 'center' }}>
              <tr>
                {columns.map((name, index) => (
                  <th key={name.text + index}>{name.text}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((type, index) => (
                <tr key={types[type.index] + index}>
                  <td>{types[type.index]}</td>
                  {type.data.map((item) => (
                    <td key={item.code}>
                      <Row>
                        {this.props.unsetColumn(item, 5, parentEnable)}
                        {this.createCheckBox(item, 7, parentEnable)}
                      </Row>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </>
    );
  }
}

CustomCanSize.propTypes = {
  t: PropTypes.func.isRequired,
  options: PropTypes.array,
  setConfig: PropTypes.func,
  accessDenied: PropTypes.func.isRequired,
  unsetColumn: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setConfig: configActions.setConfig,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(null, mapDispatchToProps)(CustomCanSize)
);
