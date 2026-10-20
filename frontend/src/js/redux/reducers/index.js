import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import { reducer as order } from './Order';
import { reducer as order_queue } from './OrderQueue';
import { reducer as history } from './History';
import { reducer as customer } from './Customer';
import { reducer as cache } from './Cache';
import { reducer as login } from './Login';
import { reducer as hover_color } from './HoverColor';
import { reducer as hover_product } from './HoverProduct';
import { reducer as machine } from './Machine';
import { reducer as spectro } from './Spectro';
import { reducer as configurations } from './Configuration';
import { reducer as update_checker } from './UpdateChecker';
import { reducer as formula } from './Formula';
import { reducer as busy } from './Busy';
import { reducer as remote_support } from './RemoteSupport';
import { reducer as errors } from './Errors';
import { reducer as transfer } from './Transfer';
import { reducer as user } from './User';
import { reducer as print_preview } from './PrintPreview';
import { reducer as protection } from './Protection';
import { reducer as barcodeaction } from './BarcodeAction';
import { reducer as barcodesearch } from './BarcodeSearch';
import { reducer as pricing } from './Pricing';
import { reducer as statistics } from './Statistics';
import { reducer as replication } from './Replication';
import { reducer as offline } from './Offline';
import { reducer as standalone2cloud } from './Standalone2Cloud';
import { reducer as maintenance } from './Maintenance';
import { reducer as pos_app_permissions } from './PosAppPermissions';
import { reducer as lostpassword } from './LostPassword';
import { reducer as backup } from './Backup';
import { reducer as email } from './Email';
import { reducer as inventory } from './Inventory';
import { reducer as minigdata } from './MiniGData';
import { reducer as translations } from './Translations';

export default (browserhistory) =>
  combineReducers({
    router: connectRouter(browserhistory), // rest of your reducers
    backup,
    barcodeaction,
    barcodesearch,
    busy,
    inventory,
    remote_support,
    cache,
    configurations,
    customer,
    email,
    errors,
    formula,
    history,
    hover_color,
    hover_product,
    login,
    lostpassword,
    machine,
    maintenance,
    offline,
    standalone2cloud,
    order,
    order_queue,
    print_preview,
    protection,
    pos_app_permissions,
    replication,
    translations,
    spectro,
    statistics,
    transfer,
    update_checker,
    user,
    pricing,
    minigdata,
  });
