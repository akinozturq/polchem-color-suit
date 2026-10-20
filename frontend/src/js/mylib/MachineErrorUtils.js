import { MACHINE_MSG_ID_DISPENSING_ERROR_DETAIL_NEW } from '../Constants';

export function mstateErrorToTranslationKey(mstate) {
  if (
    // This is a special case for dispensing errors, which have a separate set of translation keys
    mstate.msgID === MACHINE_MSG_ID_DISPENSING_ERROR_DETAIL_NEW &&
    mstate.msgParams?.[1]
  ) {
    return `machine.error.${mstate.msgParams[1]}`;
  }

  return mstate.msgID ? `machine.msg.${String(mstate.msgID)}` : undefined;
}

export function machineErrorToTranslationKey(error) {
  return error?.error_code ? `machine.error.${error?.error_code}` : undefined;
}
