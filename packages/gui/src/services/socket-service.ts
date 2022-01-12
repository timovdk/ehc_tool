import { io, Socket } from 'socket.io-client';
import { IButton, IStimulusStart, ScreenRoles } from 'ehc-models-utils';
import { UpdateStream } from './meiosis';
import { states } from '.';

export class SocketService {
  private socket: Socket;

  constructor(us: UpdateStream) {
    this.socket = io('http://localhost:3000', { extraHeaders: { 'type-of-client': 'screen' } });

    this.socket.on('setScreenRole', (data: ScreenRoles) => {
      us({ screenRole: data });
    });

    this.socket.on('startTestNow', (data: IStimulusStart[]) => {
      us({ testRunning: true, buttons: data });
      let btn_1 = document.getElementById(`button-0`);
      let btn_2 = document.getElementById(`button-1`);
      btn_1 ? (btn_1.style.visibility = '') : undefined;
      btn_2 ? (btn_2.style.visibility = '') : undefined;
    });

    this.socket.on('testStopped', () => {
      // First hide the buttons
      let btn_1 = document.getElementById(`button-0`);
      let btn_2 = document.getElementById(`button-1`);
      btn_1 ? (btn_1.style.visibility = 'hidden') : undefined;
      btn_2 ? (btn_2.style.visibility = 'hidden') : undefined;

      // Then add the missing buttons to the list
      let btList = states().buttons_timed;
      const stimulusStart = states().buttons;

      const button1 = {
        button_id: stimulusStart[0].label,
        button_screen: states().screenRole === ScreenRoles.NEAR ? 'N' : 'F',
        button_middle: [stimulusStart[0].left + 95, stimulusStart[0].top + 95],
        touch_location: [0, 0],
        touch_time: 'STOP',
      } as IButton;
      const button2 = {
        button_id: stimulusStart[1].label,
        button_screen: states().screenRole === ScreenRoles.NEAR ? 'N' : 'F',
        button_middle: [stimulusStart[1].left + 95, stimulusStart[1].top + 95],
        touch_location: [0, 0],
        touch_time: 'STOP',
      } as IButton;

      if (btList.length === 0) {
        btList.push(button1);
        btList.push(button2);
      } else if (btList.length === 1) {
        // If index 0 is the button already in the list, add the other as missing
        if (btList[0].button_id === stimulusStart[0].label) {
          btList.push(button2);
        }
        // Else add index 0 as missing to return list
        else {
          btList.push(button1);
        }
      }
      this.sendTimedButtons(btList);
      us({ testRunning: false, buttons_timed: new Array<IButton>(), buttons: new Array<IStimulusStart>() });
    });

    this.socket.on('testReset', () => {
      let btn_1 = document.getElementById(`button-0`);
      let btn_2 = document.getElementById(`button-1`);
      btn_1 ? (btn_1.style.visibility = 'hidden') : undefined;
      btn_2 ? (btn_2.style.visibility = 'hidden') : undefined;
      us({ testRunning: false, buttons_timed: new Array<IButton>(), buttons: new Array<IStimulusStart>() });
    });

    this.socket.on('buttonTimeOut', () => {
      // First hide the buttons
      let btn_1 = document.getElementById(`button-0`);
      let btn_2 = document.getElementById(`button-1`);
      btn_1 ? (btn_1.style.visibility = 'hidden') : undefined;
      btn_2 ? (btn_2.style.visibility = 'hidden') : undefined;

      // Then add the missing buttons to the list
      let btList = states().buttons_timed;
      const stimulusStart = states().buttons;

      const button1 = {
        button_id: stimulusStart[0].label,
        button_screen: states().screenRole === ScreenRoles.NEAR ? 'N' : 'F',
        button_middle: [stimulusStart[0].left + 95, stimulusStart[0].top + 95],
        touch_location: [0, 0],
        touch_time: 'FAIL',
      } as IButton;
      const button2 = {
        button_id: stimulusStart[1].label,
        button_screen: states().screenRole === ScreenRoles.NEAR ? 'N' : 'F',
        button_middle: [stimulusStart[1].left + 95, stimulusStart[1].top + 95],
        touch_location: [0, 0],
        touch_time: 'FAIL',
      } as IButton;

      if (btList.length === 0) {
        btList.push(button1);
        btList.push(button2);
      } else if (btList.length === 1) {
        // If index 0 is the button already in the list, add the other as missing
        if (btList[0].button_id === stimulusStart[0].label) {
          btList.push(button2);
        }
        // Else add index 0 as missing to return list
        else {
          btList.push(button1);
        }
      }

      this.sendTimedButtons(btList);
      us({ buttons_timed: new Array<IButton>(), buttons: new Array<IStimulusStart>() });
    });
  }

  sendTimedButtons = (buttons: Array<IButton>) => {
    this.socket.emit('buttonsPressed', buttons);
  };
}
