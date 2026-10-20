/*
 * action types
 */

const types = {
  PROCESS_TASKS_BEFORE_TINT: 'PRINT_TASK/PROCESS_TASKS_BEFORE_TINT',
  PROCESS_TASKS_AFTER_CAN: 'PRINT_TASK/PROCESS_TASKS_AFTER_CAN',
  PROCESS_TASKS_AFTER_ERROR: 'PRINT_TASK/PROCESS_TASKS_AFTER_ERROR',
};

/*
 * action creators - thunks
 */

const actions = {
  processTasksBeforeTint: () => (dispatch, getState) =>
    dispatch({
      type: types.PROCESS_TASKS_BEFORE_TINT,
      payload: getState(),
    }),
  processTasksAfterCan: () => (dispatch, getState) =>
    dispatch({
      type: types.PROCESS_TASKS_AFTER_CAN,
      payload: getState(),
    }),
  processTasksAfterError: () => (dispatch, getState) =>
    dispatch({
      type: types.PROCESS_TASKS_AFTER_ERROR,
      payload: getState(),
    }),
};

export { types as actionTypes, actions as default };
