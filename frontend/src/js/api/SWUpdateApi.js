import updateActions from '../redux/reducers/UpdateChecker';



export class SWUpdateApi {

  connect(qtobject, store) {

    // connecting all machine actions here

    this.qtobject = qtobject;

    try {

      if (qtobject) {

        qtobject.swupdate_state.connect((state) => {

          store.dispatch(updateActions.setSWupdateState(JSON.parse(state)));

        });

      }

    } catch (e) {

      console.log(e);

    }

    try {

      if (qtobject) {

        qtobject.sw_versions.connect((state) => {

          store.dispatch(updateActions.setVersions(JSON.parse(state)));

        });

      }

    } catch (e) {

      console.log(e);

    }

  }



  approve_download() {

    this.qtobject.approve_download();

  }

  start_update() {

    this.qtobject.start_update();

  }

  check_files(versions) {

    if (this.qtobject) {

      this.qtobject.check_files(JSON.stringify(versions));

    }

  }

  check_my_polchem_com() {

    if (this.qtobject) {

      this.qtobject.check_my_polchem_com();

    }

  }

  set_db_versions(params) {

    if (this.qtobject) {

      this.qtobject.set_db_versions(JSON.stringify(params));

    }

  }



  get_sw_versions() {

    if (this.qtobject) {

      try {

        this.qtobject.get_sw_versions();

      } catch (e) {

        console.log(e);

      }

    }

  }

}

const api = new SWUpdateApi();



export { api as default };

