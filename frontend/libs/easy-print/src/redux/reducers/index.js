import { combineReducers } from 'redux';
import { undoHistoryReducer } from 'redux-undo-redo';
import { reducer as layout } from './Layout';
import { reducer as editor } from './Editor';

export default combineReducers({
  layout,
  editor,
  undoHistory: undoHistoryReducer,
});
