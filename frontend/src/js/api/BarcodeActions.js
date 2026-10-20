import { authenticated } from './WebRequest';
import { omitNil } from 'js/mylib/Utils';

export function searchBarcodes(parameters) {
  const { zoneid, ...params } = omitNil(parameters);
  return authenticated.get(`/query/zone/${zoneid}/barcodes/`, { params });
}

export function barcodeResolve(barcode) {
  const params = omitNil({ barcode });
  return authenticated.get('/query/barcode_resolve', { params });
}
