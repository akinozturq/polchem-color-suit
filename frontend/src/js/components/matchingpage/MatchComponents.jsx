import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import orderActions, {
  propType as orderType,
} from '../../redux/reducers/Order';
import { selectors as machineSelectors } from '../../redux/reducers/Machine';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  CustomInput,
  FormGroup,
  Row,
} from 'reactstrap';
import ColorThumbnail from '../shared/ColorThumbnail';
import Select from 'react-select';
import { customControlStyles, CustomScrollbars, rightToLeft } from '../../mylib/Utils';
import configActions from '../../redux/reducers/Configuration';
import { selectors as formulaSelectors } from '../../redux/reducers/Formula';
import _ from 'lodash';
import { adjust_cnt_for_product, is_cnt_in_product } from '../../mylib/Product';

const propTypes = {
  t: PropTypes.func.isRequired,
  order: orderType,
  canSizes: PropTypes.arrayOf(Object).isRequired,
  machine: PropTypes.object,
  fetchMatchsettingNames: PropTypes.func,
  setCan: PropTypes.func,
  canClicked: PropTypes.func.isRequired,
  matchsetting_names: PropTypes.arrayOf(PropTypes.string),
  alternative_matching: PropTypes.bool,
  config: PropTypes.object,
  cache: PropTypes.shape({
    cnts: PropTypes.array,
  }),
  default_matching_template: PropTypes.string,
};

const defaultProps = {};

class MatchComponents extends Component {
  constructor(props) {
    super(props);
    this.state = {
      can: this.props.order.can,
      basepaints: null,
      cnts: null,
      matchSettingName: null,
      checkAllBasepaints: !this.props.alternative_matching,
      checkAllCnts: true,
    };
  }
  componentDidMount() {
    const {
      cache,
      order,
      default_matching_template,
      matchsetting_names,
      alternative_matching,
      config,
      canSizes,
    } = this.props;
    // Load colorants
    let cnts = cache.cnts
      .filter((cnt) => is_cnt_in_product(cnt, order.product))
      .map((cnt) => ({
        ...adjust_cnt_for_product(cnt, order.product),
        selected: true,
      }));

    // load default matching template as default match setting name
    const matchSettingName = default_matching_template;
    if (!matchsetting_names) this.props.fetchMatchsettingNames();

    // Load basepaints
    const basepaints = order?.product?.basepaints.map((basepaint) => ({
      ...basepaint,
      selected:
        alternative_matching && order.base?.baseid === basepaint.baseid
          ? order?.product?.basepaints?.length === 1
          : true,
    }));
    //load default can size
    const defcan = _.get(config, 'default_can_size.value', null);
    const can = canSizes.find((can) => can.cancode === defcan);
    this.setState({
      basepaints,
      matchSettingName,
      cnts,
      can: order.can ? order.can : can,
    });
  }

  getCNT = (cnt, isRtl) => {
    const cellSpacingClass = isRtl ? 'mr-0 ml-3' : 'ml-0 mr-3';
    const codeSpacingClass = isRtl ? 'mr-2 pr-5' : 'ml-2 pl-5';
    return (
      <Col
        key={'key' + cnt.cntid}
        xs={2}
        className={`purge_formula_input_cell p-1 mb-3 ${cellSpacingClass}`}
      >
        <Row>
          <Col style={{ display: 'inline-block' }}>
            <CustomInput
              type="checkbox"
              id={'cnt' + cnt.cntid}
              checked={cnt.selected}
              onChange={() => {
                this.handleCntSelection(cnt);
              }}
            />
          </Col>
          <Col className={'p-0 mb-0'} style={{ display: 'inline-block' }}>
            <ColorThumbnail hideIfNull rgb={cnt.rgb} size="1.5rem" />
          </Col>
          <Col className={codeSpacingClass} style={{ display: 'inline-block' }}>
            {cnt.cntcode}
          </Col>
        </Row>
      </Col>
    );
  };

  handleCntSelection = (cnt) => {
    this.setState({
      cnts: this.state.cnts.map((c) => {
        if (cnt.cntid === c.cntid) c.selected = !cnt.selected;
        return c;
      }),
    });
  };

  getBasePaints = (isRtl) => {
    const { basepaints } = this.state;
    const checkboxClass = isRtl ? 'pr-2 mt-2 mr-0' : 'pl-2 mt-2 ml-0';
    return basepaints?.map((basepaint) => (
      <Col xs={3} key={'basepaint' + basepaint.baseid}>
        <Row>
          <Col xs={2} className={'p-0 m-0 p-0'}>
            <CustomInput
              className={checkboxClass}
              type="checkbox"
              id={'basepaint' + basepaint.baseid}
              checked={basepaint.selected}
              onChange={() => {
                this.setState({
                  basepaints: basepaints.map((base) => {
                    if (base.baseid === basepaint.baseid)
                      return { ...base, selected: !base.selected };
                    else return base;
                  }),
                });
              }}
            />
          </Col>
          <Col>
            <div className={'mt-2'}>{basepaint.basecode} </div>
          </Col>
        </Row>
      </Col>
    ));
  };

  handleMatchClicked = () => {
    this.props.setCan(this.state.can);
    const baseids = this.state.basepaints
      .filter((base) => base.selected)
      .map((base) => base.baseid);
    const cntids = this.state.cnts
      .filter((cnt) => cnt.selected)
      .map((cnt) => cnt.cntid);
    this.props.canClicked(
      this.state.can,
      baseids,
      this.state.matchSettingName,
      cntids
    );
  };

