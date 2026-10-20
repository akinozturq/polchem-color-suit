import React, { createRef, PureComponent } from 'react';
import PropTypes, { number } from 'prop-types';
import { Treebeard } from 'react-treebeard';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  InputGroup,
  InputGroupText,
  InputGroupAddon,
  Input,
  Row,
  Col,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';

import decorators from 'react-treebeard/dist/components/Decorators';

import { createTree } from './ConfigOptions';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { treeStyle } from 'js/mylib/TreeStyle';
import * as filters from 'js/mylib/TreeFilter';

import configActions from 'js/redux/reducers/Configuration';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  CustomScrollbars,
  getFirstElementBorderRadius,
  getLastElementBorderRadius,
} from 'js/mylib/Utils';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import _ from 'lodash';
import ErrorBoundary from 'js/components/shared/ErrorBoundaryModal';
import { NodeViewer } from './ConfigTreeItem';
import machineActions from 'js/redux/reducers/Machine';
import { isSiteUser } from '../../api/WebRequest';
import {
  DEFAULT_FONT,
  RIGHT_TO_LEFT_LANGUAGES,
  SEGOE_UI,
  SEGOE_UI_LANGUAGES,
} from '../../Constants';

const getDocumentDirection = () => {
  if (typeof document === 'undefined' || !document.documentElement) {
    return 'ltr';
  }
  return document.documentElement.getAttribute('dir') || 'ltr';
};

const isRTL = () => getDocumentDirection() === 'rtl';

/** Find item by code */
const locatePath = (filtered, path) =>
  path && filters.findNode(filtered, (node) => node.code === path);

class CustomContainer extends decorators.Container {
  render() {
    const { style, decorators, terminal, onClick, node } = this.props;
    const rtl = isRTL();
    const st = {
      margin: '0 5px 0 5px',
      background: 'transparent',
      border: 'none',
      color: 'white',
      borderRadius: '0.25rem',
      width: 'calc(100% - 10px)',
      textAlign: rtl ? 'right' : 'left',
      direction: rtl ? 'rtl' : 'ltr',
      whiteSpace: 'nowrap',
      textOverflow: 'clip',
      overflow: 'hidden',
    };
    return (
      <button
        data-testid={'cfg_tree_item_' + node.code}
        style={{ ...st, ...(node && node.active ? style.activeLink : {}) }}
        onClick={onClick}
        ref={(ref) => (this.clickableRef = ref)}
      >
        <span style={{ float: rtl ? 'right' : 'left' }}>
          {!terminal ? this.renderToggle() : null}
        </span>
        <decorators.Header node={node} style={style.header} />
      </button>
    );
  }
}

function matcher(filterText, node) {
  const substring = filterText.toLowerCase();
  return (
    node.name.toLowerCase().includes(substring) ||
    (Array.isArray(node.config) &&
      node.config.some((itm) => itm.name.toLowerCase().includes(substring)))
  );
}

function print_task_matcher(filterText) {
  const re = new RegExp('task_' + filterText + '\\d*$', 'g');
  return (node) => node.code && node.code.search(re) !== -1;
}

/** Find unique matching node,
 *  return false if multiple nodes match, undefined if none match
 */
function findUnique(node, filterText) {
  let found;
  if (matcher(filterText, node)) {
    found = node;
  }

  if (node.children) {
    for (let child of node.children) {
      const foundDeeper = findUnique(child, filterText);
      if (foundDeeper) {
        if (found)
          return false; // found two
        else found = foundDeeper;
      } else if (foundDeeper === false) {
        return false;
      } // else undefined, continue
    }
  }
  return found;
}

