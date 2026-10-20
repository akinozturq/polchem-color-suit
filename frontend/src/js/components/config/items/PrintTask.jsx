import React from 'react';
import { withTranslation } from 'react-i18next';

import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Label,
  Row,
  Col,
  Input,
  CustomInput,
} from 'reactstrap';
import Select from 'react-select';
import { customControlStyles, rightToLeft } from 'js/mylib/Utils';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import configActions from 'js/redux/reducers/Configuration';
import _ from 'lodash';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory, { Type } from 'react-bootstrap-table2-editor';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';

function GetInputRow(props) {
  return (
    <FormGroup row>
      <Label sm={5}>{props.item.name}</Label>
      <Col sm={7}>
        {props.item.type === 'checkbox' ? (
          <CustomInput
            data-testid={props.item.identity}
            type="checkbox"
            id={props.item.identity}
            checked={props.item.value}
            disabled={props.item.islocked || props.denied}
            data-denied={props.denied}
            onChange={(event) => {
              props.updateItem(
                props.item,
                event.target.checked,
                props.item.identity
              );
            }}
          />
        ) : (
          <Input
            data-testid={props.item.identity}
            type={props.item.type}
            value={props.item.value}
            disabled={props.item.islocked || props.denied}
            onChange={(event) =>
              props.updateItem(
                props.item,
                event.target.value,
                props.item.identity
              )
            }
          />
        )}
      </Col>
    </FormGroup>
  );
}

GetInputRow.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.any,
    type: PropTypes.string.isRequired,
    islocked: PropTypes.bool,
    identity: PropTypes.string.isRequired,
  }),
  denied: PropTypes.bool.isRequired,
  updateItem: PropTypes.func.isRequired,
};

const CONDITION_FORMULA = 'F';
const CONDITION_PRODUCT = 'P';
const CONDITION_BASE = 'B';
const CONDITION_CAN = 'C';
const CONDITION_CANNAME = 'N';
const CONDITION_COLOURCODE = 'CC';
const CONDITION_BARCODE = 'BC';

const CONDITION_FRM_ADDITION = 'F_A';
const CONDITION_FRM_NOTADDITION = 'F_NA';
const CONDITION_FRM_CUSTOMFRM = 'F_C';
const CONDITION_FRM_NOTCUSTOMFRM = 'F_NC';
const CONDITION_FRM_FREE = 'F_F';
const CONDITION_FRM_NOTFREE = 'F_NF';
const CONDITION_FRM_HASUFI = 'F_HU';
const CONDITION_FRM_NOUFI = 'F_NU';

const CONDITION_PRD_IS = 'P_I';
const CONDITION_PRD_ISNOT = 'P_IN';
const CONDITION_PRD_CONTAIN = 'P_C';
const CONDITION_PRD_NOTCONTAIN = 'P_NC';

const CONDITION_BASE_IS = 'B_I';
const CONDITION_BASE_ISNOT = 'B_IN';
const CONDITION_BASE_CONTAIN = 'B_C';
const CONDITION_BASE_NOTCONTAIN = 'B_NC';

const CONDITION_CAN_ISCUSTOM = 'C_C';
const CONDITION_CAN_NOTCUSTOM = 'C_NC';

const CONDITION_CANNAME_IS = 'CN_I';
const CONDITION_CANNAME_ISNOT = 'CN_IN';
const CONDITION_CANNAME_CONTAIN = 'CN_C';
const CONDITION_CANNAME_NOTCONTAIN = 'CN_NC';

const CONDITION_COLOUR_CODE_STARTS_WITH = 'CC_SW';
const CONDITION_COLOUR_CODE_DOESNT_STARTS_WITH = 'CC_DSW';
const CONDITION_COLOUR_CODE_CONTAINS = 'CC_C';
const CONDITION_COLOUR_CODE_DOESNT_CONTAIN = 'CC_DC';

const CONDITION_BARCODE_EXISTS = 'BC_E';
const CONDITION_BARCODE_NOTEXISTS = 'BC_NE';

