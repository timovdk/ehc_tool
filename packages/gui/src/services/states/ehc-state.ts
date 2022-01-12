import { IAppModel, UpdateStream } from '../meiosis';
import Stream from 'mithril/stream';
import { IButton, IStimulusStart, ScreenRoles } from 'ehc-models-utils';

/** EHC Service state */

export interface IEHCStateModel {
  screenRole: ScreenRoles;
  testRunning: boolean;
  buttons: Array<IStimulusStart>;
  buttons_timed: Array<IButton>;
}

export interface IEHCStateActions {
  updateTiming: (x: number, y: number, button: IStimulusStart) => void;
}

export interface IEHCState {
  initial: IEHCStateModel;
  actions: (us: UpdateStream, states: Stream<IAppModel>) => IEHCStateActions;
}

export const ehcState = {
  initial: {
    screenRole: ScreenRoles.UNKOWN,
    testRunning: false,
    buttons_timed: new Array<IButton>(),
  },
  actions: (us: UpdateStream, states: Stream<IAppModel>) => {
    return {
      updateTiming: (x: number, y: number, button: IStimulusStart) => {
        us({
          buttons_timed: (btList: Array<IButton>) => {
            btList.push({
              button_id: button.label,
              button_screen: states().screenRole === ScreenRoles.NEAR ? 'N' : 'F',
              button_middle: [button.left + 95, button.top + 95],
              touch_location: [x, y],
              touch_time: new Date().toISOString(),
            });
            return btList;
          },
        });
      },
    };
  },
} as IEHCState;
