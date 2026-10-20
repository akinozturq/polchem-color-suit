import { createUndoMiddleware } from 'redux-undo-redo';
import actions, { selectors as layoutSelectors } from './Layout';

export default createUndoMiddleware({
  getViewState: (state) => state.layout,
  // setViewState: actions.updatePage,
  revertingActions: {
    'LAYOUT/CREATE_ITEM': ({ payload }) => actions.deleteItem(payload.id),
    'LAYOUT/DELETE_ITEM': {
      action: (_, { item }) => actions.createItem(item),
      createArgs: (state) => ({
        item: layoutSelectors.itemById(state, state.editor.selected_itemid),
      }),
    },
    'LAYOUT/UPDATE_ITEM': {
      action: (_, { item }) => actions.updateItem(item),
      createArgs: (state) => ({
        item: layoutSelectors.itemById(state, state.editor.selected_itemid),
      }),
    },
    'LAYOUT/UPDATE_PAGE': {
      action: (_, { oldLayout }) => actions.updatePage(oldLayout),
      createArgs: (state) => ({
        oldLayout: state.layout,
      }),
    },
    'LAYOUT/MOVE_ITEM_DOWN': {
      action: ({ payload }) => actions.moveItemUp(payload),
    },
    'LAYOUT/MOVE_ITEM_UP': {
      action: ({ payload }) => actions.moveItemDown(payload),
    },
    'LAYOUT/MOVE_ITEM_TOP': {
      action: ({ payload }) => actions.moveItemBottom(payload),
    },
    'LAYOUT/MOVE_ITEM_BOTTOM': {
      action: ({ payload }) => actions.moveItemTop(payload),
    },
  },
});
