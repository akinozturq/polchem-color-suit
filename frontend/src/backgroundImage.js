import { handle_db_name } from './js/redux/Utils.js';
import log from './js/api/Logger.js';

export function setBackgroundImage(zoneid) {
  try {
    // Remove existing custom css file from head if it exists
    const existingLink = document.querySelector(
      'link[data-background="background_image"]'
    );
    if (existingLink) {
      document.head.removeChild(existingLink);
    }

    // Add new custom css file to head
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.setAttribute('data-background', 'background_image'); // Add custom attribute
    link.href = handle_db_name(
      `/css/custom.css?zoneid=${zoneid}&timestamp=${new Date().getTime()}`
    ); // Ensure unique query
    document.head.appendChild(link);
  } catch (e) {
    log.error('Error in setBackgroundImage:', e);
  }
}
