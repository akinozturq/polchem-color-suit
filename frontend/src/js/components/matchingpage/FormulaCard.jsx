import React, { lazy, Suspense } from 'react';
import { Button, Card, CardBody, CardHeader, Table } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import classnames from 'classnames';

import PropTypes from 'prop-types';
import { RGBColorToHex, sortFormula } from '../../mylib/Utils';
import { expandComments } from '../../redux/selectors/FormulaComments';
import { useTranslation } from 'react-i18next';
import { scale_to_can } from '../../mylib/Formula';
import { makeFormatters } from '../../redux/selectors/EIValues'; // import necessary utility functions
import ErrorBoundary from '../shared/ErrorBoundaryModal';
import log from '../../api/Logger';
import { get_cnt_for_product } from '../../mylib/Product';
import ColorThumbnail from '../shared/ColorThumbnail';

const Graph = lazy(() => import('./Graph'));

const formatFormula = (cache, cntinformula, product, base, can) => {
  if (cntinformula && base && can) {
    const augmented = cntinformula.map((cnt) => ({
      ...cnt,
      ...get_cnt_for_product(cnt.cntid, cache.cntmap, product),
    }));
    return scale_to_can(augmented, base, can);
  }
  return null;
};

const page0 = (
  t,
  std,
  data,
  configurations,
  id_prefix,
  formatters,
  cache,
  item,
  show_cost
) => {
  const { shotFormatter } = configurations;

  const measuredColorHex = RGBColorToHex(std?.rgb || null);
  const matchingColorHex = RGBColorToHex(data?.rgb || null);
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div className="card__colors">
          <div
            style={{
              backgroundColor: measuredColorHex,
              width: '50%',
            }}
          />
          <div
            style={{
              backgroundColor: matchingColorHex,
              width: '50%',
            }}
          />
        </div>
        <b className="card__infos">{data?.base?.basecode}</b>
        <div className={'scroll'} style={{ maxHeight: '8rem' }}>
          {data?.formula?.cntinformula &&
            data?.base &&
            data?.can &&
            sortFormula(
              configurations,
              formatFormula(
                cache,
                data.formula.cntinformula,
                data.product,
                data.base,
                data.can
              )
            ).map((cnt, index) => (
              <div
                key={index}
                className="card__infos matching-colorant-row"
                data-testid={id_prefix + '_frm' + (item + 1) + '_txt' + index}
              >
                <ColorThumbnail hideIfNull rgb={cnt.rgb} size="1rem" />
                <span>
                  {cnt.cntcode} - {shotFormatter.format(cnt)}
                </span>
              </div>
            ))}
        </div>
      </div>
      <div className={'mb-1'}>
        <Table size={'sm'} borderless className="m-0">
          <tbody>
            {show_cost && (
              <tr>
                <td className={'p-0'}>{t('extraInfo.cost')}</td>
                <td className={'p-0'} data-cy={`${id_prefix}_cost_${item + 1}`}>
                  {formatters.EI_TYPE_CURRENCY.default.format(data?.cost)}
                </td>
              </tr>
            )}
            <tr>
              <td className={'p-0'}>{'dE'}</td>
              <td
                className={'p-0'}
                data-testid={id_prefix + '_de_' + (item + 1)}
              >
                {formatters.EI_TYPE_NUMBER.format(data?.delta?.de)}
              </td>
            </tr>
            <tr>
              <td className={'p-0'}>{'ME'}</td>
              <td className={'p-0'}>
                {formatters.EI_TYPE_NUMBER.format(data?.delta?.me)}
              </td>
            </tr>
            <tr>
              <td className={'p-0'}>{'CR'}</td>
              <td className={'p-0'}>
                {formatters.EI_TYPE_NUMBER.format(data?.delta?.cr)}
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
};

const page1 = (t, data, configurations, id_prefix, formatters, cache, item) => {
  return (
    <>
      <p className="card__infos">
        {expandComments(data?.matchGrade, cache.commentTexts)}
      </p>
      <Table size={'sm'} borderless>
        <thead>
          <tr>
            <td></td>
            <td>{'D65'}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{'dL*'}</td>
            <td data-testid={id_prefix + '_dl_txt_' + item}>
              {formatters.EI_TYPE_NUMBER.format(data?.delta?.lab[0])}
            </td>
          </tr>
          <tr>
            <td>{'da*'}</td>
            <td>{formatters.EI_TYPE_NUMBER.format(data?.delta?.lab[1])}</td>
          </tr>
          <tr>
            <td>{'db*'}</td>
            <td>{formatters.EI_TYPE_NUMBER.format(data?.delta?.lab[2])}</td>
          </tr>
          <tr>
            <td>{'dC*'}</td>
            <td>{formatters.EI_TYPE_NUMBER.format(data?.delta?.lch[1])}</td>
          </tr>
          <tr>
            <td>{'dH*'}</td>
            <td>{formatters.EI_TYPE_NUMBER.format(data?.delta?.lch[2])}</td>
          </tr>
          <tr>
            <td>{'Me'}</td>
            <td>{formatters.EI_TYPE_NUMBER.format(data?.delta?.me)}</td>
          </tr>
          <tr>
            <td>{'dE'}</td>
            <td data-testid={id_prefix + '_de_txt_' + item}>
              {formatters.EI_TYPE_NUMBER.format(data?.delta?.de)}
            </td>
          </tr>
          <tr>
            <td>{'CR'}</td>
            <td>{formatters.EI_TYPE_NUMBER.format(data?.delta?.cr)}</td>
          </tr>
        </tbody>
      </Table>
    </>
  );
};