const CONDITION_MAP = {
  [CONDITION_FRM_ADDITION]: { negate: 'false', addition: 'true' },
  [CONDITION_FRM_NOTADDITION]: { negate: 'true', addition: 'true' },
  [CONDITION_FRM_CUSTOMFRM]: { negate: 'false', customFormula: 'true' },
  [CONDITION_FRM_NOTCUSTOMFRM]: { negate: 'true', customFormula: 'true' },
  [CONDITION_FRM_FREE]: { negate: 'false', freeDispense: 'true' },
  [CONDITION_FRM_NOTFREE]: { negate: 'true', freeDispense: 'true' },
  [CONDITION_FRM_HASUFI]: { hasUfi: 'true', negate: 'false' },
  [CONDITION_FRM_NOUFI]: { hasUfi: 'true', negate: 'true' },
  // product
  [CONDITION_PRD_IS]: { negate: 'false', exact: 'true', productName: null },
  [CONDITION_PRD_ISNOT]: { negate: 'true', exact: 'true', productName: null },
  [CONDITION_PRD_CONTAIN]: {
    negate: 'false',
    contains: 'true',
    productName: null,
  },
  [CONDITION_PRD_NOTCONTAIN]: {
    negate: 'true',
    contains: 'true',
    productName: null,
  },
  //base

  [CONDITION_BASE_IS]: { negate: 'false', exact: 'true', baseCode: null },
  [CONDITION_BASE_ISNOT]: { negate: 'true', exact: 'true', baseCode: null },
  [CONDITION_BASE_CONTAIN]: {
    negate: 'false',
    contains: 'true',
    baseCode: null,
  },
  [CONDITION_BASE_NOTCONTAIN]: {
    negate: 'true',
    contains: 'true',
    baseCode: null,
  },

  //can
  [CONDITION_CAN_ISCUSTOM]: { negate: 'false', customCanSize: 'true' },
  [CONDITION_CAN_NOTCUSTOM]: { negate: 'true', customCanSize: 'true' },

  //can name
  [CONDITION_CANNAME_IS]: { negate: 'false', exact: 'true', canName: null },
  [CONDITION_CANNAME_ISNOT]: { negate: 'true', exact: 'true', canName: null },
  [CONDITION_CANNAME_CONTAIN]: {
    negate: 'false',
    contains: 'true',
    canName: null,
  },
  [CONDITION_CANNAME_NOTCONTAIN]: {
    negate: 'true',
    contains: 'true',
    canName: null,
  },
  // Colour code
  [CONDITION_COLOUR_CODE_STARTS_WITH]: {
    negate: 'false',
    startsWith: 'true',
    colourCode: null,
  },
  [CONDITION_COLOUR_CODE_DOESNT_STARTS_WITH]: {
    negate: 'true',
    startsWith: 'true',
    colourCode: null,
  },
  [CONDITION_COLOUR_CODE_CONTAINS]: {
    negate: 'false',
    contains: 'true',
    colourCode: null,
  },
  [CONDITION_COLOUR_CODE_DOESNT_CONTAIN]: {
    negate: 'true',
    contains: 'true',
    colourCode: null,
  },
  [CONDITION_BARCODE_EXISTS]: {
    negate: 'false',
    barcodeExists: 'true',
  },
  [CONDITION_BARCODE_NOTEXISTS]: {
    negate: 'true',
    barcodeExists: 'true',
  },
};

