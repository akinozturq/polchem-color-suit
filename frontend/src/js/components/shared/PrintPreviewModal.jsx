import React, { Component } from 'react';
import {
  Button,
  Col,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import printActions, {
  propType as previewType,
} from 'js/redux/reducers/PrintPreview';
import Select from 'react-select';
import { customControlStyles, omitNil } from 'js/mylib/Utils';
import ErrorBoundary from './ErrorBoundaryModal';
import { Preview } from 'e-p';
import { DEFAULT_PRINTER, INITIAL_EP_LAYOUT } from 'js/Constants';
import EPValues from 'js/redux/selectors/EPValues';
import { check_conditions } from '../../redux/sagas/PrintTask';
import { selectors as configSelectors } from '../../redux/reducers/Configuration';

//import loader from 'img/loading-hourglass.gif';

const propTypes = {
  t: PropTypes.func.isRequired,
  setVisible: PropTypes.func.isRequired,
  setCopies: PropTypes.func.isRequired,
  setPrinter: PropTypes.func.isRequired,

  className: PropTypes.object,
  configurations: PropTypes.object,
  user: PropTypes.object,
  print_labels: PropTypes.array,
  print_preview: previewType,
  cache: PropTypes.object,
  localPrintTasks: PropTypes.array,
};

const defaultProps = {};

// Add localStorage keys
const LS_KEY_TEMPLATE = 'printPreview.selectedTemplateName';
const LS_KEY_PRINTER = 'printPreview.selectedPrinterName';

class PrintPreviewModal extends Component {
  constructor(props) {
    super(props);

    const initialCopies =
      props.print_preview && props.print_preview.copies
        ? props.print_preview.copies
        : 1;
    this.state = {
      clearOrderModal: false,
      printLabelModal: false,
      selectedLabel: 0,
      copies: 1,
      printer: DEFAULT_PRINTER,
      pre_visible: false,
      copiesInput: String(initialCopies),
    };
    this.previewRef = React.createRef();

    this.printers = [
      {
        label: '<' + props.t('lbl.systemDefault', 'System default') + '>',
        value: DEFAULT_PRINTER,
      },
    ];
    if (window.qtside) {
      // Get printers available on the system
      window.qtside.printer.availablePrinters.connect(this.updatePrintersList);
      window.qtside.printer.listAvailablePrinters();
    }
  }

  static getDerivedStateFromProps(props, state) {
    let printer = props.print_preview.printer;

    const { print_preview, cache, configurations, user } = props;
    let selectedLabel = state.selectedLabel;
    if (state.pre_visible === false && props.print_preview.visible) {
      for (const task of props.localPrintTasks) {
        if (
          check_conditions(
            task,
            print_preview.order,
            EPValues(
              {
                order: omitNil(print_preview.order),
                configurations,
                cache,
                user,
              },
              print_preview.canNumber
            )
          )
        ) {
          // set selected label from first task that matches the rules.
          const indx = props.print_labels.findIndex(
            (label) => label.name === task.template
          );
          printer = task.printer;
          selectedLabel = indx;
          break;
        }
      }
    }

    return { pre_visible: props.print_preview.visible, printer, selectedLabel };
  }

  componentDidMount() {
    this.restoreSelections();
  }

  componentDidUpdate(prevProps) {
    const prevCopies = Number(prevProps.print_preview.copies) || 1;
    const currentCopies = Number(this.props.print_preview.copies) || 1;
    if (prevCopies !== currentCopies) {
      const normalized = this.clampCopies(currentCopies);
      const normalizedString = String(normalized);
      if (this.state.copiesInput !== normalizedString) {
        this.setState({ copiesInput: normalizedString });
      }
    }
    // If labels or printer configurations change, try restoring selections
    const labelsChanged = prevProps.print_labels !== this.props.print_labels;
    const printerListChanged =
      prevProps.configurations !== this.props.configurations;
    if (labelsChanged || printerListChanged) {
      this.restoreSelections();
    }
  }

  // Restore selections from localStorage if they are still valid
  restoreSelections = () => {
    const savedTemplateName = window.localStorage.getItem(LS_KEY_TEMPLATE);
    const savedPrinter = window.localStorage.getItem(LS_KEY_PRINTER);

    // Restore template by name -> index
    if (savedTemplateName && Array.isArray(this.props.print_labels)) {
      const idx = this.props.print_labels.findIndex(
        (l) => l && l.name === savedTemplateName
      );
      this.setState({ selectedLabel: idx >= 0 ? idx : 0 });
    }

    // Restore printer if exists in current printers list
    if (savedPrinter) {
      const match = this.printers.find((p) => String(p.value) === savedPrinter);
      const printerValue = match ? match.value : DEFAULT_PRINTER;
      this.setState({ printer: printerValue });
      this.props.setPrinter(printerValue);
    }
  };

  updatePrintersList = (str) => {
    const { t } = this.props;
    let printers = JSON.parse(str);

    this.printers = printers.available.map((x) => ({ label: x, value: x }));
    this.printers.unshift({
      label: '<' + t('lbl.systemDefault', 'System default') + '>',
      value: null,
    });

    // After list updates, re-validate saved printer
    const savedPrinter = window.localStorage.getItem(LS_KEY_PRINTER);
    if (savedPrinter) {
      const match = this.printers.find((p) => String(p.value) === savedPrinter);
      const printerValue = match ? match.value : DEFAULT_PRINTER;
      this.setState({ printer: printerValue });
      this.props.setPrinter(printerValue);
    }
  };

  toggle = () => {
    this.props.setVisible(false);
  };

  printLabel = () => {
    this.previewRef.current.printRequested(this.props.print_preview.printer);
    this.toggle();
  };

  getPreviewData = () => {
    const { print_preview, cache, configurations, user } = this.props;
    return EPValues(
      {
        order: omitNil(print_preview.order),
        configurations,
        cache,
        user,
      },
      print_preview.canNumber
    );
  };

  // Handle template change and persist selection
  handleTemplateChange = (value) => {
    const idx = value?.value ?? null;
    this.setState({ selectedLabel: idx ?? 0 });
    const labels = this.props.print_labels || [];
    const labelName = idx != null && labels[idx] ? labels[idx].name : null;
    if (labelName) {
      window.localStorage.setItem(LS_KEY_TEMPLATE, labelName);
    } else {
      window.localStorage.removeItem(LS_KEY_TEMPLATE);
    }
  };

  // Handle printer change and persist selection
  handlePrinterChange = (value) => {
    const printerValue = value ? value.value : null;
    this.setState({ printer: printerValue });
    this.props.setPrinter(printerValue);
    if (printerValue !== null && printerValue !== undefined) {
      window.localStorage.setItem(LS_KEY_PRINTER, String(printerValue));
    } else {
      window.localStorage.removeItem(LS_KEY_PRINTER);
    }
  };

  clampCopies = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return 1;
    }
    return Math.min(99, Math.max(1, Math.round(numeric)));
  };

  handleCopiesInputChange = (event) => {
    this.setState({ copiesInput: event.target.value });
  };

  handleCopiesInputBlur = () => {
    const normalized = this.clampCopies(this.state.copiesInput);
    const currentCopies = Number(this.props.print_preview.copies) || 1;
    if (normalized !== currentCopies) {
      this.props.setCopies(normalized);
    }
    this.setState({ copiesInput: String(normalized) });
  };

  parseEditableCopies = () => {
    const inputValue = this.state.copiesInput ?? '';
    const trimmed = inputValue.trim();
    if (trimmed === '') {
      return Number(this.props.print_preview.copies) || 1;
    }
    const numeric = Number(trimmed);
    if (Number.isNaN(numeric)) {
      return Number(this.props.print_preview.copies) || 1;
    }
    return numeric;
  };

  changeCopies = (delta) => {
    const current = this.parseEditableCopies();
    const updated = this.clampCopies(current + delta);
    this.props.setCopies(updated);
    this.setState({ copiesInput: String(updated) });
  };

  render() {
    const { t, print_preview } = this.props;
    const copies = Number(print_preview.copies) || 1;
    const copiesInput = this.state.copiesInput;

    // list available templates here
    // Layout forced by print task
    let label;
    let selectable = [];
    if (print_preview.layout) {
      label = print_preview.layout;
    } else {
      const labels = this.props.print_labels; // why cloneDeep?

      selectable = labels.map((x, i) => ({
        label: x.zoneid ? x.name + ' \uD83C\uDF10' : x.name,
        value: i,
      }));

      label = labels[this.state.selectedLabel]
        ? labels[this.state.selectedLabel].data
        : INITIAL_EP_LAYOUT;
    }

    if (!print_preview.visible) {
      return null;
    }

    return (
      <Modal
        isOpen={true}
        toggle={this.toggle}
        centered
        fade={false}
        className={this.props.className}
      >
        <ModalHeader toggle={this.toggle}>
          {t('lbl.previewLabel', 'Preview label')}
        </ModalHeader>
        <ModalBody>
          <div className="mb-8">
            {selectable.length > 0 ? (
              <Select
                menuPlacement="auto"
                styles={{
                  control: customControlStyles,
                  option: (base) => ({ ...base, color: 'black' }),
                }}
                value={selectable[this.state.selectedLabel] || null}
                isSearchable={false}
                onChange={this.handleTemplateChange}
                options={selectable}
              />
            ) : (
              <div data-testid="selected_label_template">
                {t('lbl.taskname.colon', 'Taskname:')} {label.taskname}{' '}
                {t('lbl.label.colon', 'Label:')} {label.name}
              </div>
            )}
          </div>
          <ErrorBoundary>
            <div
              style={{
                border: '2px solid black',
                width: 'fit-content',
                margin: 'auto',
              }}
            >
              <Preview
                standAlone
                useDummyData={false}
                zIndex={'1050'}
                layout={label}
                pWidth={460}
                pHeight={200}
                orderItem={this.getPreviewData()}
                ref={this.previewRef}
                copies={copies}
              />
            </div>
          </ErrorBoundary>
          <Row className="mt-8">
            <Col xs={8} className="p-0 pr-8">
              {t('lbl.printer', 'Printer')}
            </Col>
            <Col>{t('lbl.copies', 'Copies')}</Col>
          </Row>
          <Row>
            <Col xs={8} className="p-0 pr-8">
              <Select
                menuPlacement="auto"
                styles={{
                  control: customControlStyles,
                  option: (base) => ({ ...base, color: 'black' }),
                }}
                isSearchable={false}
                value={
                  this.printers.find((p) => p.value === this.state.printer) ||
                  null
                }
                onChange={this.handlePrinterChange}
                options={this.printers}
              />
            </Col>
            <Col xs={4} className="p-0">
              <div className="d-flex" style={{ gap: '0.125rem' }}>
                <Button
                  size="sm"
                  color="secondary"
                  onClick={() => this.changeCopies(-1)}
                  disabled={copies <= 1}
                  aria-label={t('lbl.decreaseCopies', 'Decrease copies')}
                  style={{
                    margin: 'auto 0.3125rem',
                    minWidth: '2.5rem',
                    maxWidth: '2.5rem',
                  }}
                >
                  -
                </Button>
                <Input
                  min={1}
                  max={99}
                  type="number"
                  value={copiesInput}
                  onChange={this.handleCopiesInputChange}
                  onBlur={this.handleCopiesInputBlur}
                  className="text-center"
                  style={{ minWidth: '3rem', flexGrow: 1 }}
                />
                <Button
                  size="sm"
                  color="secondary"
                  onClick={() => this.changeCopies(1)}
                  disabled={copies >= 99}
                  aria-label={t('lbl.increaseCopies', 'Increase copies')}
                  style={{
                    margin: 'auto 0.3125rem',
                    minWidth: '2.5rem',
                    maxWidth: '2.5rem',
                  }}
                >
                  +
                </Button>
              </div>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Row style={{ width: '100%' }}>
            <Col className="m-16">
              <Button
                data-testid="btn_cancel_print"
                color="secondary"
                onClick={this.toggle}
              >
                {t('fn.cancel', 'Cancel')}
              </Button>
            </Col>
            <Col className="m-16">
              <Button
                data-testid="btn_print_label"
                color="primary"
                onClick={this.printLabel}
              >
                {t('fn.print', 'Print')}
              </Button>
            </Col>
          </Row>
        </ModalFooter>
      </Modal>
    );
  }
}

PrintPreviewModal.propTypes = propTypes;
PrintPreviewModal.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    print_preview: store.print_preview,
    print_labels: store.configurations.print_labels,
    configurations: store.configurations,
    user: store.user,
    cache: store.cache,
    localPrintTasks: configSelectors.localPrintTasks(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setVisible: printActions.setVisible,
      setPrinter: printActions.setPrinter,
      setCopies: printActions.setCopies,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(PrintPreviewModal)
);
