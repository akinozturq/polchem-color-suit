import { all } from 'redux-saga/effects';

import spectroSaga from './Spectro';
import spectroSimuSaga from './SpectroSimu';
import cacheSaga from './Cache';
import loginSaga from './Login';
import machineSaga from './Machine';
import flinkMachineSaga from './FlinkMachine';
import machineSimuSaga from './MachineSimu';
import configSaga from './Configuration';
import orderSaga from './Order';
import orderFetchingSaga from './OrderFetching';
import historySaga from './History';
import customerSaga from './Customer';
import updateChecker from './UpdateChecker';
import formulaSaga from './Formula';
import transferSaga from './Transfer';
import userSaga from './User';
import printSaga from './PrintTask';
import ProtectionSaga from './Protection';
import BarcodeActionSaga from './BarcodeAction';
import BarcodeSearchSaga from './BarcodeSearch';
import PricingSaga from './Pricing';
import StatisticsSaga from './Statistics';
import ReplicationSaga from './Replication';
import OfflineSaga from './Offline';
import MaintenanceSaga from './Maintenance';
import PosAppPermissionsSaga from './PosAppPermissions';
import LostPasswordSaga from './LostPassword';
import BackupSaga from './Backup';
import OrderQueueSaga from './OrderQueue';
import RemoteSupportSaga from './RemoteSupport';
import PluginsSaga from './Plugins';
import RoutesSaga from './Routes';
import EmailSaga from './Email';
import InventorySaga from './Inventory';
import Minigdata from './MiniGData';
import translationsSaga from './Translations';
import Standalone2CloudSaga from './Standalone2Cloud';

export default function* rootSaga() {
  yield all([
    window.qtside ? spectroSaga() : spectroSimuSaga(),
    cacheSaga(),
    loginSaga(),
    window.qtside ? machineSaga() : machineSimuSaga(),
    flinkMachineSaga(),
    configSaga(),
    orderSaga(),
    orderFetchingSaga(),
    historySaga(),
    customerSaga(),
    formulaSaga(),
    updateChecker(),
    transferSaga(),
    userSaga(),
    printSaga(),
    ProtectionSaga(),
    BarcodeActionSaga(),
    BarcodeSearchSaga(),
    PricingSaga(),
    StatisticsSaga(),
    ReplicationSaga(),
    OfflineSaga(),
    Standalone2CloudSaga(),
    MaintenanceSaga(),
    PosAppPermissionsSaga(),
    LostPasswordSaga(),
    BackupSaga(),
    OrderQueueSaga(),
    RemoteSupportSaga(),
    PluginsSaga(),
    RoutesSaga(),
    EmailSaga(),
    InventorySaga(),
    Minigdata(),
    translationsSaga(),
  ]);
}
