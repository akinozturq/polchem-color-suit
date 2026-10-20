import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardBody, CardHeader, Col, Row } from 'reactstrap';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import configActions from 'js/redux/reducers/Configuration';
import { CustomScrollbars, rightToLeft } from 'js/mylib/Utils';
import cellEditFactory, { Type } from 'react-bootstrap-table2-editor';
import BootstrapTable from 'react-bootstrap-table-next';
import { DEFAULT_PRINTER, PRINT_TASK_DEFAULT } from 'js/Constants';
import Spinner from '../../shared/Spinner';

/**
 * Handles connecting printers to tasks
 */

const getInitialState = (config, node, t) => {
  const printers = config.print_tasks_printer.value;
  const printer_map = new Map(node.value.map((i) => [i.task, i.printer]));
  const enabled_map = new Map(
    printers.map((i) => [i.task, i.enabled ? 'T' : 'F'])
  );
  let print_tasks = config.print_tasks.value.map((x) => {
    return {
      enabled: enabled_map.get(x.name) ?? 'T',
      key: x.name,
      task: x.name,
      printer: printer_map.get(x.name) || null,
    };
  });
  print_tasks.unshift({
    enabled:
      printers?.length > 0 &&
      printers[0].task === PRINT_TASK_DEFAULT &&
      printers[0].enabled
        ? 'T'
        : 'F',
    key: PRINT_TASK_DEFAULT,
    task: '<' + t('lbl.defaultForAllTasks', 'Default for all tasks') + '>',
    printer: printer_map.get(PRINT_TASK_DEFAULT) || null,
  });
  return {
    print_tasks,
    node,
    edited: false,
  };
};

class PrinterTasks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      print_tasks: [],
      node: null,
      selected: null,
      edited: false,
    };

    this.printers = [
      {
        label: '<' + props.t('lbl.systemDefault', 'System default') + '>',
        value: DEFAULT_PRINTER,
      },
    ];

    this.printer_map = new Map(this.printers.map((i) => [i.value, i.label]));

    if (window.qtside) {
      // Get printers available on the system
      window.qtside.printer.availablePrinters.connect(this.updatePrintersList);
      window.qtside.printer.listAvailablePrinters();
    }
  }

  updatePrintersList = (str) => {
    const { t } = this.props;
    let printers = JSON.parse(str);

    this.printers = printers.available.map((x) => ({ label: x, value: x }));
    this.printers.unshift({
      label: '<' + t('lbl.systemDefault', 'System default') + '>',
      value: null,
    });
    this.printer_map = new Map(this.printers.map((i) => [i.value, i.label]));
  };

  static getDerivedStateFromProps(props, state) {
    if (props.node !== state.node) {
      return getInitialState(props.config, props.node, props.t);
    }
    return null;
  }

  reset = () => {
    const { t, config } = this.props;
    const data = getInitialState(config, this.state.node, t);
    this.setState({
      print_tasks: data.print_tasks,
      edited: false,
    });
  };

  save = () => {
    // No default row
    const print_tasks = this.state.print_tasks
      // .filter((x) => x.printer !== null)
      .map((x) => ({
        task: x.key,
        printer: x.printer,
        enabled: x.enabled === 'T',
      }));

    this.props.setConfig('print_tasks_printer', print_tasks);
  };

  typeFormatter = (cell) => {
    return this.printer_map.get(cell) || cell;
  };

  enabledFormatter = (cell, row) => {
    if (row.key === PRINT_TASK_DEFAULT) {
      return;
    }
    const { t } = this.props;
    return cell === 'T' ? t('fn.yes', 'Yes') : t('fn.no', 'No');
  };

  printerTable = () => {
    const { t } = this.props;
    const columns = [
      {
        dataField: 'task',
        text: t('lbl.printerTask', 'Printer task'),
        editable: false,
      },
      {
        dataField: 'printer',
        text: t('lbl.printer', 'Printer'),
        formatter: this.typeFormatter,
        editor: {
          type: Type.SELECT,
          options: this.printers,
        },
      },
      {
        dataField: 'enabled',
        text: t('lbl.enabled', 'Enabled'),
        formatter: this.enabledFormatter,
        editor: {
          type: Type.CHECKBOX,
          value: 'T:F',
        },
      },
    ];

    const selectRowProp = {
      mode: 'radio',
      clickToSelect: true,
      clickToEdit: true,
      hideSelectColumn: true,
      onSelect: (tmp) => this.setState({ selected: tmp }),
    };

    const cellEdit = cellEditFactory({
      mode: 'click',
      blurToSave: true,
      afterSaveCell: () => this.setState({ edited: true }),
    });

    return (
      <BootstrapTable
        keyField="key"
        hover
        data={this.state.print_tasks}
        columns={columns}
        selectRow={selectRowProp}
        cellEdit={cellEdit}
        rowStyle={{ color: 'white' }}
      />
    );
  };

  render() {
    const { t, config_saving } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          {t('lbl.printTaskPrinters', 'Print task printers')}
        </CardHeader>
        <CustomScrollbars>
          <CardBody className="config-card-body" dir={direction}>
            <Row>
              <Col>{this.printerTable()}</Col>
            </Row>
            <Row>
              <Col>
                <Button
                  data-testid="reset"
                  disabled={
                    !this.state.edited ||
                    this.props.accessDenied('print_tasks_printer')
                  }
                  onClick={this.reset}
                  data-denied={this.props.accessDenied('print_tasks_printer')}
                >
                  {config_saving && <Spinner />}
                  {t('fn.reset', 'Reset')}
                </Button>
              </Col>
              <Col xs={6} />
              <Col>
                <Button
                  data-testid="save"
                  disabled={
                    !this.state.edited ||
                    this.props.accessDenied('print_tasks_printer')
                  }
                  data-denied={this.props.accessDenied('print_tasks_printer')}
                  onClick={this.save}
                >
                  {config_saving && <Spinner />}
                  {t('fn.save', 'Save')}
                </Button>
              </Col>
            </Row>
          </CardBody>
        </CustomScrollbars>
      </Card>
    );
  }
}

PrinterTasks.propTypes = {
  t: PropTypes.func.isRequired,
  config: PropTypes.shape({
    print_tasks: PropTypes.shape(),
    print_tasks_printer: PropTypes.object,
  }),
  node: PropTypes.shape(),
  setConfig: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
  config_saving: PropTypes.bool.isRequired,
};

function mapStateToProps(store) {
  return {
    config: store.configurations.config,
    config_saving: store.configurations.config_saving,
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
  connect(mapStateToProps, mapDispatchToProps)(PrinterTasks)
);
