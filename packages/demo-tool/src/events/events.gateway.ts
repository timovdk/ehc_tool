import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  IStimulus,
  ITestData,
  IButton,
  IStimulusStart,
  IStimulusEvent,
  IAttentionButton,
} from 'ehc-models-utils';
import { shuffle, getPositions, prepareMessage, formatNumber, writeTestToCSV, writeConfirmationToCSV } from 'src/utils';

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
  private wait_for_conf = false;
  private attentionEvent: string;

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

  @SubscribeMessage('setRole')
  setRole() {
    this.server.to('NEAR').emit('setScreenRole', 'NEAR');
    this.server.to('FAR').emit('setScreenRole', 'FAR');
  }

  @SubscribeMessage('setTestData')
  setTestData(@MessageBody() data: Partial<ITestData>) {
    this.run_count = data.run_count;
    this.current_test = data;
    data.wait_for_confirmation ? (this.wait_for_conf = data.wait_for_confirmation) : undefined;

    // Log the start time
    this.current_test.start_time = new Date().toISOString();
  }

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

    // Emit that server is ready to start the test and we do not have to wait for confirmation
    // This emit calls the laptop to play the sounds
    // When sounds have played, the laptop emits a 'beep played' message
    !this.wait_for_conf ? this.server.emit('playSounds', this.run) : undefined;
    // Remove the block
    this.block = false;
  }

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
        this.startTest();
      } else if (this.block) {
        this.current_test.stimuli = this.stimuli;
        writeTestToCSV(this.current_test);
        this.run = 1;
      } else {
        this.server.emit('testDone');
        this.current_test.stimuli = this.stimuli;
        writeTestToCSV(this.current_test);
        this.run = 1;
      }
    }
  }

  @SubscribeMessage('stopTest')
  stopTest() {
    this.block = true;
    this.server.emit('testStopped');
  }

  @SubscribeMessage('resetTest')
  resetTest() {
    this.run = 1;
    this.run_count = 10;
    this.block = true;
    this.received_buttons = 0;
    this.current_test = {} as Partial<ITestData>;
    this.stimuli = new Array<Partial<IStimulus>>(20);
    this.wait_for_conf = false;
    this.letter_list = ['A', 'B', 'C', 'D'] as Array<string>;
    this.message_near = [] as Array<IStimulusStart>;
    this.message_far = [] as Array<IStimulusStart>;
    this.attentionEvent = '';
    this.server.emit('testReset');
  }

  @SubscribeMessage('AttentionEvent')
  runStimulusEvent(@MessageBody() attEv: IStimulusEvent) {
    console.log('run');
    this.attentionEvent = attEv.stimuli;
    this.server.to('NEAR').emit('attentionTest');
    this.server.to('FAR').emit('attentionTest');
  }

  @SubscribeMessage('attentionTestPressed')
  handleAttentionButtons(@MessageBody() data: IAttentionButton) {
    this.server.emit('stopAttentionTest');
    if (
      (data.button_screen === 'N' && this.attentionEvent === 'left') ||
      (data.button_screen === 'F' && this.attentionEvent === 'right')
    ) {
      writeConfirmationToCSV(data, this.current_test);
      // Start the actual test
      this.wait_for_conf = false;
      this.server.emit('playSounds', this.run);
    } else {
      console.log('Attention Test Wrong!')
    }
  }
}
