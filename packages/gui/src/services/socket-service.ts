import { io, Socket } from 'socket.io-client';
import { IArrow, IAttentionButton, IButton, IStimulusEvent, IStimulusStart, ScreenRoles } from 'ehc-models-utils';
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
      us({ testRunning: true, buttons: data, sendData: false });
      let btn_1 = document.getElementById(`button-0`);
      let btn_2 = document.getElementById(`button-1`);
      btn_1 ? (btn_1.style.visibility = '') : undefined;
      btn_2 ? (btn_2.style.visibility = '') : undefined;
    });

    this.socket.on('testStopped', () => {
      // First hide the buttons
      let btn_1 = document.getElementById(`button-0`);
      let btn_2 = document.getElementById(`button-1`);
      let btn_3 = document.getElementById(`button-attention`);
      btn_1 ? (btn_1.style.visibility = 'hidden') : undefined;
      btn_2 ? (btn_2.style.visibility = 'hidden') : undefined;
      btn_3 ? (btn_3.style.visibility = 'hidden') : undefined;

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
      us({
        testRunning: false,
        buttons_timed: new Array<IButton>(),
        buttons: new Array<IStimulusStart>(),
        sendData: true,
      });
    });

    this.socket.on('testReset', () => {
      let btn_1 = document.getElementById(`button-0`);
      let btn_2 = document.getElementById(`button-1`);
      let btn_3 = document.getElementById(`button-attention`);
      btn_1 ? (btn_1.style.visibility = 'hidden') : undefined;
      btn_2 ? (btn_2.style.visibility = 'hidden') : undefined;
      btn_3 ? (btn_3.style.visibility = 'hidden') : undefined;
      us({
        testRunning: false,
        buttons_timed: new Array<IButton>(),
        buttons: new Array<IStimulusStart>(),
        attentionButton: {} as IAttentionButton,
        attentionTestRunning: false,
        sendData: false,
        accommodationArrow: {} as IArrow,
        attentionAccommodationTestRunning: false,
        accommodationTestRunning: false,
        showBars: false,
      });
    });

    this.socket.on('buttonTimeOut', () => {
      // If data was not already send, send fail button messages
      if (!states().sendData) {
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
        us({ buttons_timed: new Array<IButton>(), buttons: new Array<IStimulusStart>(), sendData: true });
      }
    });

    this.socket.on('attentionTest', () => {
      let btn_1 = document.getElementById(`button-attention`);
      btn_1 ? (btn_1.style.visibility = '') : undefined;
      us({ testRunning: false, attentionTestRunning: true, attentionButton: {} as IAttentionButton });
    });

    this.socket.on('stopAttentionTest', () => {
      let btn_1 = document.getElementById(`button-attention`);
      btn_1 ? (btn_1.style.visibility = 'hidden') : undefined;
      us({ attentionTestRunning: false, attentionButton: {} as IAttentionButton });
    });

    this.socket.on('barsLocationMessage', (data: IStimulusEvent) => {
      us({
        accommodationArrow: {
          location: data.stimuli === 'bars_lower' ? 'NEAR' : data.stimuli === 'bars_mid' ? 'FAR' : 'UNITY',
        },
        showBars: true,
        bars: data,
        accommodationTestRunning: false
      });
    });

    this.socket.on('attentionAccommodationTest', () => {
      let btn_1 = document.getElementById(`button-attention-acc`);
      btn_1 ? (btn_1.style.visibility = '') : undefined;
      us({
        testRunning: false,
        attentionTestRunning: false,
        attentionAccommodationTestRunning: true,
        attentionButton: {} as IAttentionButton,
      });
    });

    this.socket.on('stopAttentionAccommodationTest', () => {
      let btn_1 = document.getElementById(`button-attention-acc`);
      btn_1 ? (btn_1.style.visibility = 'hidden') : undefined;
      us({ attentionAccommodationTestRunning: false, attentionButton: {} as IAttentionButton });
    });

    this.socket.on('accommodationLocation', (data) => {
      us({ showBars: false, accommodationTestRunning: true, accommodationArrow: { direction: data.stimuli } });
    });

    this.socket.on('testDone', () => {
      us({accommodationTestRunning: false, accommodationArrow: { } as IArrow})
    })
  }

  sendTimedButtons = (buttons: Array<IButton>) => {
    this.socket.emit('buttonsPressed', buttons);
  };

  sendAttentionTestButtons = (button: IAttentionButton) => {
    this.socket.emit('attentionTestPressed', button);
  };

  sendAccommodationAttentionTestButtons = (button: IAttentionButton) => {
    this.socket.emit('attentionAccommodationTestPressed', button);
  };

  sendAccommodationTest = (dir: string, arrow: IArrow, time_pressed: string) => {
    this.socket.emit('accommodationDirectionPressed', { pressed_dir: dir, arrow: arrow, time_pressed: time_pressed });
  };
}
