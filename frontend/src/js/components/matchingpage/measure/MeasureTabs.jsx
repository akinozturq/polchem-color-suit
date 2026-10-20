import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';

import { selectors as orderSelectors } from '../../../redux/reducers/Order';
import spectroActions, { selectors } from '../../../redux/reducers/Spectro';
import MeasurePanel, { MEASURE_PAINT, MEASURE_TARGET } from './MeasurePanel';

const TAB_TINTED_PAINT = '1';
const TAB_TARGET_COLOR = '2';

const MeasureTabs = ({ showPaint = false, showTarget = false }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const measureTarget = () => dispatch(spectroActions.measureTarget());
  const measurePaint = () => dispatch(spectroActions.measurePaint());
  const receiveMeasureTarget = (measurement) =>
    dispatch(spectroActions.receiveMeasureTarget(measurement));
  const receiveMeasurePaint = (measurement) =>
    dispatch(spectroActions.receiveMeasurePaint(measurement));

  const color = useSelector(orderSelectors.color);
  const spectro_measurement_target = useSelector(selectors.measurement_target);
  const spectro_measurement_paint = useSelector(selectors.measurement_paint);
  const [activeTab, setActiveTab] = useState(
    showPaint ? TAB_TINTED_PAINT : TAB_TARGET_COLOR
  );

  useEffect(() => {
    setActiveTab(showPaint ? TAB_TINTED_PAINT : TAB_TARGET_COLOR);
  }, [showPaint]);

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  if (!showPaint && !showTarget) {
    return null;
  }

  const paintPanel = (
    <MeasurePanel
      measureMode={MEASURE_PAINT}
      measure={measurePaint}
      setMeasurement={receiveMeasurePaint}
      hasMeasurement={!!spectro_measurement_paint}
    />
  );
  if (!showTarget) {
    return paintPanel;
  }

  const targetPanel = (
    <MeasurePanel
      measureMode={MEASURE_TARGET}
      measure={measureTarget}
      setMeasurement={receiveMeasureTarget}
      hasMeasurement={!!(spectro_measurement_target || color?.lab)}
    />
  );
  if (!showPaint) {
    return targetPanel;
  }

  return (
    <div className="measure-tabs">
      <Nav tabs className="measure-tabs-nav">
        <NavItem>
          <NavLink
            data-testid="tinted_paint_tab"
            active={activeTab === TAB_TINTED_PAINT}
            className="tab-link tab-link-small"
            onClick={() => {
              toggle(TAB_TINTED_PAINT);
            }}
            style={{ cursor: 'pointer' }}
          >
            {t('lbl.tintedPaint', 'Tinted paint')}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            data-testid="target_color_tab"
            active={activeTab === TAB_TARGET_COLOR}
            className="tab-link tab-link-small"
            onClick={() => {
              toggle(TAB_TARGET_COLOR);
            }}
            style={{ cursor: 'pointer' }}
          >
            {t('lbl.targetColor', 'Target color')}
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId={TAB_TINTED_PAINT}>{paintPanel}</TabPane>
        <TabPane tabId={TAB_TARGET_COLOR}>{targetPanel}</TabPane>
      </TabContent>
    </div>
  );
};

MeasureTabs.propTypes = {
  showPaint: PropTypes.bool,
  showTarget: PropTypes.bool,
};

export default MeasureTabs;
