import { Card, CardBody, CardHeader } from 'reactstrap';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import formulaActions from 'js/redux/reducers/Formula';
import Spinner from '../../shared/Spinner.jsx';
import BootstrapTable from 'react-bootstrap-table-next';
import { colorFormatter } from '../../historypage/HistoryFormatters.jsx';
import { sortCarret, rightToLeft } from '../../../mylib/Utils.jsx';
import { dateTimeToLocaleString } from '../../../mylib/DateUtils.js';

const FORMULA_HISTORY_MODIFIED = 'M'; // Formula history item is modified
const FORMULA_HISTORY_ADDED = 'A'; // Formula history item is added
const FORMULA_HISTORY_REMOVED = 'R'; // Formula history item is removed

export const FormulaChanges = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isRtl = rightToLeft();
  const direction = isRtl ? 'rtl' : 'ltr';
  const cellAlignStyle = { textAlign: isRtl ? 'right' : 'left' };

  // Selectors for formula changes and loading/error states
  const formulaChanges = useSelector((state) => state.formula.formula_changes);
  const loading = useSelector(
    (state) => state.formula.fetch_formula_changes_start
  );
  const error = useSelector(
    (state) => state.formula.fetch_formula_changes_error
  );

  useEffect(() => {
    dispatch(formulaActions.fetchFormulaChanges());
  }, [dispatch]);

  const data = (formulaChanges || []).map((change, index) => ({
    id: index,
    ...change,
    modificationdate: new Date(change.modificationdate),
  }));

  const columns = [
    {
      dataField: 'colourcode',
      text: t('lbl.colourCode', 'Colour Code'),
      formatter: colorFormatter,
      sort: true,
      sortCaret: sortCarret,
      headerStyle: cellAlignStyle,
      style: cellAlignStyle,
    },
    {
      dataField: 'products',
      text: t('lbl.products', 'Products'),
      formatter: (d) => {
        return (
          <ul
            style={{
              paddingLeft: isRtl ? 0 : '10px',
              paddingRight: isRtl ? '10px' : 0,
              marginBottom: 0,
            }}
          >
            {d.map((product) => {
              return <li key={product.id}>{product.productname}</li>;
            })}
          </ul>
        );
      },
      headerStyle: cellAlignStyle,
      style: cellAlignStyle,
    },
    {
      dataField: 'modificationdate',
      text: t('lbl.dateTime', 'Date/Time'),
      formatter: (d) => dateTimeToLocaleString(d),
      sort: true,
      sortCaret: sortCarret,
      headerStyle: cellAlignStyle,
      style: cellAlignStyle,
    },
    {
      dataField: 'action',
      text: t('lbl.action', 'Action'),
      formatter: (d, r) => {
        switch (d) {
          case FORMULA_HISTORY_MODIFIED:
            return (
              <span className="text-warning" data-cy={`${r.id}.modified`}>
                {t('lbl.modified', 'Modified')}
              </span>
            );
          case FORMULA_HISTORY_ADDED:
            return (
              <span className="text-success" data-cy={`${r.id}.added`}>
                {t('lbl.added', 'Added')}
              </span>
            );
          case FORMULA_HISTORY_REMOVED:
            return (
              <span className="text-danger" data-cy={`${r.id}.removed`}>
                {t('lbl.removed', 'Removed')}
              </span>
            );
          default:
            return d;
        }
      },
      sort: true,
      sortCaret: sortCarret,
      headerStyle: cellAlignStyle,
      style: cellAlignStyle,
    },
  ];

  return (
    <Card
      style={{ height: 'calc((100vh - 102px) - 6rem)' }}
      className="config-card"
      dir={direction}
    >
      <CardHeader className="config-card-header" dir={direction}>
        {t('cfg.h_formula_changes', 'Formula changes')}
      </CardHeader>
      <CardBody className="scroll config-card-body" dir={direction}>
        {loading && <Spinner />}
        {error && <div style={{ color: 'red' }}>{error.toString()}</div>}
        <BootstrapTable keyField="id" hover data={data} columns={columns} />
      </CardBody>
    </Card>
  );
};