// Loading conditions to more usable format
const loadConditions = (conditions) => {
  if (!conditions) {
    return [];
  }
  const filterConditions = conditions.filter((c) => c && !_.isEmpty(c));
  return filterConditions.map((c, idx) => {
    let t = { key: idx, value: null, type: null, subtype: null };
    if (c.addition || c.customFormula || c.freeDispense || c.hasUfi) {
      t.type = CONDITION_FORMULA;
      if (c.addition) {
        t.subtype =
          c.negate === 'false'
            ? CONDITION_FRM_ADDITION
            : CONDITION_FRM_NOTADDITION;
      }
      if (c.customFormula) {
        t.subtype =
          c.negate === 'false'
            ? CONDITION_FRM_CUSTOMFRM
            : CONDITION_FRM_NOTCUSTOMFRM;
      }
      if (c.freeDispense) {
        t.subtype =
          c.negate === 'false' ? CONDITION_FRM_FREE : CONDITION_FRM_NOTFREE;
      }
      if (c.hasUfi) {
        t.subtype =
          c.negate === 'false' ? CONDITION_FRM_HASUFI : CONDITION_FRM_NOUFI;
      }
    } else if (c.productName) {
      t.type = CONDITION_PRODUCT;
      if (c.exact) {
        t.subtype =
          c.negate === 'false' ? CONDITION_PRD_IS : CONDITION_PRD_ISNOT;
      }
      if (c.contains) {
        t.subtype =
          c.negate === 'false'
            ? CONDITION_PRD_CONTAIN
            : CONDITION_PRD_NOTCONTAIN;
      }
      t.value = c['productName'];
    } else if (c.baseCode) {
      t.type = CONDITION_BASE;
      if (c.exact) {
        t.subtype =
          c.negate === 'false' ? CONDITION_BASE_IS : CONDITION_BASE_ISNOT;
      }
      if (c.contains) {
        t.subtype =
          c.negate === 'false'
            ? CONDITION_BASE_CONTAIN
            : CONDITION_BASE_NOTCONTAIN;
      }
      t.value = c['baseCode'];
    } else if (c.customCanSize) {
      t.type = CONDITION_CAN;
      t.subtype =
        c.negate === 'false' ? CONDITION_CAN_ISCUSTOM : CONDITION_CAN_NOTCUSTOM;
    } else if (c.canName) {
      t.type = CONDITION_CANNAME;
      if (c.exact) {
        t.subtype =
          c.negate === 'false' ? CONDITION_CANNAME_IS : CONDITION_CANNAME_ISNOT;
      }
      if (c.contains) {
        t.subtype =
          c.negate === 'false'
            ? CONDITION_CANNAME_CONTAIN
            : CONDITION_CANNAME_NOTCONTAIN;
      }
      t.value = c['canName'];
    } else if (c.colourCode) {
      t.type = CONDITION_COLOURCODE;
      t.value = c['colourCode'];
      if (c.startsWith) {
        t.subtype =
          c.negate === 'false'
            ? CONDITION_COLOUR_CODE_STARTS_WITH
            : CONDITION_COLOUR_CODE_DOESNT_STARTS_WITH;
      }
      if (c.contains) {
        t.subtype =
          c.negate === 'false'
            ? CONDITION_COLOUR_CODE_CONTAINS
            : CONDITION_COLOUR_CODE_DOESNT_CONTAIN;
      }
    } else if (c.barcodeExists) {
      t.type = CONDITION_BARCODE;
      t.subtype =
        c.negate === 'false'
          ? CONDITION_BARCODE_EXISTS
          : CONDITION_BARCODE_NOTEXISTS;
    }
    return t;
  });
};