class ConfigTree extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      search: '',
      collapsed: ['h_products_pricing'],
      path: null,
    };
    this.okButtonRef = createRef(); // Create a ref
  }

  componentDidUpdate(prevProps) {
    const selected = locatePath(
      { name: '', children: this.getTree() },
      this.props.configPath
    );
    if (
      (prevProps.originalDriverConfig !== prevProps.machine.driver_config &&
        selected &&
        selected.code !== 'cfg.h_automatic_dispensers') ||
      (prevProps.originalEnableAutomaticDispensers !==
        prevProps.config.enable_automatic_dispensers?.value &&
        selected?.code !== 'h_machine_configuration')
    ) {
      this.props.handleOpenModal();
    }

    if (!prevProps.modalOpen && this.props.modalOpen) {
      setTimeout(() => {
        if (typeof this.okButtonRef?.focus === 'function') {
          this.okButtonRef.focus();
        }
      }, 100);
    }
  }

  getTree = () => {
    const {
      t,
      user,
      config,
      print_labels,
      cache,
      machine,
      replication_details,
      protection,
      is_pro,
      email_templates,
    } = this.props;

    return createTree(
      config,
      print_labels,
      t,
      cache,
      user,
      machine,
      replication_details?.data?.has_replication || false,
      protection?.status?.cloud ? true : false,
      is_pro,
      email_templates,
      !isSiteUser()
    );
  };

  onToggle = (node, toggled) => {
    if (node.children && node.active) {
      node.toggled = toggled;
      if (!toggled) {
        this.setState((old) => ({
          collapsed: _.union(old.collapsed, [node.code]),
        }));
      } else {
        this.setState((old) => ({
          collapsed: old.collapsed.filter((x) => x !== node.code),
        }));
      }
    }

    this.props.setConfigPath(node.code);
    // If clicked on same node the state doesn't change so do a force update to expand/collapse node
    this.forceUpdate();
  };

  selectOneBasedOnCode = (filter) => {
    // selecting one print task based on code
    let fnd = filters.findNode(
      { name: '', children: this.getTree() },
      print_task_matcher(filter)
    );
    if (fnd) {
      this.props.setConfigPath(fnd.code);
    }
  };

  // Saving config key
  setConfigKey = (item, value) => {
    // some special actions should change settings instantly
    if (item.code === 'language') {
      const { i18n } = this.props;
      i18n.changeLanguage(value);
      if (RIGHT_TO_LEFT_LANGUAGES.includes(value)) {
        document.getElementsByTagName('html')[0].setAttribute('dir', 'rtl');
      } else {
        document.getElementsByTagName('html')[0].setAttribute('dir', 'ltr');
      }

      const fontFamily = SEGOE_UI_LANGUAGES.includes(value)
        ? SEGOE_UI
        : DEFAULT_FONT;

      document.body.style.fontFamily = fontFamily;

      this.props.setConfig(item.code, value);
    } else if (item.code.includes('machine.gravimetric.')) {
      const { driver_config } = this.props.machine;
      switch (item.code) {
        case 'machine.gravimetric.target_gravimetric':
          this.props.setDriverConfig({
            ...driver_config,
            idd_target_gravimetric: value === 'true',
          });
          break;
        case 'machine.gravimetric.dispense_abs_lower':
          this.props.setDriverConfig({
            ...driver_config,
            idd_abs_lower_tolerance: Number(value),
          });
          break;
        case 'machine.gravimetric.dispense_abs_upper':
          this.props.setDriverConfig({
            ...driver_config,
            idd_abs_upper_tolerance: Number(value),
          });
          break;
        case 'machine.gravimetric.scale_resolution':
          this.props.setDriverConfig({
            ...driver_config,
            idd_scale_resolution: Number(value),
          });
          break;
        case 'machine.gravimetric.dispense_rel_upper':
          this.props.setDriverConfig({
            ...driver_config,
            idd_rel_upper_tolerance: Number(value),
          });
          break;
        case 'machine.gravimetric.dispense_rel_lower':
          this.props.setDriverConfig({
            ...driver_config,
            idd_rel_lower_tolerance: Number(value),
          });
          break;

        default:
          break;
      }
    } else {
      this.props.setConfig(item.code, value);
    }
  };

  render() {
    const { t, user, modalOpen, handleCloseModal, configPath } = this.props;
    const loading =
      this.props.pricing_loading || this.props.cache.priority_init_pending;
    const { search } = this.state;

    let ProperData = this.getTree();

    let filtered = filters.filterTree(
      { name: '', children: ProperData },
      search,
      matcher
    );

    filtered = filters.expandFilteredNodes(filtered, search, matcher);
    ProperData = filtered.children;
    let fnd = findUnique(filtered, search);
    let selected = locatePath({ name: '', children: ProperData }, configPath);

    if (fnd && !selected) {
      selected = locatePath({ name: '', children: ProperData }, fnd.code);
    }
    if (selected) selected.active = true;

    // Update collapsed status
    this.state.collapsed.forEach((x) => {
      let tmp = locatePath({ name: '', children: ProperData }, x);
      if (tmp) {
        tmp.toggled = false;
      }
    });

    const rtl = isRTL();
    decorators.Container = CustomContainer;
    return (
      <>
        <Modal isOpen={modalOpen} centered>
          <ModalHeader>
            {t('cfg.h_dispenser_options', 'Dispenser options')}
          </ModalHeader>
          <ModalBody>
            {t(
              'cfg.restart_required',
              'You have to restart the software for the changes to affect.'
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={handleCloseModal}
              innerRef={(ref) => {
                if (ref) this.okButtonRef = ref;
              }}
            >
              {t('fn.ok', 'OK')}
            </Button>
          </ModalFooter>
        </Modal>
        <Row>
          <Col className="settings-background" xs="4">
            <InputGroup>
              <InputGroupAddon addonType="prepend">
                <InputGroupText style={getFirstElementBorderRadius()}>
                  <FontAwesomeIcon icon="search" />
                </InputGroupText>
              </InputGroupAddon>
              <Input
                id="config_search_input"
                onKeyUp={(e) => {
                  this.setState({ search: e.target.value });
                }}
                placeholder={t('prompt.searchTheTree', 'Search the tree...')}
                style={getLastElementBorderRadius()}
              />
            </InputGroup>

            <CustomScrollbars
              style={{
                height: 'calc(100vh - 102px - 6rem - 3rem)',
                width: '100%',
                color: 'white',
              }}
            >
              <ErrorBoundary>
                <Treebeard
                  className="tree-beard"
                  data={ProperData}
                  decorators={decorators}
                  style={treeStyle('white', undefined, rtl)}
                  onToggle={this.onToggle}
                />
              </ErrorBoundary>
            </CustomScrollbars>
          </Col>

          <Col xs={8}>
            {!loading && (
              <NodeViewer
                t={t}
                is_pro={this.props.is_pro}
                handleOpenModal={this.handleOpenModal}
                modalOpen={modalOpen}
                setConfig={this.setConfigKey}
                unsetConfig={this.props.unsetConfig}
                node={selected}
                privileges={user.current_user.privileges}
                config={this.props.config}
                selectOneBasedOnCode={this.selectOneBasedOnCode}
              />
            )}
          </Col>
        </Row>
      </>
    );
  }
}

ConfigTree.propTypes = {
  t: PropTypes.func.isRequired,
  configPath: PropTypes.string,
  setConfigPath: PropTypes.func,
  setConfig: PropTypes.func.isRequired,
  unsetConfig: PropTypes.func.isRequired,
  config: PropTypes.shape(),
  cache: PropTypes.shape({
    priority_init_pending: PropTypes.bool,
    units: PropTypes.arrayOf(
      PropTypes.shape({
        unitid: PropTypes.number.isRequired,
        unitname: PropTypes.string.isRequired,
      })
    ),
  }),
  print_labels: PropTypes.array,
  email_templates: PropTypes.array,
  user: PropTypes.shape({
    users: PropTypes.arrayOf(
      PropTypes.shape({
        groups: PropTypes.arrayOf(number),
        username: PropTypes.string,
        localuserid: PropTypes.number,
        posuserid: PropTypes.number,
      })
    ),
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        groupname: PropTypes.string,
        usergroupid: PropTypes.number,
        zoneid: PropTypes.number,
      })
    ),
    current_user: PropTypes.object,
  }),
  i18n: PropTypes.object,
  machine: PropTypes.object,
  replication_details: PropTypes.shape({
    data: PropTypes.any,
  }),
  pricing_loading: PropTypes.bool,
  setDriverConfig: PropTypes.func,
  originalDriverConfig: PropTypes.object,
  modalOpen: PropTypes.bool,
  handleCloseModal: PropTypes.func,
  handleOpenModal: PropTypes.func,
  protection: PropTypes.object,
  originalEnableAutomaticDispensers: PropTypes.bool,
  is_pro: PropTypes.bool,
};

/**
 * Mapping redux store configurations as this.props.configurations
 * @param {} state
 */
function mapStateToProps(state) {
  return {
    config: state.configurations.config,
    print_labels: state.configurations.print_labels,
    email_templates: state.configurations.email_templates,
    machine: state.machine,
    cache: state.cache,
    user: state.user,
    replication_details: state.replication.details,
    pricing_loading: state.pricing.bundle_loading,
    protection: state.protection,
    is_pro: protectionSelectors.is_pro(state),
  };
}

/**
 * Connection actions here
 * @param {} dispatch
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setConfig: configActions.setConfig,
      unsetConfig: configActions.unsetConfig,
      setDriverConfig: machineActions.setDriverConfig,
    },
    dispatch
  );
}

/**
 * Wrapped with translations and connect to store.
 */
export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ConfigTree)
);
