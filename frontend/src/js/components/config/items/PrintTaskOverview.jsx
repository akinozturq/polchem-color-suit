import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Container,
  CustomInput,
  Label,
} from 'reactstrap';
import { customControlStyles, rightToLeft } from 'js/mylib/Utils';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import configActions from 'js/redux/reducers/Configuration';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';
import _ from 'lodash';
import { DEFAULT_PRINTER, EMPTY_PRINT_TASK } from 'js/Constants';
import SimpleModal from '../../shared/SimpleModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Select from 'react-select';

class PrintTaskOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal_open: false,
      select_task: null,
      printers: [
        {
          label: '<' + props.t('lbl.systemDefault', 'System default') + '>',
          value: DEFAULT_PRINTER,
        },
      ],
    };
    if (window.qtside) {
      // Get printers available on the system
      window.qtside.printer.availablePrinters.connect(this.updatePrintersList);
      window.qtside.printer.listAvailablePrinters();
    }
  }

  updatePrintersList = (str) => {
    const { t } = this.props;
    let printers = JSON.parse(str);

    printers = printers.available.map((x) => ({ label: x, value: x }));
    printers.unshift({
      label: '<' + t('lbl.systemDefault', 'System default') + '>',
      value: null,
    });

    this.setState({ printers });
  };

  componentDidUpdate(prevProps) {
    /**
     * Used for loading the just added label template
     */
    const { select_task } = this.state;
    const { print_tasks } = this.props;
    if (
      select_task &&
      print_tasks !== prevProps.print_tasks &&
      print_tasks.find((x) => x.name === select_task)
    ) {
      this.props.selectOneBasedOnCode(select_task);
      this.setState({ select_task: null });
    }
  }

  toggleModal = () => {
    this.setState((old) => ({ modal_open: !old.modal_open }));
  };

  validate = (value) => {
    const { node } = this.props;

    const tasks = node?.children?.filter((x) => value === x.config.name) || [];

    if (tasks.length > 0) {
      return false;
    }
    return true;
  };

  handleRemoveFromDB = (task) => {
    const { print_tasks } = this.props;
    let tasks = print_tasks.filter((x) => !_.isEqual(x, task));
    this.props.setConfig('print_tasks', tasks);
  };

  removeTask = (task) => {
    const { t } = this.props;
    confirmAlert({
      title: t('msg.confirmRemoveTask.title', 'Confirm task deletion'),
      message: t(
        'msg.confirmRemoveTask',
        'Are you sure you want to remove task "{{task.name}}"?',
        {
          task,
        }
      ),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => this.handleRemoveFromDB(task),
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  addTask = (value) => {
    const { print_tasks } = this.props;
    let tasks = [...print_tasks, { ...EMPTY_PRINT_TASK, name: value }];
    this.props.setConfig('print_tasks', tasks);
    this.setState({ select_task: value });
  };

  updateItem = (task, value, field) => {
    const { print_tasks_printer } = this.props;

    const printers = print_tasks_printer.filter((x) => x.task !== task.name);

    const task_printers = printers.concat({
      task: task.name,
      printer: field === 'printer' ? value : task.printer,
      enabled: field === 'enabled' ? value : task.enabled,
    });
    this.props.setConfig('print_tasks_printer', task_printers);
  };

  one_task = (task, idx) => {
    const { t, selectOneBasedOnCode, print_tasks_printer } = this.props;
    const printer = print_tasks_printer.find((y) => y.task === task.name);

    return (
      <>
        <Col>
          <CustomInput
            id={'print_task_' + idx}
            type="checkbox"
            defaultChecked={printer?.enabled}
            disabled={this.props.accessDenied('print_tasks')}
            onChange={(e) =>
              this.updateItem(
                { ...printer, ...task },
                e.target.checked,
                'enabled'
              )
            }
          >
            <Label>
              {t('lbl.print_task_[x]', 'Print task "{{name}}"', task)}
            </Label>
          </CustomInput>
          <Row className="pl-8">
            <Col xs={3} className="ml-8 m-auto">
              {t('lbl.printer.colon', 'Printer:')}
            </Col>
            <Col className="mt-2">
              <Select
                id={'printer_select_' + idx}
                menuPlacement="auto"
                menuPortalTarget={document.body}
                styles={{
                  control: customControlStyles,
                  option: (base) => ({ ...base, color: 'black' }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                isDisabled={this.props.accessDenied('print_tasks')}
                isSearchable={false}
                onChange={(value) =>
                  this.updateItem(
                    { ...printer, ...task },
                    value.value,
                    'printer'
                  )
                }
                options={this.state.printers || []}
                value={{
                  label: printer?.printer,
                  value: printer?.printer,
                }}
                defaultValue={{
                  label: printer?.printer,
                  value: printer?.printer,
                }}
              />
            </Col>
          </Row>
          <Row className="pl-8">
            <Col xs={3} className="ml-8 m-auto">
              {t('lbl.label.colon', 'Label:')}
            </Col>
            <Col className="mt-2">{task.template}</Col>
          </Row>
        </Col>
        <Col xs={2}>
          <Button
            onClick={() => selectOneBasedOnCode(task.name)}
            disabled={this.props.accessDenied('print_tasks')}
            data-denied={this.props.accessDenied('print_tasks')}
          >
            <FontAwesomeIcon icon="pencil-alt" />
          </Button>

          <Button
            onClick={() => this.removeTask(task)}
            disabled={this.props.accessDenied('print_tasks')}
            data-denied={this.props.accessDenied('print_tasks')}
          >
            <FontAwesomeIcon icon="trash-alt" />
          </Button>
        </Col>
      </>
    );
  };

  render() {
    const { t, node } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';

    const tasks = node.children ? (
      node.children.map((x, i) => (
        <Row
          key={i}
          className="pb-2 pt-2"
          style={{ borderBottom: '2px solid white' }}
        >
          {this.one_task(x.config, i)}
        </Row>
      ))
    ) : (
      <Row>
        <Col>{t('lbl.noTasks', 'No tasks')}</Col>
      </Row>
    );

    return (
      <>
        <SimpleModal
        header={t('lbl.print_task.add', 'Add print task')}
          edited={this.addTask}
          prompt={t('lbl.print_task_name', 'Print task name')}
          save={t('lbl.ok', 'Ok')}
          cancel={t('lbl.cancel', 'Cancel')}
          show={this.state.modal_open}
          hideModal={this.toggleModal}
          value={''}
          validator={this.validate}
        />
        <Card
          style={{ height: 'calc((100vh - 102px) - 6rem)' }}
          className="config-card"
          dir={direction}
        >
          <CardHeader className="config-card-header" dir={direction}>
            <Row>
              <Col>{t('lbl.printingTasks', 'Printing tasks')}</Col>
              <Col>
                <Button
                  data-testid="AddPrintTask"
                  onClick={this.toggleModal}
                  disabled={this.props.accessDenied('print_tasks')}
                  data-denied={this.props.accessDenied('print_tasks')}
                >
                  {t('printSection.addPrintingTask', 'Add print task')}
                </Button>
              </Col>
            </Row>
          </CardHeader>

          <CardBody
            className="m-8 scroll height100 config-card-body"
            dir={direction}
          >
            <Container>{tasks}</Container>
          </CardBody>
        </Card>
      </>
    );
  }
}

PrintTaskOverview.propTypes = {
  t: PropTypes.func.isRequired,
  selectOneBasedOnCode: PropTypes.func.isRequired,
  node: PropTypes.shape({ children: PropTypes.array }),
  setConfig: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
  print_tasks: PropTypes.array,
  print_tasks_printer: PropTypes.array,
  saving: PropTypes.bool,
};
function mapStateToProps(store) {
  return {
    print_tasks: store.configurations.config_values.print_tasks,
    print_tasks_printer: store.configurations.config_values.print_tasks_printer,
    saving: store.configurations.config_saving,
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
  connect(mapStateToProps, mapDispatchToProps)(PrintTaskOverview)
);