const page2 = (t, std, data, label) => {
  // Create line chart from data. Data contains 31 values and minimum value is zero and maximum is 100

  const lines = [];
  try {
    for (let i = 0; i < 31; i++) {
      lines.push({
        name: 400 + i * 10,
        value: data?.refl?.[i],
        std: std?.refl?.[i],
      });
    }
  } catch (error) {
    log.error(error);
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Graph
          lines={lines}
          label={label}
          stdLabel={t('lbl.standard_graph', 'Standard')}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

const FormulaCard = ({
  colourcode,
  colournames,
  item,
  configurations,
  currentSection,
  previousSectionHandler,
  nextSectionHandler,
  selectColorHandler,
  std,
  cache,
  active,
  chooseColorHandler,
  id_prefix,
  data,
  show_cost,
}) => {
  const { t } = useTranslation();
  const label = colourcode
    ? colourcode
    : t('lbl.color_graph', 'Color {{index}}', { index: item + 1 });
  const formatters = makeFormatters(configurations);

  let section;

  const cardActiveStyle = classnames('search-closest-card', {
    'search-closest-card--active': active,
  });

  switch (currentSection) {
    case 2:
      section = page2(t, std, data, label);
      break;
    case 1:
      section = page1(
        t,
        data,
        configurations,
        id_prefix,
        formatters,
        cache,
        item
      );
      break;

    case 0:
      section = page0(
        t,
        std,
        data,
        configurations,
        id_prefix,
        formatters,
        cache,
        item,
        show_cost
      );
      break;
    default:
      break;
  }

  return (
    <Card
      id={id_prefix + '_card' + (item + 1)}
      onClick={selectColorHandler}
      onDoubleClick={chooseColorHandler}
      tag={Button}
      className={cardActiveStyle}
    >
      <CardHeader className="card__header">
        <span>{label}</span>
        <span style={{ display: 'block' }}>
          {colournames && colournames.length > 0 ? colournames[0] : ''}
        </span>
      </CardHeader>
      <CardBody style={{ width: '100%', position: 'relative' }}>
        <div className="card__details">
          {currentSection > 0 && (
            <div
              onClick={previousSectionHandler}
              className="card__btn card__btn__left"
              data-testid={id_prefix + '_prev_page' + (item + 1)}
            >
              <FontAwesomeIcon icon={faCaretLeft} />
            </div>
          )}
          <div
            className="card__section"
            data-testid={id_prefix + '_page' + (item + 1)}
          >
            {section}
          </div>
          {currentSection < 2 && (
            <div
              onClick={nextSectionHandler}
              className="card__btn card__btn__right"
              data-testid={id_prefix + '_next_page' + (item + 1)}
            >
              <FontAwesomeIcon icon={faCaretRight} />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

FormulaCard.propTypes = {
  item: PropTypes.number, // Just for testing!
  std: PropTypes.shape({
    rgb: PropTypes.number,
    refl: PropTypes.arrayOf(PropTypes.number),
  }),
  cache: PropTypes.shape({
    commentTexts: PropTypes.object,
    cntmap: PropTypes.instanceOf(Map),
  }),
  configurations: PropTypes.object,
  currentSection: PropTypes.number,
  nextSectionHandler: PropTypes.func,
  previousSectionHandler: PropTypes.func,
  data: PropTypes.shape({
    refl: PropTypes.arrayOf(PropTypes.number),
    product: PropTypes.object,
    base: PropTypes.shape({
      coefficient: PropTypes.number,
      specificgravity: PropTypes.number,
      nominalfill: PropTypes.number,
      basecode: PropTypes.string,
    }),
    can: PropTypes.shape({
      basevolume: PropTypes.number,
      fill: PropTypes.number,
    }),
    rgb: PropTypes.number,
    cost: PropTypes.number,
    canSize: PropTypes.string,
    delta: PropTypes.object,
    formula: PropTypes.shape({
      baseid: PropTypes.number,
      cntinformula: PropTypes.arrayOf(
        PropTypes.shape({
          cntcode: PropTypes.string,
          volume: PropTypes.number,
          cntid: PropTypes.number,
        })
      ),
    }),
    baseCode: PropTypes.string,
    matchGrade: PropTypes.string,
  }),
  colourcode: PropTypes.string,
  colournames: PropTypes.array,
  selectColorHandler: PropTypes.func,
  chooseColorHandler: PropTypes.func,
  active: PropTypes.bool,
  id_prefix: PropTypes.string,
  show_cost: PropTypes.bool.isRequired,
};
export default FormulaCard;
