import { IAppModel, UpdateStream } from '../meiosis';
import Stream from 'mithril/stream';
import { SocketService } from '../socket-service';
import { IArrow, IButton, IAttentionButton } from 'ehc-models-utils';

/** Socket Service state */

export interface ISocketStateModel {
  socket: SocketService;
}

export interface ISocketStateActions {
  sendTiming: () => void;
  sendAttention: () => void;
  sendAccommodationAttention: () => void;
  sendAccommodationTest: (dir: string, arrow: IArrow, time_pressed: string) => void;
}

export interface ISocketState {
  initial: ISocketStateModel;
  actions: (us: UpdateStream, states: Stream<IAppModel>) => ISocketStateActions;
}

export const socketState = {
  initial: {
    socket: {},
  },
  actions: (us: UpdateStream, states: Stream<IAppModel>) => {
    return {
      sendTiming: () => {
        states().socket.sendTimedButtons(states().buttons_timed);
        us({ buttons_timed: new Array<IButton>(), sendData: true });
      },
      sendAttention: () => {
        states().socket.sendAttentionTestButtons(states().attentionButton);
        us({ attentionButtons: {} as IAttentionButton });
      },
      sendAccommodationAttention: () => {
        states().socket.sendAccommodationAttentionTestButtons(states().attentionButton);
        us({ attentionButtons: {} as IAttentionButton });
      },
      sendAccommodationTest: (dir: string, arrow: IArrow, time_pressed: string) => {
        states().socket.sendAccommodationTest(dir, arrow, time_pressed);
        us({ accommodationArrow: {} as IArrow });
      }
    };
  },
} as ISocketState;
