import { io, Socket } from 'socket.io-client';
import { IButton, IStimulusStart, ScreenRoles } from 'ehc-models-utils';
import { UpdateStream } from './meiosis';

export class SocketService {
  private socket: Socket;

  constructor(us: UpdateStream) {
    this.socket = io('http://localhost:3000', { extraHeaders: { "type-of-client": "screen" } });

    this.socket.on('setScreenRole', (data: ScreenRoles) => {
      us({ screenRole: data });
    })

    this.socket.on('startTestNow', (data: IStimulusStart[]) => {
      us({ testRunning: true, buttons: data });
      let btn_1 = document.getElementById(`button-0`)
      let btn_2 = document.getElementById(`button-1`)
      btn_1 ? btn_1.style.visibility = '' : undefined
      btn_2 ? btn_2.style.visibility = '' : undefined
    })
  }

  sendTimedButtons = (buttons: Array<IButton>) => {
    this.socket.emit('buttonsPressed', buttons)
  }
}