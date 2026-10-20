import JSONRPC from 'jsonrpc-dispatch';

const consts = {
  CALIB_GUI: 0, //: separate GUI will appear to control calibration
  CALIB_BLACK: 1, //: black calibration using black trap
  CALIB_WHITE: 2, //: white calibration using white tile
  CALIB_GREY: 3, //: grey calibration
  CALIB_CHECK_GREEN: 4, //: calibration check using green tile
  CALIB_CLOSE_COVER: 5, //: calibration, user must close
  CALIB_UV1: 6, //: ultraviolet calibration
  CALIB_UV2: 7,
  CALIB_BLACK_OPEN: 8, //Instructs user to use black trap or open port
  CALIB_AUTO: 10, //instrument can calibrate itself without help from user
  CALIB_DEVICE_UI: 11, //user must follow directions shown on device

  TRIGGER_CALIB_SW: 0, //calibration measurement can be initiated from software
  TRIGGER_CALIB_DEVICE: 1, //calibration measurement can be initiated on device
  TRIGGER_MEAS_SW: 2, //measurement can be initiated from software
  TRIGGER_MEAS_DEVICE: 3, //measurement can be initiated on device

  INSTALL_UNIT_DRIVER_FILES: 0,
  INSTALL_WHITE_STANDARD_FILES: 1,

  RESULT_OK: 0,
  RESULT_UNKNOWN: 3, //calibration ended
};

export class SpectroAPI {
  constructor() {
    // dummy dispatcher that resolves all calls to null
    this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
  }

  connect(qtobject) {
    try {
      this.jsonrpc = new JSONRPC((message) =>
        qtobject.dispatch(JSON.stringify(message))
      );
      qtobject.response.connect((str) =>
        this.jsonrpc.handleResponse(JSON.parse(str))
      );
    } catch (e) {
      console.log('Error in Spectro Qt connection');
      console.log(e);
    }
  }

  // all methods return promises
  getConfig() {
    return this.jsonrpc.request('getConfig');
  }

  getModelInfo() {
    return this.jsonrpc.request('getModelInfo');
  }

  setDriver(name) {
    return this.jsonrpc.request('setDriver', [name]);
  }

  setPort(name, address) {
    return this.jsonrpc.request('setPort', [name, address]);
  }

  configure() {
    return this.jsonrpc.request('configure');
  }

  getStatus() {
    return this.jsonrpc.request('getStatus');
  }

  installPrompts(steps) {
    return this.jsonrpc.request('installPrompts', [steps]);
  }

  calibrate(step, waitForTrigger) {
    const timeout = 30;
    return this.jsonrpc.request('calibrate', [step, waitForTrigger, timeout]);
  }

  measure(waitForTrigger, gloss = null) {
    const timeout = 30;
    const params =
      gloss == null
        ? [waitForTrigger, timeout] // this case is compatible with older pos app
        : [waitForTrigger, timeout, gloss];
    return this.jsonrpc.request('measure', params);
  }

  setMode(aperture, specularMode, uvMode) {
    return this.jsonrpc.request('set_mode', [aperture, specularMode, uvMode]);
  }

  download() {
    return this.jsonrpc.request('download');
  }

  clearStored() {
    return this.jsonrpc.request('clear_stored');
  }

  refl_045_to_sci(refl, gloss) {
    return this.jsonrpc.request('refl_045_to_sci', [refl, gloss]);
  }
}

const api = new SpectroAPI();

export { api as default, consts };