class PrintTask extends React.Component {
  constructor(props) {
    super(props);
    const { t } = props;

    this.state = {
      node: [],
      prevNode: null,
      selected: null,
      edited: false,
    };

    this.possible_types = {};
    this.possible_types[CONDITION_FORMULA] = t('printSection.cond.formula');
    this.possible_types[CONDITION_PRODUCT] = t('printSection.cond.productName');
    this.possible_types[CONDITION_BASE] = t('printSection.cond.baseCode');
    this.possible_types[CONDITION_CAN] = t('printSection.cond.can');
    this.possible_types[CONDITION_CANNAME] = t('printSection.cond.canName');
    this.possible_types[CONDITION_COLOURCODE] = t(
      'printSection.cond.colourCode',
      'Color code'
    );
    this.possible_types[CONDITION_BARCODE] = t(
      'printSection.cond.barcode',
      'Barcode'
    );

    this.possible_values = { null: {} };

    let formula_options = {};
    formula_options[CONDITION_FRM_ADDITION] = t('printSection.cond.isAddition');
    formula_options[CONDITION_FRM_NOTADDITION] = t(
      'printSection.cond.isNotAddition'
    );
    formula_options[CONDITION_FRM_CUSTOMFRM] = t(
      'printSection.cond.isCustomFormula'
    );
    formula_options[CONDITION_FRM_NOTCUSTOMFRM] = t(
      'printSection.cond.isNotCustomFormula'
    );
    formula_options[CONDITION_FRM_FREE] = t('printSection.cond.isFreeDispense');
    formula_options[CONDITION_FRM_NOTFREE] = t(
      'printSection.cond.isNotFreeDispense'
    );
    formula_options[CONDITION_FRM_HASUFI] = t(
      'printSection.cond.hasUfi',
      'Has UFI'
    );
    formula_options[CONDITION_FRM_NOUFI] = t(
      'printSection.cond.hasNoUfi',
      'Has no UFI'
    );
    this.possible_values[CONDITION_FORMULA] = formula_options;

    let prod_options = {};
    prod_options[CONDITION_PRD_IS] = t('printSection.cond.is');
    prod_options[CONDITION_PRD_ISNOT] = t('printSection.cond.isNot');
    prod_options[CONDITION_PRD_CONTAIN] = t('printSection.cond.contains');
    prod_options[CONDITION_PRD_NOTCONTAIN] = t(
      'printSection.cond.doesNotContain'
    );
    this.possible_values[CONDITION_PRODUCT] = prod_options;

    let base_options = {};
    base_options[CONDITION_BASE_IS] = t('printSection.cond.is');
    base_options[CONDITION_BASE_ISNOT] = t('printSection.cond.isNot');
    base_options[CONDITION_BASE_CONTAIN] = t('printSection.cond.contains');
    base_options[CONDITION_BASE_NOTCONTAIN] = t(
      'printSection.cond.doesNotContain'
    );
    this.possible_values[CONDITION_BASE] = base_options;

    let can_options = {};
    can_options[CONDITION_CAN_ISCUSTOM] = t(
      'printSection.cond.isCustomCansize'
    );
    can_options[CONDITION_CAN_NOTCUSTOM] = t(
      'printSection.cond.isNotCustomCansize'
    );
    this.possible_values[CONDITION_CAN] = can_options;

    let canname_options = {};
    canname_options[CONDITION_CANNAME_IS] = t('printSection.cond.is');
    canname_options[CONDITION_CANNAME_ISNOT] = t('printSection.cond.isNot');
    canname_options[CONDITION_CANNAME_CONTAIN] = t(
      'printSection.cond.contains'
    );
    canname_options[CONDITION_CANNAME_NOTCONTAIN] = t(
      'printSection.cond.doesNotContain'
    );
    this.possible_values[CONDITION_CANNAME] = canname_options;

    const colourcode_options = {};
    colourcode_options[CONDITION_COLOUR_CODE_STARTS_WITH] = t(
      'printSection.cond.startsWith',
      'Starts with'
    );
    colourcode_options[CONDITION_COLOUR_CODE_DOESNT_STARTS_WITH] = t(
      'printSection.cond.startsNotWith',
      "Doesn't start with"
    );
    colourcode_options[CONDITION_COLOUR_CODE_CONTAINS] = t(
      'printSection.cond.contains'
    );
    colourcode_options[CONDITION_COLOUR_CODE_DOESNT_CONTAIN] = t(
      'printSection.cond.doesNotContain'
    );
    this.possible_values[CONDITION_COLOURCODE] = colourcode_options;

    const barcode_options = {};
    barcode_options[CONDITION_BARCODE_EXISTS] = t(
      'printSection.cond.exists',
      'Exists'
    );
    barcode_options[CONDITION_BARCODE_NOTEXISTS] = t(
      'printSection.cond.doesNotExist',
      'Does not exist'
    );
    this.possible_values[CONDITION_BARCODE] = barcode_options;
  }

  static getDerivedStateFromProps(props, state) {
    if (props.node !== state.prevNode) {
      return {
        node: {
          ...props.node,
          config: {
            ...props.node.config,
            conditions: loadConditions(props.node.config.conditions),
          },
        },
        prevNode: props.node,
      };
    }
    return null;
  }

  updateItem = (item, value, identity) => {
    this.setState((og) => ({
      ...og,
      node: {
        ...og.node,
        config: { ...og.node.config, [identity]: value },
      },
      edited: true,
    }));
  };

