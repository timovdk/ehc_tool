import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IStimulus, ITestData, IButton, IStimulusStart, IStimulusEvent, IAttentionButton, IAccommodationButton } from 'ehc-models-utils';
import {
  shuffle,
  getPositions,
  prepareMessage,
  formatNumber,
  writeTestToCSV,
  getAttentionLocation,
  getBarsLocation,
  writeAccommodationTestToCSV,
} from 'src/utils';

@WebSocketGateway({ cors: { origin: true } })
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private letter_list = ['A', 'B', 'C', 'D'] as Array<string>;
  private message_near: Array<IStimulusStart>;
  private message_far: Array<IStimulusStart>;
  private run = 1;
  private run_count = 10;
  private block = true;
  private current_test: Partial<ITestData>;
  private stimuli = new Array<Partial<IStimulus>>(20);
  private received_buttons = 0;
  private attentionEvent: string;
  private attentionEvents = new Array<IAttentionButton>();
  private currentAttentionTime: string;
  private accommodationEvents = new Array<IAccommodationButton>();

  // Once GUIs connect, they are put in a NEAR and FAR group
  async handleConnection(client: Socket) {
    console.log('Connected: ' + client);
    if (client.handshake.headers['type-of-client'] === 'screen') {
      let nearSockets = await this.server.in('NEAR').fetchSockets();
      nearSockets.length === 0 ? client.join('NEAR') : client.join('FAR');
      nearSockets = await this.server.in('NEAR').fetchSockets();
      const farSockets = await this.server.in('FAR').fetchSockets();
      console.log('Near: ', nearSockets.length, ', Far: ', farSockets.length);
    }
  }

  // Once 'set role' button is clicked in demo-tool, the GUIs are activated
  @SubscribeMessage('setRole')
  setRole() {
    this.server.to('NEAR').emit('setScreenRole', 'NEAR');
    this.server.to('FAR').emit('setScreenRole', 'FAR');
  }

  // Data for this test is set
  @SubscribeMessage('setTestData')
  setTestData(@MessageBody() data: Partial<ITestData>) {
    this.run_count = data.run_count;
    this.current_test = data;

    // Log the start time
    this.current_test.start_time = new Date().toISOString();
  }

  // Test is started
  @SubscribeMessage('startTest')
  startTest() {
    // Shuffle buttons
    this.letter_list = shuffle(['A', 'B', 'C', 'D'] as Array<string>, this.run);

    // Prepare both messages
    this.message_near = prepareMessage(
      getPositions(1920, 1080, 190, 190, this.run, 'NEAR'),
      this.letter_list[0],
      this.letter_list[1]
    );
    this.message_far = prepareMessage(
      getPositions(1920, 1080, 190, 190, this.run, 'FAR'),
      this.letter_list[2],
      this.letter_list[3]
    );

    const attEv = {
      stimuli: getAttentionLocation(this.run),
      background: 'target',
    };
    // Emit event that tells the demo-tool we are ready to start with the attention test flow
    this.server.emit('playAttention', { index: this.run, attEv: attEv });

    this.block = false;
  }

  // After the instruction is played, send attention buttons to GUI
  @SubscribeMessage('attentionPlayed')
  triggerAttention(@MessageBody() attEv: IStimulusEvent) {
    if (!this.block) {
      this.attentionEvent = attEv.stimuli;
      this.server.to('NEAR').emit('attentionTest');
      this.server.to('FAR').emit('attentionTest');
      this.currentAttentionTime = new Date().toISOString();
    }
  }

  // After an attention button is pressed, emit 'playBeep' to start the coordination flow
  @SubscribeMessage('attentionTestPressed')
  handleAttentionButtons(@MessageBody() data: IAttentionButton) {
    this.server.emit('stopAttentionTest');
    if (
      (data.button_screen === 'N' && this.attentionEvent === 'left') ||
      (data.button_screen === 'F' && this.attentionEvent === 'right')
    ) {
      data.start_time = this.currentAttentionTime;
      data.correct = true;
      data.id = data.pressed;
      this.attentionEvents.push(data);
      // Start the actual test
      this.server.emit('playBeep', this.run);
    } else {
      data.start_time = this.currentAttentionTime;
      data.correct = false;
      data.id = data.pressed === '<' ? '>' : '<'; 
      this.attentionEvents.push(data);
      console.log('Attention Test Wrong!');
      this.server.emit('playBeep', this.run);
    }
  }

  // Once the beep is played, start the coordination test
  @SubscribeMessage('beepPlayed')
  triggerStimulus() {
    if (!this.block) {
      console.log(`Executing run S${formatNumber(this.run, 2)} for participant: ${this.current_test.participant_id}`);

      // Send the messages to the screens
      this.server.to('NEAR').emit('startTestNow', this.message_near);
      this.server.to('FAR').emit('startTestNow', this.message_far);
      this.stimuli[this.run - 1] = {
        start_time: new Date().toISOString(),
        stimulus_id: `S${formatNumber(this.run, 2)}`,
      } as Partial<IStimulus>;

      // Reset received buttons
      this.received_buttons = 0;

      // If there are not 4 buttons received within 5 seconds, send button time out message to time out this test.
      setTimeout(() => {
        if (this.received_buttons !== 4) {
          this.server.emit('buttonTimeOut');
        }
      }, 5000);
    }
  }

  // Each time a coordination button is pressed, this function is ran.
  // Once all buttons are pressed, they are logged and the test is started again,
  // or stopped if the number of repetitions is reached.
  @SubscribeMessage('buttonsPressed')
  handleButtons(@MessageBody() data: Array<IButton>) {
    let currentStimulus = this.stimuli[this.run - 1] as IStimulus;

    // If first set of buttons, add to list
    if (!currentStimulus.buttons || currentStimulus.buttons.length === 0) {
      console.log('First set of buttons');
      currentStimulus.buttons = data;
      this.stimuli[this.run - 1] = currentStimulus;
      this.received_buttons += 2;
    }
    // If second set of buttons, add to list and run test again if necessary
    else if (currentStimulus.buttons && currentStimulus.buttons.length === 2) {
      console.log('Second set of buttons');
      currentStimulus.buttons.push(...data);
      currentStimulus.end_time = new Date().toISOString();
      this.stimuli[this.run - 1] = currentStimulus;
      this.received_buttons += 2;

      // Run again if not last run and not blocked
      // else, abort or end the test
      if (this.run < this.run_count && !this.block) {
        this.run++;
        setTimeout(() => {
          this.startTest();
        }, 1000);
      } else if (this.block) {
        this.current_test.stimuli = this.stimuli;
        writeTestToCSV(this.current_test, this.attentionEvents);
        this.run = 1;
      } else {
        this.server.emit('testDone');
        this.current_test.stimuli = this.stimuli;
        writeTestToCSV(this.current_test, this.attentionEvents);
        this.run = 1;
      }
    }
  }

  // Stop the current test
  @SubscribeMessage('stopTest')
  stopTest() {
    this.block = true;
    this.server.emit('testStopped');
  }

  // Reset all parameters
  @SubscribeMessage('resetTest')
  resetTest() {
    this.run = 1;
    this.run_count = 10;
    this.block = true;
    this.received_buttons = 0;
    this.current_test = {} as Partial<ITestData>;
    this.stimuli = new Array<Partial<IStimulus>>(20);
    this.letter_list = ['A', 'B', 'C', 'D'] as Array<string>;
    this.message_near = [] as Array<IStimulusStart>;
    this.message_far = [] as Array<IStimulusStart>;
    this.attentionEvent = '';
    this.attentionEvents = [] as Array<IAttentionButton>;
    this.accommodationEvents = [] as Array<IAccommodationButton>;
    this.server.emit('testReset');
  }

  // Accommodation test is started
  @SubscribeMessage('startAccommodationTest')
  startAccommodationTest() {
    if (this.run === 1) {
      const attEv = {
        stimuli: getAttentionLocation(this.run),
        background: 'target',
      };
      // Emit event that tells the demo-tool we are ready to start with the attention test flow
      this.server.emit('playAccommodationSound', { index: this.run, attEv: attEv });
      this.block = false;
    } else {
      this.block = false;
      this.triggerAccommodation();
    }
  }

  @SubscribeMessage('accommodationSoundPlayed')
  triggerAccommodationAttention(@MessageBody() attEv: IStimulusEvent) {
    if (!this.block) {
      this.attentionEvent = attEv.stimuli;
      this.server.to('NEAR').emit('attentionAccommodationTest');
      this.server.to('FAR').emit('attentionAccommodationTest');
      this.currentAttentionTime = new Date().toISOString();
    }
  }

  // After an attention button is pressed, emit 'playBeep' to start the coordination flow
  @SubscribeMessage('attentionAccommodationTestPressed')
  handleAccommodationAttentionButtons(@MessageBody() data: IAttentionButton) {
    this.server.emit('stopAttentionAccommodationTest');
    if (
      (data.button_screen === 'N' && this.attentionEvent === 'left') ||
      (data.button_screen === 'F' && this.attentionEvent === 'right')
    ) {
      data.start_time = this.currentAttentionTime;
      data.correct = true;
      this.attentionEvents.push(data);
      this.run++;
      this.triggerAccommodation();
    } else {
      data.start_time = this.currentAttentionTime;
      data.correct = false;
      this.attentionEvents.push(data);
      console.log('Attention Test Wrong!');
      this.run++;
      this.triggerAccommodation();
    }
  }

  triggerAccommodation() {
    if (!this.block) {
      console.log(`Executing run ${formatNumber(this.run, 2)} for participant: ${this.current_test.participant_id}`);
      const barsLocation = getBarsLocation(this.run);
      const barsLo = {
        stimuli: barsLocation,
        background: 'uniform',
      };

      const accLo = {
        stimuli: getAttentionLocation(this.run),
        background: 'uniform',
      };

      this.server.emit('barsLocationMessage', barsLo);

      setTimeout(() => {
        this.currentAttentionTime = new Date().toISOString();
        this.server.emit('accommodationLocation', accLo)
      }, 2000);
    }
  }

  @SubscribeMessage('accommodationDirectionPressed')
  handleAccommodationPress(@MessageBody() data: IAccommodationButton) {
    data.start_time = this.currentAttentionTime;

    this.accommodationEvents.push(data)

    if (this.run < this.run_count && !this.block) {
      this.run++;
      setTimeout(() => {
        this.triggerAccommodation();
    });
    } else if (this.block) {
      writeAccommodationTestToCSV(this.current_test, this.accommodationEvents, this.attentionEvents);
      this.run = 1;
    } else {
      this.server.emit('testDone');
      writeAccommodationTestToCSV(this.current_test, this.accommodationEvents, this.attentionEvents);
      this.run = 1;
    }
  }
}
