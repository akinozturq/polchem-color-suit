import React, { PureComponent } from 'react';
import _ from 'lodash';
import { equalsIgnoreCase } from 'js/mylib/Utils';
import SiteDetails from './items/SiteDetails';
import { EMAIL_TEMPLATE, PRINTING_LABEL, PRINTING_TASK } from '../../Constants';
import PrintTask from './items/PrintTask';
import PrintTaskOverview from './items/PrintTaskOverview';
import License from './items/License';
import PrintLabels from './items/PrintLabel';
import PrinterTasks from './items/PrinterTasks';
import UserOverview from './items/UserOverview';
import User from './items/User';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  CustomInput,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label,
  UncontrolledTooltip,
} from 'reactstrap';
import Spectro from './items/Spectro';
import Select from 'react-select';
import PropTypes from 'prop-types';
import Pricing from './items/Pricing';
import EmailEngine from './items/EmailEngine';
import Replication from './items/Replication';
import About from './items/About';
import Offline from './items/Offline';
import Standalone2Cloud from './items/Standalone2Cloud';
import LockPC from './items/LockPC';
import DatabaseBackups from './items/DatabaseBackups';
import CurrenciesList from './items/CurrenciesList';
import CustomCanSize from './items/CustomCanSize';
import EmailTemplate from './items/EmailTemplate';
import RemoteSupport from './items/RemoteSupport';
import NumberInput from '../../mylib/NumberInput';
import MultiSelect from './items/MultiSelect.jsx';
import { FormulaChanges } from './items/FormulaChanges.jsx';
import AutomaticDispensersPanel from './items/AutomaticDispensersPanel.jsx';
import { rightToLeft } from '../../mylib/Utils.jsx';

const customControlStyles = (base) => ({
  ...base,
  height: 20,
});

