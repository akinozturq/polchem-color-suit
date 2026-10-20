import React from 'react';
import PropTypes from 'prop-types';
import ColorThumbnail from 'js/components/shared/ColorThumbnail';
import { Row, Progress, Col } from 'reactstrap';

const propTypes = {
  canister: PropTypes.shape({
    code: PropTypes.string.isRequired,
    circuits: PropTypes.array.isRequired,
    barcode: PropTypes.string,
    enabled: PropTypes.bool,
    minLevel: PropTypes.number.isRequired,
    rgb: PropTypes.number,
    specificgravity: PropTypes.number.isRequired,
    id: PropTypes.number,
    currLevel: PropTypes.number.isRequired,
    warnLevel: PropTypes.number.isRequired,
    maxLevel: PropTypes.number.isRequired,
    canEnable: PropTypes.bool,
  }),
  levelFormatter: PropTypes.shape({
    format: PropTypes.func.isRequired,
  }),
};

export default function CanisterRow(props) {
  let color = 'success';
  if (props.canister.currLevel < props.canister.minLevel) {
    color = 'danger';
  } else if (props.canister.currLevel < props.canister.warnLevel) {
    color = 'warning';
  } else {
    // Needed for some reason!!
    color = 'success';
  }

  var style = {
    cursor: 'pointer',
  };

  return (
    <Row style={style}>
      <div style={{ width: '32px' }} className="pl-4">
        <ColorThumbnail rgb={props.canister.rgb} size="24px">
          {props.canister.id}
        </ColorThumbnail>
      </div>
      <Col xs={4}>{props.canister.code}</Col>
      <Col xs={2}>
        {props.levelFormatter?.format({
          volume: props.canister.currLevel,
          specificgravity: props.canister.specificgravity,
        })}
      </Col>
      <Col className="m-auto">
        <Progress
          value={props.canister.currLevel}
          max={props.canister.maxLevel}
          color={color}
        />
      </Col>
    </Row>
  );
}

CanisterRow.propTypes = propTypes;