  handleCheckAllBasepaints = () => {
    const basepaints = this.state.basepaints.map((basepaint) => ({
      ...basepaint,
      selected: !this.state.checkAllBasepaints,
    }));
    this.setState({
      basepaints,
      checkAllBasepaints: !this.state.checkAllBasepaints,
    });
  };

  handleCheckAllCnts = () => {
    const cnts = this.state.cnts.map((cnt) => ({
      ...cnt,
      selected: !this.state.checkAllCnts,
    }));
    this.setState({ cnts, checkAllCnts: !this.state.checkAllCnts });
  };

  render() {
    const { t } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const can_options = this.props.canSizes.map((can) => ({
      label: can.cansizecode,
      value: can,
    }));
    const template_options = (this.props.matchsetting_names || []).map(
      (setting) => ({
        label: setting,
        value: setting,
      })
    );
    const formCheckboxClass = isRtl ? 'mr-2' : 'ml-2';
    return (
      <Card
        style={{ backgroundColor: 'transparent' }}
        className="matching-components"
        dir={direction}
      >
        <CardHeader style={{ padding: '0.4rem 1.25rem', ...alignStyle }}>
          <Row>
            <Col> {t('fn.selectComponents', 'Select components')}</Col>
          </Row>
        </CardHeader>
        <CardBody className="amount-card pt-3" style={alignStyle}>
          <Row className={'w-100'}>
            <Col xs={9}>
              <CustomScrollbars style={{ height: '300px' }}>
                <div className={'mb-3'}>
                  <FormGroup row className={'m-0'} style={alignStyle}>
                    {t('lbl.basePaint', 'Base paint')}
                    {':'}
                    <CustomInput
                      type="checkbox"
                      className={formCheckboxClass}
                      id={'basepaints_all'}
                      checked={this.state.checkAllBasepaints}
                      onChange={this.handleCheckAllBasepaints}
                    />
                    <span>{t('lbl.selectAll')}</span>
                  </FormGroup>

                  <div className={'ml-1 mr-1'}>
                    <Row>{this.getBasePaints(isRtl)}</Row>
                  </div>
                </div>
                <div className={'mb-3'}>
                  <FormGroup row className={'m-0'} style={alignStyle}>
                    {t('lbl.colorants')}
                    {':'}

                    <CustomInput
                      type="checkbox"
                      className={formCheckboxClass}
                      id={'cnts_all'}
                      checked={this.state.checkAllCnts}
                      onChange={this.handleCheckAllCnts}
                    />
                    <span>{t('lbl.selectAll')}</span>
                  </FormGroup>
                </div>
                <Row>
                  {this.state.cnts?.map((cnt) => this.getCNT(cnt, isRtl))}
                </Row>
              </CustomScrollbars>
            </Col>

            <Col
              xs={3}
              style={{ display: 'flex', flexDirection: 'column', ...alignStyle }}
            >
              <div className={'mb-2'}>
                {t('lbl.template', 'Template')}
                {':'}
                <Select
                  className={'mt-2'}
                  menuPlacement="auto"
                  isRtl={isRtl}
                  styles={{
                    control: customControlStyles,
                    container: (base) => ({
                      ...base,
                      color: 'black',
                      width: '100%',
                    }),
                    option: (base) => ({
                      ...base,
                      color: 'black',
                    }),
                    valueContainer: (base) => ({
                      ...base,
                    }),
                  }}
                  isSearchable={false}
                  onChange={(name) =>
                    this.setState({ matchSettingName: name.value })
                  }
                  options={template_options}
                  value={{
                    label: this.state.matchSettingName,
                    value: this.state.matchSettingName,
                  }}
                />
              </div>
              <div className={'mb-2'}>
                {t('lbl.canSize')}
                {':'}
                <Select
                  className={'mt-2'}
                  menuPlacement="auto"
                  isRtl={isRtl}
                  styles={{
                    control: customControlStyles,
                    container: (base) => ({
                      ...base,
                      color: 'black',
                      width: '100%',
                    }),
                    option: (base) => ({
                      ...base,
                      color: 'black',
                    }),
                    valueContainer: (base) => ({
                      ...base,
                    }),
                  }}
                  value={{
                    label: this.state.can?.cansizecode,
                    value: this.state.can,
                  }}
                  isSearchable={false}
                  onChange={(can) => this.setState({ can: can.value })}
                  options={can_options}
                />
              </div>

              <Button
                className={'mb-2'}
                style={{ marginTop: 'auto' }}
                data-cy={'fn.match'}
                color={'primary'}
                disabled={
                  !this.state.can ||
                  this.state.basepaints?.filter(
                    (base) => base.selected === true
                  ).length === 0 ||
                  this.state.cnts?.filter((cnt) => cnt.selected).length === 0
                }
                onClick={this.handleMatchClicked}
              >
                {t('fn.match', 'Match')}
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  }
}

MatchComponents.propTypes = propTypes;
MatchComponents.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    order: store.order,
    alternative_matching: formulaSelectors.alternative_matching(store),
    machine: machineSelectors.current_machine(store),
    config: store.configurations.config,
    matchsetting_names: store.configurations.matchsetting_names,
    cache: store.cache,
    default_matching_template:
      store.configurations.config_values.default_matching_template,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setCan: orderActions.setCan,

      fetchMatchsettingNames: configActions.fetchMatchsettingNames,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MatchComponents)
);