export class NodeViewer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
      prevNode: null,
      unmount: false,
    };
  }

  static getDerivedStateFromProps(props, state) {
    // Check if config is loaded already then do nothing.
    if (!_.isEqual(props.node, state.prevNode)) {
      return {
        node: props.node,
        prevNode: _.cloneDeep(props.node),
        unmount: true,
      };
    }

    return null;
  }

  updateItem = (item, value, idx) => {
    this.props.setConfig(item, value);
    // updates this node
    this.setState((old) => ({
      node: {
        ...old.node,
        config: [
          ...old.node.config.slice(0, idx),
          {
            ...old.node.config[idx],
            value,
          },
          ...old.node.config.slice(idx + 1),
        ],
      },
    }));
  };

  accessDenied = (privilege) => {
    const { privileges } = this.props;
    return !_.includes(privileges, privilege);
  };

  unsetColumn = (item, colWidth = null, parentEnable = true) => {
    const { t, unsetConfig } = this.props;

    const tool_tip = { ...item };
    if (item.type === 'select') {
      tool_tip.common_value =
        _.find(tool_tip.options, (x) =>
          equalsIgnoreCase(x.value, item.common_value)
        )?.label || item.common_value;
      tool_tip.site_value =
        _.find(tool_tip.options, (x) =>
          equalsIgnoreCase(x.value, item.site_value)
        )?.label || item.site_value;
    }

    return (
      <Col xs={colWidth || 1} className={colWidth ? 'p-0' : 'pr-0'}>
        {item.site_value !== undefined && (
          <>
            <Button
              disabled={this.accessDenied(item.code) || !parentEnable}
              data-denied={this.accessDenied(item.code) || !parentEnable}
              className={'restore_btn'}
              onClick={() => unsetConfig(item.code)}
              id={String(item.code).replace('.', '_') + '_reset_tooltip'}
            />

            <UncontrolledTooltip
              placement="auto"
              target={String(item.code).replace('.', '_') + '_reset_tooltip'}
            >
              {t(
                'tooltip.configDifferent',
                'Config is different for common ({{common_value}}) and in site ({{site_value}}). Revert back to common by clicking',
                tool_tip
              )}
            </UncontrolledTooltip>
          </>
        )}
      </Col>
    );
  };

  render() {
    const { t, selectOneBasedOnCode } = this.props;
    const { node } = this.state;
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    let customCanIncluded = false;

    // fix for not rendering correctly default values
    /*if (this.state.unmount) {
      this.setState({ unmount: false });
      return null;
    }*/

    /**
     * Special case for site details!
     */
    if (node && node.code === 'h_site_information') {
      return <SiteDetails accessDenied={this.accessDenied} />;
    }
    /**
     * Special case for about!
     */
    if (node && node.code === 'h_about') {
      return <About />;
    }
    /**
     * Special case for formula_changes!
     */
    if (node && node.code === 'h_formula_changes') {
      return <FormulaChanges />;
    }
    /**
     * Special case for about!
     */
    if ((node && node.code === 'h_email') || node?.type === EMAIL_TEMPLATE) {
      return <EmailTemplate node={node} accessDenied={this.accessDenied} />;
    }
    /**
     * Special case for running remote support!
     */
    if (node && node.code === 'run_remote_support') {
      return <RemoteSupport privileges={this.props.privileges} />;
    }

    /**
     * Special case for backup!
     */
    if (node && node.code === 'h_backup_database') {
      return <DatabaseBackups accessDenied={this.accessDenied} />;
    }

    /**
     * Special case for replication details!
     */
    if (node && node.code === 'h_replication') {
      return (
        <Replication
          privileges={this.props.privileges}
          accessDenied={this.accessDenied}
        />
      );
    }

    /**
     * Special case for offline details!
     */
    if (node && node.code === 'h_offline') {
      return <Offline privileges={this.props.privileges} />;
    }

    if (node && node.code === 'h_standalone2cloud') {
      return <Standalone2Cloud />;
    }

    /**
     * Special case for email engine
     */
    if (node && node.code === 'h_email_engine') {
      return (
        <EmailEngine
          node={node}
          updateItem={this.updateItem}
          privileges={this.props.privileges}
          unsetColumn={this.unsetColumn}
        />
      );
    }

    /**
     * Special case for print task details!
     */
    if (node && node.type === PRINTING_TASK) {
      return <PrintTask node={node} accessDenied={this.accessDenied} />;
    }

    /**
     * Special case for print task overview!
     */

    if (node && node.code === 'h_printing') {
      return (
        <PrintTaskOverview
          node={node}
          selectOneBasedOnCode={selectOneBasedOnCode}
          accessDenied={this.accessDenied}
        />
      );
    }

    /**
     * Special case for license
     */

    if (node && node.code === 'h_license') {
      return <License node={node} />;
    }

    /** Special case for UserOverview and User */
    if (node && node.code === 'h_users') {
      return <UserOverview node={node} t={t} />;
    }

    if (node && node.type === 'uac_local_users') {
      return <User node={node} t={t} />;
    }

    /** Special case for Automatic Dispenser page */
    if (node && node.type === 'machine.auto_dispenser') {
      return (
        <AutomaticDispensersPanel
          access_denied={this.accessDenied('automatic_dispensers_config')}
        />
      );
    }

    /** Special case for table type */
    if (
      node &&
      node.code !== 'h_pricing' &&
      node.code.split('_')[node.code.split('_').length - 1] === 'pricing'
    ) {
      return <Pricing t={t} node={node} accessDenied={this.accessDenied} />;
    }

    if (node && node.code.includes('product') && !node.code.includes('stats')) {
      return <Pricing t={t} node={node} accessDenied={this.accessDenied} />;
    }
    /**
     * Special case for print labels!
     */
    if (node && (node.code === 'h_labels' || node.type === PRINTING_LABEL)) {
      return <PrintLabels node={node} accessDenied={this.accessDenied} />;
    }
    /**
     * Special case for printer linking to tasks!
     */
    if (node && node.code === 'h_printers') {
      return (
        <PrinterTasks node={node.config[0]} accessDenied={this.accessDenied} />
      );
    }

    /**
     * Special case for spectro setup. Settings won't be saved to database
     * Use local machine instead as the spectro is normally used in one PC only
     */

    if (node && this.props.is_pro && node.code === 'spectro_setup') {
      return (
        <Spectro
          setConfig={this.props.setConfig}
          accessDenied={this.accessDenied}
        />
      );
    }

    let subTree = [];
    let customCanSizeOptions = [];
    if (node && node.config) {
      customCanSizeOptions = node.config.filter(
        (item) =>
          !item.ishidden && item.code.startsWith('enable_custom_cansize')
      );
    }
    if (node && node.config) {
      subTree = node.config
        .filter((item) => !item.ishidden)
        .map((item, idx) => {
          if (item.name === 'cfg.machine.auto_dispenser') return null;
          if (item.code === 'currencies_list') {
            return (
              <CurrenciesList
                key={idx}
                idx={idx}
                item={item}
                accessDenied={this.accessDenied}
                updateItem={this.updateItem}
                t={t}
              />
            );
          }

          if (item.type === 'select') {
            // Finding correct dafault value from possible options
            let disabled = item.islocked || this.accessDenied(item.code);
            if (
              item.code === 'barcode_first_char' ||
              item.code === 'barcode_last_char'
            ) {
              disabled = this.props.config.barcode_action_enable.value
                ? item.islocked || this.accessDenied(item.code)
                : true;
            }
            let dvalue = item.options?.find((x) =>
              equalsIgnoreCase(x.value, item.value)
            );

            return (
              <div key={idx}>
                <FormGroup row>
                  <Label xs={4}>{item.name}</Label>
                  {this.unsetColumn(item)}
                  <Col sm={7}>
                    <Select
                      id={item.code}
                      menuPlacement="auto"
                      styles={{
                        control: customControlStyles,
                        option: (base) => ({ ...base, color: 'black' }),
                      }}
                      isSearchable={false}
                      onChange={(value) =>
                        this.updateItem(item, value.value, idx)
                      }
                      options={item.options || []}
                      isDisabled={disabled}
                      value={dvalue}
                    />
                  </Col>
                </FormGroup>
              </div>
            );
          } else if (item.type === 'checkbox') {
            let disabled = item.islocked || this.accessDenied(item.code);
            // Check exclusive on fullscreen / window_maximized
            if (item.code === 'fullscreen') {
              disabled =
                node.config.find((x) => x.code === 'window_maximized')?.value &&
                !item.value;
            } else if (item.code === 'window_maximized') {
              disabled =
                node.config.find((x) => x.code === 'fullscreen')?.value &&
                !item.value;
            }

            if (
              item.code === 'barcode_formula_auto_tint' ||
              item.code === 'barcode_can_check_before_dispensing' ||
              item.code ===
                'barcode_can_check_before_dispensing_confirmation' ||
              //item.code === 'barcode_refill_move_to_fill_position' ||
              item.code === 'barcode_queue_order_selection'
            ) {
              disabled = this.props.config.barcode_action_enable.value
                ? item.islocked || this.accessDenied(item.code)
                : true;
            }
            if (item.code === 'lock_pc')
              return (
                <LockPC
                  key={idx}
                  item={item}
                  accessDenied={this.accessDenied}
                  idx={idx}
                  updateItem={this.updateItem}
                />
              );
            if (item.code.includes('enable_custom_cansize')) {
              if (!customCanIncluded) {
                customCanIncluded = true;
                return (
                  <CustomCanSize
                    key={idx}
                    t={t}
                    options={customCanSizeOptions}
                    accessDenied={this.accessDenied}
                    unsetColumn={this.unsetColumn}
                  />
                );
              }
              return null;
            }

            if (item.code === 'enable_primer') {
              return (
                <FormGroup row key={idx}>
                  <Label xs={4}>{item.name}</Label>
                  {this.unsetColumn(item)}
                  <Col sm={7} className="custom-input-checkbox">
                    <CustomInput
                      type="checkbox"
                      checked={item.value > 0}
                      disabled={disabled}
                      id={item.code}
                      onChange={(event) =>
                        this.updateItem(item, event.target.checked ? 1 : 0, idx)
                      }
                    />
                  </Col>
                </FormGroup>
              );
            }

            return (
              <div key={idx}>
                <FormGroup row>
                  <Label xs={4}>{item.name}</Label>
                  {this.unsetColumn(item)}
                  <Col sm={7} className="custom-input-checkbox">
                    <CustomInput
                      type="checkbox"
                      checked={item.value}
                      disabled={disabled}
                      id={item.code}
                      onChange={(event) =>
                        this.updateItem(item, event.target.checked, idx)
                      }
                    />
                  </Col>
                </FormGroup>
              </div>
            );
          } else if (item.type === 'percentage') {
            return (
              <div key={idx}>
                <FormGroup row>
                  <Label xs={4}>{item.name}</Label>
                  {this.unsetColumn(item)}
                  <Col sm={7}>
                    <InputGroup>
                      <NumberInput
                        id={item.code}
                        className="form-control"
                        min={item.min}
                        max={item.max}
                        value={item.value * 100}
                        disabled={item.islocked || this.accessDenied(item.code)}
                        deferChange
                        onChange={(value) =>
                          this.updateItem(item, value / 100, idx)
                        }
                      />
                      <InputGroupAddon addonType="append">
                        <InputGroupText>%</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </Col>
                </FormGroup>
              </div>
            );
          } else if (item.type === 'number') {
            return (
              <div key={idx}>
                <FormGroup row>
                  <Label xs={4}>{item.name}</Label>
                  {this.unsetColumn(item)}
                  <Col sm={7}>
                    <InputGroup>
                      <NumberInput
                        id={item.code}
                        min={item.min}
                        max={item.max}
                        className="form-control"
                        value={item.value}
                        disabled={item.islocked || this.accessDenied(item.code)}
                        onChange={(value) => this.updateItem(item, value, idx)}
                        deferChange
                      />
                      {item.suffix && (
                        <InputGroupAddon addonType="append">
                          <InputGroupText>{item.suffix}</InputGroupText>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                  </Col>
                </FormGroup>
              </div>
            );
          } else if (item.type === 'multi_select') {
            return (
              <MultiSelect
                key={idx}
                item={item}
                idx={idx}
                t={t}
                updateItem={this.updateItem}
                accessDenied={this.accessDenied}
                is_pro={this.props.is_pro}
                unsetConfig={this.props.unsetConfig}
              />
            );
          } else {
            return (
              <div key={idx}>
                <FormGroup row>
                  <Label xs={4}>{item.name}</Label>
                  {this.unsetColumn(item)}
                  <Col sm={7}>
                    <InputGroup>
                      <Input
                        type={item.type}
                        id={item.code}
                        value={item.value}
                        className={item.suffix && 'form-control-tools'}
                        disabled={item.islocked || this.accessDenied(item.code)}
                        onChange={(event) =>
                          this.updateItem(item, event.target.value, idx)
                        }
                      />
                      {item.suffix && (
                        <InputGroupAddon addonType="append">
                          <InputGroupText>{item.suffix}</InputGroupText>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                  </Col>
                </FormGroup>
              </div>
            );
          }
        });
    }
    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader
          data-testid="config-card-header"
          className="config-card-header"
          dir={direction}
        >
          {node
            ? node.name
              ? node.name
              : t('prompt.selectAnItem', 'Select an Item')
            : t('msg.selectItemFromLeft', 'Please select item from left')}
        </CardHeader>

        <CardBody className="scroll config-card-body" dir={direction}>
          {subTree}
        </CardBody>
      </Card>
    );
  }
}
NodeViewer.propTypes = {
  node: PropTypes.object,
  setConfig: PropTypes.func.isRequired,
  unsetConfig: PropTypes.func.isRequired,
  selectOneBasedOnCode: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  handleOpenModal: PropTypes.func,
  modalOpen: PropTypes.bool,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  is_pro: PropTypes.bool,
  config: PropTypes.shape({
    barcode_action_enable: PropTypes.shape({ value: PropTypes.bool }),
  }),
};