  getBasicSettings = () => {
    const { t } = this.props;
    const { node } = this.state;
    return (
      <>
        <GetInputRow
          item={{
            name: t('printSection.taskName'),
            type: 'text',
            value: node.config.name,
            identity: 'name',
          }}
          updateItem={this.updateItem}
          denied={this.props.accessDenied('print_tasks')}
        />
        <GetInputRow
          item={{
            name: t('printSection.allBeforeTint', 'All before tinting'),
            type: 'checkbox',
            value: node.config.all_before_tint,
            identity: 'all_before_tint',
          }}
          updateItem={this.updateItem}
          denied={this.props.accessDenied('print_tasks')}
        />
        <GetInputRow
          item={{
            name: t('printSection.beforeTint'),
            type: 'checkbox',
            value: node.config.before_tint,
            identity: 'before_tint',
          }}
          updateItem={this.updateItem}
          denied={this.props.accessDenied('print_tasks')}
        />
        <GetInputRow
          item={{
            name: t('printSection.afterTint'),
            type: 'checkbox',
            value: node.config.after_tint,
            identity: 'after_tint',
          }}
          updateItem={this.updateItem}
          denied={this.props.accessDenied('print_tasks')}
        />
        <GetInputRow
          item={{
            name: t('printSection.afterError', 'After error during tinting'),
            type: 'checkbox',
            value: node.config.after_error,
            identity: 'after_error',
          }}
          updateItem={this.updateItem}
          denied={this.props.accessDenied('print_tasks')}
        />
        <GetInputRow
          item={{
            name: t('printSection.numOfLabels'),
            type: 'number',
            value: node.config.num_labels,
            identity: 'num_labels',
          }}
          updateItem={this.updateItem}
          denied={this.props.accessDenied('print_tasks')}
        />
        {/* <GetInputRow
          item={{
            name: t('printSection.onRequest'),
            type: 'checkbox',
            value: node.config.on_request,
            identity: 'on_request',
          }}
          updateItem={this.updateItem}
        /> */}
        <GetInputRow
          item={{
            name: t('printSection.showPreviewWindowBeforePrint'),
            type: 'checkbox',
            value: node.config.show_preview,
            identity: 'show_preview',
          }}
          updateItem={this.updateItem}
          denied={this.props.accessDenied('print_tasks')}
        />
      </>
    );
  };

  addCondition = () => {
    this.setState((prevState) => {
      const { conditions } = prevState.node.config;
      return {
        node: {
          ...prevState.node,
          config: {
            ...prevState.node.config,
            conditions: [
              ...conditions,
              {
                key: -1 * (conditions.length + 1), // Negatives assumed to be new in backend!
                value: null,
                type: null,
                subtype: null,
              },
            ],
          },
        },
        edited: true,
      };
    });
  };

  delCondition = () => {
    this.setState((prevState) => {
      const { conditions } = prevState.node.config;
      return {
        node: {
          ...prevState.node,
          config: {
            ...prevState.node.config,
            conditions: conditions.filter((x) => x !== prevState.selected),
          },
        },
        edited: true,
      };
    });
  };

  typeFormatter = (cell) => {
    return this.possible_types[cell];
  };
  subTypeFormatter = (cell, row) => {
    return (
      this.possible_values[row.type] &&
      this.possible_values[row.type][row.subtype]
    );
  };

  conditionsTable = () => {
    const { t } = this.props;
    const conditions = this.state.node.config.conditions;
    let types = [];
    for (const [key, value] of Object.entries(this.possible_types)) {
      types.push({ value: key, label: value });
    }
    let subtypes = [];
    if (this.state.selected && this.possible_values[this.state.selected.type]) {
      for (const [key, value] of Object.entries(
        this.possible_values[this.state.selected.type]
      )) {
        subtypes.push({ value: key, label: value });
      }
    }

    const columns = [
      {
        dataField: 'type',
        text: t('lbl.conditionType', 'Condition type'),
        formatter: this.typeFormatter,
        editor: {
          type: Type.SELECT,
          options: types,
        },
      },
      {
        dataField: 'subtype',
        text: t('lbl.subtype', 'Subtype'),
        formatter: this.subTypeFormatter,
        editor: {
          type: Type.SELECT,
          options: subtypes,
        },
      },
      {
        dataField: 'value',
        text: t('lbl.value', 'Value'),
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
      afterSaveCell: (oldValue, newValue, row, column) => {
        // If type changed, set subtype to first possible value,
        // because each type has different subtypes
        if (column.dataField === 'type' && newValue !== oldValue) {
          row.subtype = Object.keys(this.possible_values[row.type] || {})[0];
        }
        this.setState({ edited: true });
      },
    });

    return (
      <BootstrapTable
        keyField="key"
        hover
        data={conditions}
        columns={columns}
        selectRow={selectRowProp}
        cellEdit={cellEdit}
      />
    );
  };

