// Keeps the label layout that is loaded and/or saved to the backend



import { globalizeSelectors } from '../Utils';



const types = {

  RESET_LAYOUT: 'LAYOUT/RESET_LAYOUT',

  CREATE_ITEM: 'LAYOUT/CREATE_ITEM',

  UPDATE_ITEM: 'LAYOUT/UPDATE_ITEM',

  DELETE_ITEM: 'LAYOUT/DELETE_ITEM',

  MOVE_ITEM_UP: 'LAYOUT/MOVE_ITEM_UP',

  MOVE_ITEM_DOWN: 'LAYOUT/MOVE_ITEM_DOWN',

  MOVE_ITEM_TOP: 'LAYOUT/MOVE_ITEM_TOP',

  MOVE_ITEM_BOTTOM: 'LAYOUT/MOVE_ITEM_BOTTOM',

  MOVE_ITEM: 'LAYOUT/MOVE_ITEM',

  LOAD: 'LAYOUT/LOAD',

  UPDATE_PAGE: 'LAYOUT/UPDATE_PAGE',

  EDIT_PROPERTIES: 'LAYOUT/EDIT_PROPERTIES',

  UPDATE_LABELVARIABLES: 'LAYOUT/UPDATE_LABELVARIABLES',

  READ_ONLY: 'LAYOUT/READ_ONLY',

  SET_INITIAL_LAYOUT: 'LAYOUT/SET_INITIAL_LAYOUT',

  SET_ORIENTATION: 'LAYOUT/SET_ORIENTATION',

};



const actions = {

  setInitialLayout: (layout) => ({

    type: types.SET_INITIAL_LAYOUT,

    payload: layout,

  }),

  createItem: (item) => ({ type: types.CREATE_ITEM, payload: item }),

  updateItem: (item) => ({ type: types.UPDATE_ITEM, payload: item }),

  deleteItem: (item) => ({ type: types.DELETE_ITEM, payload: item }),



  resetLayout: () => ({ type: types.RESET_LAYOUT, payload: null }),

  // Changing the order of items to alter z order

  moveItemUp: (item) => ({ type: types.MOVE_ITEM_UP, payload: item }),

  moveItemDown: (item) => ({ type: types.MOVE_ITEM_DOWN, payload: item }),

  moveItemTop: (item) => ({ type: types.MOVE_ITEM_TOP, payload: item }),

  moveItemBottom: (item) => ({ type: types.MOVE_ITEM_BOTTOM, payload: item }),



  load: (layout) => ({ type: types.LOAD, payload: layout }),

  updatePage: (page) => ({ type: types.UPDATE_PAGE, payload: page }),



  updateLabelVariables: (variables) => ({

    type: types.UPDATE_LABELVARIABLES,

    payload: variables,

  }),

  updateReadOnly: (layout) => ({ type: types.READ_ONLY, payload: layout }),

  setOrientation: (value) => ({ type: types.SET_ORIENTATION, payload: value }),

};



const mountPath = 'layout'; // mount point in global state, must match root reducer



export const ORIENTATION_PORTRAIT = 'portrait';

export const ORIENTATION_LANDSCAPE = 'landscape';



const initial_state = {

  items: {}, // to map items ids to items

  itemids: [], // to maintain order of items

  width: { pixel: 340, mm: 90 }, // width

  height: { pixel: 110, mm: 29 }, // height

  marginTop: 0, // editor page margins in mm

  marginBottom: 0,

  marginLeft: 0,

  marginRight: 0,

  orientation: ORIENTATION_LANDSCAPE,



  values: {

    country: 'Finland',

    email: 'example@yahoo.com',

    postalCode: '01380, Vantaa, Finland',

    website: 'www.easyprint.com',

    companyname: 'Chromaflo Oy',

    siteaddress: 'Heidofintie 6, Vantaa',

    siteinfo: 'site info',

    polchem_color_suit: 'Polchem Color Suit lab',

    orderinfo: 'order info',

    defaultcurrency: 'default currency',

    selectedcurrency: 'selected currency',

    extrainfo: 'extra info',

    formula: 'Formula',

    formulainline: 'Formula Inline',

    dateandtimes: 'Date and Times',

    sitephone: 'site phone',

    sitename: 'site name',

  },

};



