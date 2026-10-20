import { authenticated } from './WebRequest';

export function getOrderUploadStatus(siteId) {
  return authenticated.get(`/upload_handler/${siteId}/upload_orders_status`);
}