  reset = () => {
    this.setState((prev) => {
      let node = prev.prevNode;
      return {
        edited: false,
        node: {
          ...node,
          config: {
            ...node.config,
            conditions: loadConditions(node.config.conditions),
          },
        },
      };
    });
  };

  save = () => {
    const { print_tasks } = this.props.config;
    let task = _.cloneDeep(this.state.node.config);
    task.conditions = task.conditions
      .map((x) => {
        let tmp = _.clone(CONDITION_MAP[x.subtype]);
        if (tmp) {
          if (
            _.includes(
              [
                CONDITION_PRD_IS,
                CONDITION_PRD_ISNOT,
                CONDITION_PRD_CONTAIN,
                CONDITION_PRD_NOTCONTAIN,
              ],
              x.subtype
            )
          ) {
            tmp.productName = x.value;
          } else if (
            _.includes(
              [
                CONDITION_BASE_CONTAIN,
                CONDITION_BASE_IS,
                CONDITION_BASE_ISNOT,
                CONDITION_BASE_NOTCONTAIN,
              ],
              x.subtype
            )
          ) {
            tmp.baseCode = x.value;
          } else if (
            _.includes(
              [
                CONDITION_CANNAME_CONTAIN,
                CONDITION_CANNAME_IS,
                CONDITION_CANNAME_ISNOT,
                CONDITION_CANNAME_NOTCONTAIN,
              ],
              x.subtype
            )
          ) {
            tmp.canName = x.value;
          } else if (
            [
              CONDITION_COLOUR_CODE_CONTAINS,
              CONDITION_COLOUR_CODE_DOESNT_CONTAIN,
              CONDITION_COLOUR_CODE_DOESNT_STARTS_WITH,
              CONDITION_COLOUR_CODE_STARTS_WITH,
            ].includes(x.subtype)
          ) {
            tmp.colourCode = x.value;
          }

          return tmp;
        }
        return null;
      })
      .filter((con) => con !== null);

    let tasks = print_tasks.value.map((x) =>
      _.isEqual(x, this.state.prevNode.config) ? task : x
    );
    this.props.setConfig('print_tasks', tasks);
    this.setState({ edited: false });
  };

  handleRemoveFromDB = () => {
    const { print_tasks } = this.props.config;
    let tasks = print_tasks.value.filter(
      (x) => !_.isEqual(x, this.state.prevNode.config)
    );
    this.props.setConfig('print_tasks', tasks);
  };