function reducer(state = initial_state, action) {

  let item = action.payload;

  switch (action.type) {

    case types.RESET_LAYOUT: {

      return initial_state;

    }

    case types.SET_INITIAL_LAYOUT: {

      // If null passed as initial layout then use the layout provided by initial state

      if (item !== null) {

        return item;

      }

      return initial_state;

    }

    case types.LOAD: {

      // If null passed as initial layout then use the layout provided by initial state

      if (item !== null) {

        return {

          ...state,

          items: item.items || {}, // to map items ids to items

          itemids: item.itemids || [], // to maintain order of items

          width: item.width || { pixel: 340, mm: 90 }, // width

          height: item.height || { pixel: 110, mm: 29 }, // height

          marginTop: item.marginTop || 0, // editor page margins in mm

          marginBottom: item.marginBottom || 0,

          marginLeft: item.marginLeft || 0,

          marginRight: item.marginRight || 0,

          orientation: item.orientation || ORIENTATION_LANDSCAPE,

        };

      }

      return initial_state;

    }

    case types.CREATE_ITEM: {

      const itemTypeNameCount =

        localSelectors

          .itemsAsArray(state)

          .find((el) => el.itemType === item.itemType) &&

        localSelectors

          .itemsAsArray(state)

          .reverse()

          .find((el) => el.itemType === item.itemType).name;

      item = {

        ...item,

        name: itemTypeNameCount

          ? item.itemType +

            (

              Number(

                itemTypeNameCount.substring(

                  itemTypeNameCount.length - 1,

                  itemTypeNameCount.length

                )

              ) + 1

            ).toString()

          : item.itemType + 1,

      };

      return {

        ...state,

        items: { ...state.items, [item.id]: item },

        itemids: [...state.itemids, item.id],

      };

    }

    case types.UPDATE_PAGE: {

      return {

        ...state,

        ...item,

      };

    }



    case types.UPDATE_LABELVARIABLES: {

      return {

        ...state,

        ...item,

      };

    }

    case types.UPDATE_ITEM: {

      return {

        ...state,

        items: { ...state.items, [item.id]: { ...item } },

      };

    }

    case types.DELETE_ITEM: {

      const newItems = localSelectors

        .itemsAsArray(state)

        .filter((el) => el.id !== item.id)

        .map((el) =>

          el.id > item.id

            ? {

                ...el,

                id: el.id - 1,

                name:

                  el.itemType === item.itemType

                    ? el.itemType +

                      (

                        Number(

                          el.name.substring(el.name.length - 1, el.name.length)

                        ) - 1

                      ).toString()

                    : el.name,

              }

            : { ...el }

        )

        .reduce((obj, item) => {

          obj[item.id] = { ...item };

          return obj;

        }, {});

      return {

        ...state,

        items: newItems,

        itemids: state.itemids

          .filter((x) => x !== item.id)

          .map((x) => (x > item.id ? x - 1 : x)),

      };

    }



    // Moving itemid in itemids changes the z position of the item:

    case types.MOVE_ITEM_BOTTOM: {

      return {

        ...state,

        itemids: [item.id, ...state.itemids.filter((x) => x !== item.id)],

      };

    }

    case types.MOVE_ITEM_TOP: {

      return {

        ...state,

        itemids: [...state.itemids.filter((x) => x !== item.id), item.id],

      };

    }

    case types.MOVE_ITEM_DOWN: {

      const itemids = [...state.itemids];

      const i = itemids.indexOf(item.id);

      if (i > 0) {

        itemids[i] = itemids[i - 1];

        itemids[i - 1] = item.id;

      }

      return {

        ...state,

        itemids,

      };

    }

    case types.SET_ORIENTATION: {

      return {

        ...state,

        orientation: item,

      };

    }

    case types.MOVE_ITEM_UP: {

      const itemids = [...state.itemids];

      const i = itemids.indexOf(item.id);

      if (i < itemids.length - 1) {

        itemids[i] = itemids[i + 1];

        itemids[i + 1] = item.id;

      }

      return {

        ...state,

        itemids,

      };

    }

    default: {

      return state;

    }

  }

}



const localSelectors = {

  itemById: (state, id) => state.items[id],

  itemsAsArray: (state) => state.itemids.map((id) => state.items[id]),

};



const selectors = globalizeSelectors(localSelectors, mountPath);



export {

  types as actionTypes,

  actions as default,

  //  propType,

  selectors,

  reducer,

};

