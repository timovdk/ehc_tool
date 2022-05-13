import { IAppModel, UpdateStream } from '../meiosis';
import Stream from 'mithril/stream';
import { IArrow, IAttentionButton, IButton, IStimulusEvent, IStimulusStart, ScreenRoles } from 'ehc-models-utils';

/** EHC Service state */

export interface IEHCStateModel {
  screenRole: ScreenRoles;
  testRunning: boolean;
  buttons: Array<IStimulusStart>;
  buttons_timed: Array<IButton>;
  attentionTestRunning: boolean;
  attentionButton: IAttentionButton;
  sendData: boolean;
  attentionAccommodationTestRunning: boolean;
  accommodationTestRunning: boolean;
  accommodationArrow: IArrow;
  showBars: boolean;
  bars: IStimulusEvent;
}

export interface IEHCStateActions {
  updateTiming: (x: number, y: number, button: IStimulusStart) => void;
  attentionButtonClicked: (x: number, y: number) => void;
}

export interface IEHCState {
  initial: IEHCStateModel;
  actions: (us: UpdateStream, states: Stream<IAppModel>) => IEHCStateActions;
}

export const ehcState = {
  initial: {
    screenRole: ScreenRoles.UNKNOWN,
    testRunning: false,
    buttons_timed: new Array<IButton>(),
    attentionTestRunning: false,
    attentionButton: {} as IAttentionButton,
    sendData: false,
    attentionAccommodationTestRunning: false,
    accommodationTestRunning: false,
    accommodationArrow: {} as IArrow,
    showBars: false,
    bars: {} as IStimulusEvent,
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
      attentionButtonClicked: (x: number, y: number) => {
        const attentionButtonFilled = {
          button_screen: states().screenRole === ScreenRoles.NEAR ? 'N' : 'F',
          button_middle: [960, 540],
          touch_location: [x, y],
          touch_time: new Date().toISOString(),
          pressed: states().screenRole === ScreenRoles.NEAR ? '<' : '>'
        } as IAttentionButton;
        us({ attentionButton: attentionButtonFilled, attentionTestRunning: false });
      },
    };
  },
} as IEHCState;