  removeTask = () => {
    const { t } = this.props;
    confirmAlert({
      title: t('printSection.removeSelectedPrintingTask.header'),
      message: t('printSection.removeSelectedPrintingTask.body'),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: this.handleRemoveFromDB,
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  revert_to_common = () => {
    const task = _.find(
      this.props.config.print_tasks.common_value,
      (task) => task.name === this.state.node.name
    );

    if (task) {
      this.setState((old) => ({
        ...old,
        node: { ...old.node, config: task },
        edited: true,
      }));
    }
  };

  has_difference = () => {
    const task = _.find(
      this.props.config.print_tasks.common_value,
      (task) => task.name === this.state.node.name
    );

    if (task) {
      return !_.isEqual(task, this.state.node.config);
    }
    return false;
  };

  render() {
    const { t, print_labels } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    const { node } = this.state;
    const labels = print_labels.map((x) => ({
      label: x.zoneid ? x.name + ' \uD83C\uDF10' : x.name,
      value: x.name,
    }));

    const conditions = [
      { label: t('printSection.matchAllConditions'), value: 'AND' },
      { label: t('printSection.matchAtLeastOne'), value: 'OR' },
    ];

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          <Row>
            <Col>
              {t(
                'lbl.printingTaskConfiguration',
                'Printing task configuration'
              )}{' '}
              ({node.config.name})
            </Col>
            <Col xs={1}>
              {this.has_difference() && (
                <Button
                  onClick={this.revert_to_common}
                  className={'restore_btn'}
                />
              )}
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="scroll config-card-body" dir={direction}>
          {this.getBasicSettings()}
          <FormGroup row>
            <Label sm={5}>{t('printSection.labelTemplate')}</Label>
            <Col sm={7}>
              <Select
                id="label_select"
                menuPlacement="auto"
                styles={{
                  control: customControlStyles,
                  option: (base) => ({ ...base, color: 'black' }),
                }}
                isDisabled={this.props.accessDenied('print_tasks')}
                isSearchable={false}
                onChange={(value) =>
                  this.updateItem(node, value.value, 'template')
                }
                options={labels || []}
                value={{
                  label: node.config.template,
                  value: node.config.template,
                }}
              />
            </Col>
          </FormGroup>
          <Card className="m-16 bordered">
            <CardHeader>{t('printSection.printingTaskConditions')}</CardHeader>
            <CardBody>
              <Row>
                <Col>
                  <Select
                    menuPlacement="auto"
                    styles={{
                      control: customControlStyles,
                      option: (base) => ({ ...base, color: 'black' }),
                    }}
                    isSearchable={false}
                    onChange={(value) =>
                      this.updateItem(node, value.value, 'logical_conjunction')
                    }
                    isDisabled={this.props.accessDenied('print_tasks')}
                    options={conditions}
                    value={
                      conditions.find(
                        (x) => x.value === node.config.logical_conjunction
                      ) || conditions[0]
                    }
                  />
                </Col>
              </Row>
              <Row>
                <Col>{this.conditionsTable()}</Col>
              </Row>
              <Row>
                <Col>
                  <Button
                    data-testid="delete_condition"
                    onClick={this.delCondition}
                    color="danger"
                    disabled={
                      this.state.selected === null ||
                      this.props.accessDenied('print_tasks')
                    }
                    data-denied={this.props.accessDenied('print_tasks')}
                  >
                    {t('fn.del_delete', 'Del')}
                  </Button>
                </Col>
                <Col xs={6} />
                <Col>
                  <Button
                    data-testid="add_condition"
                    onClick={this.addCondition}
                    color="success"
                    disabled={this.props.accessDenied('print_tasks')}
                    data-denied={this.props.accessDenied('print_tasks')}
                  >
                    {t('fn.add', 'Add')}
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
          <Row className="m-16">
            <Col>
              <Button
                onClick={this.removeTask}
                color="danger"
                disabled={this.props.accessDenied('print_tasks')}
                data-denied={this.props.accessDenied('print_tasks')}
              >
                {t('fn.delete', 'Delete')}
              </Button>
            </Col>
            <Col xs={3} />
            <Col>
              <Button
                data-testid="reset_task"
                onClick={this.reset}
                color="warning"
                disabled={
                  !this.state.edited || this.props.accessDenied('print_tasks')
                }
                data-denied={this.props.accessDenied('print_tasks')}
              >
                {t('fn.reset', 'Reset')}
              </Button>
            </Col>
            <Col xs={3} />
            <Col>
              <Button
                data-testid="save_task"
                onClick={this.save}
                color="primary"
                disabled={
                  !this.state.edited || this.props.accessDenied('print_tasks')
                }
                data-denied={this.props.accessDenied('print_tasks')}
              >
                {t('fn.save', 'Save')}
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  }
}

PrintTask.propTypes = {
  t: PropTypes.func.isRequired,
  node: PropTypes.object,
  setConfig: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
  config: PropTypes.shape({
    print_tasks: PropTypes.shape({
      value: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
      common_value: PropTypes.arrayOf(
        PropTypes.shape({ name: PropTypes.string })
      ),
    }),
  }),
  print_labels: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
};
function mapStateToProps(state) {
  return {
    config: state.configurations.config,
    print_labels: state.configurations.print_labels,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setConfig: configActions.setConfig,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(PrintTask)
);
