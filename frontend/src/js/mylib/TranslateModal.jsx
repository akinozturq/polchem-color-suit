import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
  Col,
  Row,
} from 'reactstrap';
import errorActions from 'js/redux/reducers/Errors';
import translationActions, {
  selectors as translationSelectors,
} from 'js/redux/reducers/Translations';
import { withTranslation } from 'react-i18next';
import { CustomScrollbars } from 'js/mylib/Utils';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
import { sortCarret } from './Utils';
import Axios from 'axios';

const propTypes = {
  className: PropTypes.string,
  i18n: PropTypes.object,
  forceUpdate: PropTypes.func.isRequired,
  siteid: PropTypes.number,
  saveTranslations: PropTypes.func.isRequired,
  loadProposals: PropTypes.func.isRequired,
  proposals: PropTypes.array,
  machines: PropTypes.object,
  showCriticalError: PropTypes.func.isRequired,
};

/**
 * Pagination options
 */

const sizePerPageRenderer = ({
  options,
  currSizePerPage,
  onSizePerPageChange,
}) => (
  <div className="btn-group" role="group">
    {options.map((option) => {
      const isSelect = currSizePerPage === `${option.page}`;
      return (
        <button
          key={option.text}
          type="button"
          onClick={() => onSizePerPageChange(option.page)}
          className={`btn ${isSelect ? 'btn-secondary' : 'btn-secondary'}`}
          style={{ height: '3rem' }}
        >
          {option.text}
        </button>
      );
    })}
  </div>
);
sizePerPageRenderer.propTypes = {
  options: PropTypes.object,
  currSizePerPage: PropTypes.number,
  onSizePerPageChange: PropTypes.func,
};

const pagination_options = {
  sizePerPageRenderer,
  sizePerPageList: [
    {
      text: '10',
      value: 10,
    },
    {
      text: '20',
      value: 20,
    },
  ],

  showTotal: true,
};

const defaultProps = {
  proposals: [],
};

const SINGLE = 'S';
const MULTI = 'M';

class TranslateModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      key: '',
      toTranslate: '',
      previous: '',
      translated: '',
      modalType: SINGLE,
      search: '',
      data: undefined,
      english: undefined,
    };
  }

  toggle = () => {
    this.setState((prevState) => ({
      show: !prevState.show,
    }));
  };

  getMachineText = (key) => {
    const { machines } = this.props;
    if (!machines) {
      return null;
    }
    for (let machine of Object.values(machines)) {
      const state = machine?.machine_state;
      if (!state) {
        continue;
      }
      const machineKey = state.error
        ? `machine.error.${state.msgID}`
        : `machine.msg.${state.msgID}`;
      if (machineKey === key) {
        return state.msgText;
      }
    }
    return null;
  };

  findKey = (txt) => {
    if (!txt) {
      return null;
    }
    const { i18n, machines } = this.props;
    const data = i18n.getDataByLanguage(i18n.language).translations;
    const english = i18n.getDataByLanguage('en').translations;
    const matches = [];
    const addMatch = (key) => {
      if (!matches.includes(key)) {
        matches.push(key);
      }
    };

    for (let prop in data) {
      if (data[prop] === txt) {
        addMatch(prop);
      }
    }
    for (let prop in english) {
      if (english[prop] === txt) {
        addMatch(prop);
      }
    }
    for (let { machine_state } of Object.values(machines || {})) {
      if (machine_state?.msgText === txt) {
        let msgid = machine_state.msgID;
        const machineKey = machine_state.error
          ? `machine.error.${msgid}`
          : `machine.msg.${msgid}`;
        addMatch(machineKey);
      }
    }

    if (matches.length === 0) {
      return null;
    }

    const firstKey = matches[0];
    const original = english[firstKey] ?? this.getMachineText(firstKey) ?? txt;
    return { keys: matches, original };
  };

  openSingleModal = (key, previousText = '', originalOverride) => {
    const { i18n } = this.props;
    const data = i18n.getDataByLanguage(i18n.language).translations;
    const english = i18n.getDataByLanguage('en').translations;
    const previous = previousText || data[key] || '';
    const original =
      originalOverride ?? english[key] ?? this.getMachineText(key) ?? previous;
    const translated = data[key] ?? previous;
    this.setState({
      show: true,
      toTranslate: original,
      previous,
      key,
      translated,
      modalType: SINGLE,
      search: '',
    });
  };

  getAllTranslationKeys = (english, data) => {
    const keys = new Set([...Object.keys(english), ...Object.keys(data)]);
    return Array.from(keys);
  };

  getMatchingKeys = (search, english, data) => {
    if (!search) {
      return [];
    }
    const normalized = String(search).toLowerCase();
    const keys = new Set();
    const matchValue = (value, key) => {
      if (
        typeof value === 'string' &&
        value.toLowerCase().includes(normalized)
      ) {
        keys.add(key);
      }
    };

    Object.entries(data).forEach(([key, value]) => matchValue(value, key));
    Object.entries(english).forEach(([key, value]) => matchValue(value, key));

    Object.values(this.props.machines || {}).forEach(({ machine_state }) => {
      if (!machine_state) {
        return;
      }
      const text = machine_state.msgText;
      if (typeof text === 'string' && text.toLowerCase().includes(normalized)) {
        const machineKey = machine_state.error
          ? `machine.error.${machine_state.msgID}`
          : `machine.msg.${machine_state.msgID}`;
        keys.add(machineKey);
      }
    });

    return Array.from(keys);
  };

  showModal = ({ text, key } = {}) => {
    const normalizedText = typeof text === 'string' ? text.trim() : text || '';
    const hasSearch = Boolean(normalizedText);
    if (!key && !hasSearch) {
      return;
    }
    if (key) {
      this.openSingleModal(key, normalizedText);
      return;
    }
    const found = this.findKey(normalizedText);
    if (found) {
      if (found.keys.length === 1) {
        this.openSingleModal(found.keys[0], normalizedText, found.original);
      } else {
        this.setState({ search: normalizedText });
        this.showMultiModal({ search: normalizedText, keys: found.keys });
      }
    } else {
      this.setState({ search: normalizedText });
      this.showMultiModal({ search: normalizedText });
    }
  };

  showMultiModal = ({ search = '', keys } = {}) => {
    let normalizedSearch = '';
    if (typeof search === 'string') {
      normalizedSearch = search.trim();
    } else if (search?.target?.value) {
      normalizedSearch = search.target.value.trim();
    }
    const { i18n } = this.props;
    const data = i18n.getDataByLanguage(i18n.language).translations;
    const english = i18n.getDataByLanguage('en').translations;

    const matchingKeys = this.getMatchingKeys(normalizedSearch, english, data);
    const keysToShow =
      Array.isArray(keys) && keys.length > 0
        ? keys
        : matchingKeys.length > 0
          ? matchingKeys
          : this.getAllTranslationKeys(english, data);

    const multi_data = keysToShow.map((prop) => ({
      key: prop,
      original: english[prop] ?? this.getMachineText(prop) ?? '',
      translated: data[prop],
    }));

    this.setState({
      show: true,
      modalType: MULTI,
      data: data,
      english: english,
      multi_data: multi_data,
      search: normalizedSearch,
    });
  };

  componentWillUnmount() {
    document.removeEventListener('contextmenu', this.simpleModal);
    document.removeEventListener('keyup', this.multiModalKeyEvent);
  }

  getDataTrKey = (element) => {
    let target = element;
    while (target) {
      if (target.getAttribute) {
        const attr = target.getAttribute('data-tr');
        if (attr) {
          return attr.trim();
        }
      }
      target = target.parentElement;
    }
    return null;
  };

  simpleModal = (e) => {
    try {
      e = e || window.event;
      let target = e.target || e.srcElement;
      if (!target) {
        return;
      }
      if (target.nodeType === 3) {
        target = target.parentElement;
      }
      let text;
      if (target?.firstChild?.nodeValue) {
        text = target.firstChild.nodeValue;
      } else {
        text = target?.innerText || target?.textContent || target?.placeholder;
      }
      const translationKey = this.getDataTrKey(target);
      const normalizedText =
        typeof text === 'string' ? text.trim() : text || '';
      if (
        e.shiftKey &&
        !this.state.show &&
        (translationKey || normalizedText)
      ) {
        e.preventDefault();
        this.showModal({ text: normalizedText, key: translationKey });
        this.props.loadProposals(this.props.i18n.language);
      }
    } catch (e) {
      this.props.showCriticalError('Error opening translation modal', e);
    }
  };

  multiModalKeyEvent = (e) => {
    if (e.shiftKey && e.key === 'F9') {
      e.preventDefault();
      this.showMultiModal();
    }
  };

  componentDidMount() {
    document.addEventListener('contextmenu', this.simpleModal, false);

    document.addEventListener('keyup', this.multiModal, false);
  }

  /**
   * Saving translation changes
   */
  save = () => {
    const { i18n, siteid, saveTranslations } = this.props;
    this.setState({ show: false });

    let proposals = {
      [this.state.key]: {
        language: i18n.language,
        proposal: this.state.translated,
      },
    };

    if (this.state.modalType === MULTI) {
      proposals = this.state.multi_data.reduce(
        (obj, item) =>
          Object.assign(obj, {
            [item.key]: {
              language: i18n.language,
              proposal: item.translated,
            },
          }),
        {}
      );
    }

    const original = i18n.getDataByLanguage(i18n.language).translations;
    const payload = {};
    for (let prop in proposals) {
      if (original[prop] !== proposals[prop].proposal) {
        payload[prop] = proposals[prop];
      }
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    saveTranslations({
      siteid,
      data: payload,
    });
  };

  singleModal = () => {
    const previous_proposal = (this.props.proposals || []).find(
      (x) => x.translationkey === this.state.key
    );
    const isRejected = previous_proposal?.status === 'R';
    return (
      <ModalBody>
        <FormGroup row>
          <Label for="key" sm={4}>
            Translation key:
          </Label>
          <Col sm={8}>
            <Input
              type="textarea"
              name="key"
              id="key"
              placeholder="-No key found-"
              readOnly
              value={this.state.key}
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Label for="original" sm={4}>
            Original:
          </Label>
          <Col sm={8}>
            <Input
              type="textarea"
              name="email"
              id="original"
              placeholder="with a placeholder"
              readOnly
              value={this.state.toTranslate}
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Label for="previous" sm={4}>
            Previous:
          </Label>
          <Col sm={8}>
            <Input
              type="textarea"
              name="email"
              id="previous"
              placeholder="with a placeholder"
              readOnly
              value={this.state.previous}
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Label for="translated" sm={4}>
            Translation:
          </Label>
          <Col sm={8}>
            <Input
              type="textarea"
              name="password"
              id="translated"
              placeholder="Give in translation"
              value={this.state.translated}
              onChange={(e) => this.setState({ translated: e.target.value })}
            />
          </Col>
        </FormGroup>
        <FormGroup row style={{ position: 'relative' }}>
          {isRejected && (
            <span
              id={'rejected'}
              role="img"
              aria-label="rejected"
              style={{ position: 'absolute', right: '1rem', zIndex: 1 }}
            >
              🛑 Rejected
            </span>
          )}
          <Label for="previouspr" sm={4}>
            Previous proposal:
          </Label>
          <Col sm={8}>
            <Input
              type="textarea"
              id="previouspr"
              readOnly
              value={previous_proposal?.proposed}
            />
          </Col>
        </FormGroup>
        <Button onClick={this.showMultiModal}> Show all translations</Button>
      </ModalBody>
    );
  };

  updateState = (e) => {
    let value = e.target.value;
    let key = e.target.id;
    let data = this.state.multi_data;
    for (let i = 0; i < data.length; i++) {
      if (data[i]['key'] === key) {
        data[i]['translated'] = value;
        break;
      }
    }
    this.setState({ multi_data: data });
  };

  singleGoogleTranslate = (e) => {
    const { english } = this.state;
    const { i18n } = this.props;
    let key = e.target.getAttribute('data-key');
    e.target.innerHTML = '...';
    let target = e.target;

    Axios.get(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
        i18n.language +
        '&dt=t&q=' +
        english[key]
    )
      .then((r) => {
        let data = this.state.multi_data;
        for (let i = 0; i < data.length; i++) {
          if (data[i]['key'] === key) {
            data[i]['translated'] = r.data[0][0][0];
            break;
          }
        }
        this.setState({ multi_data: data });
        target.innerHTML = 'G';
      })
      .catch((e) => {
        this.props.showCriticalError('Error accessing Google Translate', e);
        target.innerHTML = 'G';
      });
  };

  originalFormatter = (cell, row) => {
    //return JSON.stringify(row);
    let translationKeyInfo = '';
    if (row.key.startsWith('machine.msg.')) {
      const msgID = row.key.substring('machine.msg.'.length);
      translationKeyInfo = `Machine message ID: ${msgID}`;
    } else if (row.key.startsWith('machine.error.')) {
      const msgID = row.key.substring('machine.error.'.length);
      translationKeyInfo = `Machine error ID: ${msgID}`;
    } else if (row.key.startsWith('error.')) {
      translationKeyInfo = 'General error message';
    } else if (row.key.startsWith('lbl.')) {
      translationKeyInfo = 'Label text';
    } else if (row.key.startsWith('fn.')) {
      translationKeyInfo = 'Button text or functionality';
    } else if (row.key.startsWith('msg.')) {
      translationKeyInfo = 'General message text';
    } else if (row.key.startsWith('cfg.')) {
      translationKeyInfo = 'Configuration header or option';
    }

    return (
      <div>
        {row.original}
        <div className="font-italic" style={{ fontSize: 'x-small' }}>
          <div>{row.key}</div>
          <div
            style={{
              fontStyle: 'normal',
              color: 'darkblue',
              fontWeight: 'bold',
            }}
          >
            {translationKeyInfo}
          </div>
        </div>
      </div>
    );
  };

  translateFormatter = (cell, row) => {
    //return JSON.stringify(row);

    return (
      <FormGroup row key={row.key} style={{ margin: '0' }}>
        <Col sm={10} style={{ padding: 0 }}>
          <Input
            type="textarea"
            id={row.key}
            placeholder="Give in translation"
            defaultValue={row.translated}
            onBlur={this.updateState}
          />
        </Col>
        <Col sm={2} style={{ padding: 0 }}>
          <Button
            style={{ padding: 0 }}
            onClick={this.singleGoogleTranslate}
            data-key={row.key}
          >
            G
          </Button>
        </Col>
      </FormGroup>
    );
  };

  proposalFormatter = (cell, row) => {
    const isRejected = row?.proposal?.status === 'R';
    return (
      <>
        {isRejected && (
          <Row>
            <Col style={{ position: 'relative', height: '1.5rem' }}>
              <span
                role="img"
                aria-label="rejected"
                style={{
                  right: '1rem',
                  zIndex: 1,
                  position: 'absolute',
                }}
              >
                🛑 Rejected
              </span>
            </Col>
          </Row>
        )}
        <Row>
          <Col
            style={{
              padding: 0,
            }}
          >
            {row?.proposal?.proposed}
          </Col>
        </Row>
      </>
    );
  };

  multiModal = () => {
    const columns = [
      {
        dataField: 'original',

        text: 'Original',
        sortCaret: sortCarret,
        sort: true,
        filter: textFilter(),
        formatter: this.originalFormatter,
        headerStyle: () => {
          return { width: '35%' };
        },
      },
      {
        dataField: 'translated',
        text: 'Translated',
        sortCaret: sortCarret,
        sort: true,
        filter: textFilter(),
        formatter: this.translateFormatter,
      },
      {
        dataField: 'proposal',
        text: 'Previous proposal',
        sortCaret: sortCarret,
        sort: true,
        filter: textFilter(),
        formatter: this.proposalFormatter,
      },
    ];

    const proposalMap = (this.props.proposals || []).reduce((map, proposal) => {
      map[proposal.translationkey] = proposal;
      return map;
    }, {});

    const data_to_show = (this.state.multi_data || []).map((item) => ({
      ...item,
      proposal: proposalMap[item.key],
    }));

    return (
      <ModalBody>
        <CustomScrollbars style={{ height: '500px' }}>
          <BootstrapTable
            keyField="key"
            striped
            hover
            data={data_to_show}
            columns={columns}
            pagination={paginationFactory(pagination_options)}
            filter={filterFactory()}
          />
        </CustomScrollbars>
      </ModalBody>
    );
  };

  render() {
    if (!this.state.show) {
      return null;
    }

    return (
      <Modal
        isOpen={this.state.show}
        toggle={this.toggle}
        className={this.props.className}
        size="lg"
      >
        <ModalHeader toggle={this.toggle}>Translate text</ModalHeader>

        {this.state.modalType === SINGLE
          ? this.singleModal()
          : this.multiModal()}
        <ModalFooter>
          <Row style={{ width: '100%' }}>
            <Col>
              <Button
                color="secondary"
                data-cy={'fn.cancel_translation'}
                onClick={this.toggle}
              >
                Cancel
              </Button>
            </Col>
            <Col />
            <Col>
              <Button
                color="primary"
                data-cy={'fn.save_translation'}
                onClick={this.save}
              >
                Save
              </Button>
            </Col>
          </Row>
        </ModalFooter>
      </Modal>
    );
  }
}

TranslateModal.propTypes = propTypes;
TranslateModal.defaultProps = defaultProps;

const mapStateToProps = (state) => ({
  proposals: translationSelectors.proposals(state),
});

const mapDispatchToProps = {
  saveTranslations: translationActions.saveTranslations,
  loadProposals: translationActions.loadProposals,
  showCriticalError: errorActions.showCriticalError,
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(TranslateModal)
);
