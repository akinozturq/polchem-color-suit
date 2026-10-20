/** Line graph using recharts. Load dynamically to keep recharts out of main bundle */

import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import PropTypes from 'prop-types';

const Graph = ({ lines, label, stdLabel }) => (
  <ResponsiveContainer
    width="100%"
    height="100%"
    minWidth={100}
    minHeight={100}
  >
    <LineChart
      width={200}
      height={200}
      data={lines}
      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
    >
      <XAxis dataKey="name" />
      <YAxis domain={[0, 100]} tickCount={1} allowDecimals={false} width={10} />
      <Line
        type="monotone"
        name={stdLabel} //{t('lbl.standard_graph', 'Standard')}
        dataKey="std"
        stroke="rgb(48, 141, 199)"
        dot={false}
      />
      <Line
        type="monotone"
        name={label}
        dataKey="value"
        stroke="#FFFFFF"
        dot={false}
      />
      <Legend />
    </LineChart>
  </ResponsiveContainer>
);

Graph.propTypes = {
  lines: PropTypes.arrayOf(PropTypes.object).isRequired,
  label: PropTypes.string.isRequired,
  stdLabel: PropTypes.string.isRequired,
};

export default Graph;
