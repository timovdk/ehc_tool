import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IStimulus, ITestData, IButton } from 'ehc-models-utils';
import { shuffle, getPositions, prepareMessage, formatNumber, writeTestToCSV } from 'src/utils';

@WebSocketGateway({ cors: { origin: true } })
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private letterList = ['A', 'B', 'C', 'D'] as Array<string>
  private message_near;
  private message_far;
  private run = 1;
  private block = true;
  private current_test: Partial<ITestData>;
  private stimuli = new Array<Partial<IStimulus>>(20);

  async handleConnection(client: Socket) {
    console.log('Connected: ' + client);
    if (client.handshake.headers['type-of-client'] === 'screen') {
      let nearSockets = await this.server.in("NEAR").fetchSockets();
      nearSockets.length === 0 ? client.join("NEAR") : client.join("FAR")
      nearSockets = await this.server.in("NEAR").fetchSockets();
      const farSockets = await this.server.in("FAR").fetchSockets();
      console.log('Near: ', nearSockets.length, ', Far: ', farSockets.length)
    }
  }

  @SubscribeMessage('setRole')
  setRole(@MessageBody() data: any) {
    this.server.to('NEAR').emit('setScreenRole', 'NEAR')
    this.server.to('FAR').emit('setScreenRole', 'FAR')
  }

  // Add per test:      Start time of the test (when is the first stimulus send)
  //                    participant ID, condition and domain
  //                    List of stimuli

  // Add per stimulus:  Stimuli number (s01, 02 ...)
  //                    Start time per stimulus
  //                    List of buttons
  //                    End-time of this stimulus (time of last button press)

  // Add per button:    Far (“F”) or Near (“N”) touch screen
  //                    x-y-coordinates of middle of button
  //                    x-y-coordinates on the touch screen
  //                    Time of button press
  //                    Button (“A”, “B”, “C”, or “D”) or no button reaction (“0”) when timed out (5 sec per button)

  // Flow of stimulus:  Audio message “Look at the object in the virtual environment”
  //                    Audio signal “Beep” (10 sec after audio message)
  //                    Send message to far and near monitor
  //                    Wait for response
  //                    Log response and loop again

  @SubscribeMessage('setTestData')
  setTestData(@MessageBody() data: Partial<ITestData>) {
    this.current_test = data

    // Log the start time
    this.current_test.start_time = new Date().toISOString()
  }

  @SubscribeMessage('startTest')
  startTest() {
    // TODO: Shuffle buttons (make a list of seeds to carry out the same test multiple times!)
    this.letterList = shuffle(this.letterList)

    // Prepare both messages
    this.message_near = prepareMessage(getPositions(1920, 1080, 190, 190), this.letterList[0], this.letterList[1])
    this.message_far = prepareMessage(getPositions(1920, 1080, 190, 190), this.letterList[2], this.letterList[3])

    // Emit that server is ready to start the test
    this.server.emit('playSounds')
    // Remove the block
    this.block = false;
  }

  @SubscribeMessage('beepPlayed')
  triggerStimulus() {
    if (!this.block) {
      console.log(`Executing run S${formatNumber(this.run, 2)} for participant: ${this.current_test.participant_id}`)

      // Send the messages to the screens
      this.server.to('NEAR').emit('startTestNow', this.message_near)
      this.server.to('FAR').emit('startTestNow', this.message_far)
      this.stimuli[this.run-1] = {
        start_time: new Date().toISOString(),
        stimulus_id: `S${formatNumber(this.run, 2)}`,
      } as Partial<IStimulus>
    }
  }

  @SubscribeMessage('buttonsPressed')
  handleButtons(@MessageBody() data: Array<IButton>) {
    let currentStimulus = this.stimuli[this.run-1] as IStimulus;

    // If first set of buttons, add to list
    if (!currentStimulus.buttons || currentStimulus.buttons.length === 0) {
      console.log('First set of buttons')
      currentStimulus.buttons = data;
      this.stimuli[this.run-1] = currentStimulus;
    }
    // If second set of buttons, add to list and run test again if necessary
    else if (currentStimulus.buttons && currentStimulus.buttons.length === 2) {
      console.log('Second set of buttons')
      currentStimulus.buttons.push(...data);
      currentStimulus.end_time = new Date().toISOString();
      this.stimuli[this.run-1] = currentStimulus;

      // Run again if not last run and not blocked
      // else, abort or end the test
      if (this.run < 2 && !this.block) {
        this.run++
        this.startTest()
      }
      else if (this.block) {
        this.server.emit('testAborted')
        this.current_test.stimuli = this.stimuli
        writeTestToCSV(this.current_test)
      }
      else {
        this.server.emit('testDone', this.run)
        this.current_test.stimuli = this.stimuli
        writeTestToCSV(this.current_test)
      }
    }   
  }

  @SubscribeMessage('stopTest')
  stopTest() {
    this.block = true;
    this.server.emit('testAborted')
  }

  @SubscribeMessage('resetTest')
  resetTest() {
    this.run = 1;
    this.block = true;
    this.server.emit('testAborted')
  }
}