import { IAppModel, UpdateStream } from '../meiosis';
import Stream from 'mithril/stream';
import { SocketService } from '../socket-service';
import { IButton, IAttentionButton } from 'ehc-models-utils';

/** Socket Service state */

export interface ISocketStateModel {
  socket: SocketService;
}

export interface ISocketStateActions {
  sendTiming: () => void;
  sendAttention: () => void;
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
        us({ buttons_timed: new Array<IButton>() });
      },
      sendAttention: () => {
        states().socket.sendAttentionTestButtons(states().attentionButton);
        us({ attentionButtons: {} as IAttentionButton });
      }
    };
  },
} as ISocketState;
