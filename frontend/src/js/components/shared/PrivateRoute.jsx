import React from 'react';
import { Route, Redirect } from 'react-router';
import PropTypes from 'prop-types';

const PrivateRoute = ({
  component: Component,
  hasPrivilege,
  showDatePickers,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        hasPrivilege ? (
          <Component showDatePickers={showDatePickers} {...props} />
        ) : (
          <Redirect to={{ pathname: '/' }} />
        )
      }
    />
  );
};

PrivateRoute.propTypes = {
  component: PropTypes.any,
  hasPrivilege: PropTypes.bool.isRequired,
  showDatePickers: PropTypes.bool,
};

export default PrivateRoute;
