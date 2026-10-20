import { authenticated, authenticated_cached } from './WebRequest';
import { omitNil } from 'js/mylib/Utils';
import { NUMERIC_ORDER_STATUS } from 'js/Constants';

export function history_search_orderitems(parameters) {
  const { siteid, ...params } = omitNil(parameters);
  params.orderstatus = NUMERIC_ORDER_STATUS.ORDER_STATUS_DONE;
  params.include_notes = true;
  return authenticated.get(`/query/site/${siteid}/orderitems_incremental/`, {
    params,
  });
}

export function load_last_order(parameters) {
  const { siteid, ...params } = omitNil(parameters);
  params.limit = 1; // only one is required!
  params.orderstatus = NUMERIC_ORDER_STATUS.ORDER_STATUS_DONE;
  params.local_only = true;
  return authenticated.get(`/query/site/${siteid}/orderitems_incremental/`, {
    params,
  });
}

export function search_customers(parameters) {
  const { siteid, ...params } = omitNil(parameters);
  // No caching here
  return authenticated.get(
    siteid != null ? `/query/site/${siteid}/customers/` : '/query/customers/',
    { params }
  );
}

export function load_customer(parameters) {
  const { customerid } = parameters;
  return authenticated.get(`/rest/customer/${customerid}`);
}

export function save_customer(obj) {
  return authenticated.save('/rest/customer/', obj, 'customerid');
}

export function delete_customer(customer) {
  const { customerid, siteid } = customer;
  return authenticated.delete(`/customer/site/${siteid}/delete/${customerid}`);
}

export function orders_list(parameters) {
  const { siteid, ...params } = omitNil(parameters);
  return authenticated.get(`/query/site/${siteid}/orders_list/`, { params });
}

export function orderitem_details(parameters) {
  const { zoneid, itemid } = parameters;
  return authenticated.get(`/query/zone/${zoneid}/orderitem_details/${itemid}`);
}

export function save_localorder(obj) {
  return authenticated.save('/rest/localorder/', obj, 'orderid');
}

export function save_orderitem(obj) {
  return authenticated.save('/rest/orderitem/', obj, 'itemid');
}

export function post_dispense(data) {
  return authenticated.post('/rest/dispense/', data);
}

export function delete_localorder(parameters) {
  const { orderid } = parameters;
  return authenticated.delete(`/rest/localorder/${orderid}`);
}

export function close_orderitem(parameters) {
  const { siteid, itemid } = parameters;
  return authenticated.get(`/query/site/${siteid}/orderitem_close`, {
    params: { itemid },
  });
}

export function hide_orderitem(parameters) {
  const { siteid, itemid } = parameters;
  return authenticated.post(`/query/site/${siteid}/orderitem_hide`, {
    params: { itemid },
  });
}

export function close_localorder(parameters) {
  const { siteid, orderid } = parameters;
  // same API as for items
  return authenticated.get(`/query/site/${siteid}/orderitem_close`, {
    params: { orderid },
  });
}

export function move_orders(siteid, data) {
  return authenticated.post(`/query/site/${siteid}/move_orders`, data);
}

export function move_orders_to_customer(parameters) {
  const { siteid, from_customerid, to_customerid, orderids } = parameters;

  return authenticated.post(`/query/site/${siteid}/move_orders_to_customer`, {
    from_customerid,
    to_customerid,
    orderids,
  });
}

export function is_colourcode_free(params) {
  const { zoneid, colourcode } = params;

  return authenticated_cached.get(`/query/zone/${zoneid}/is_colourcode_free`, {
    params: { colourcode },
  });
}
