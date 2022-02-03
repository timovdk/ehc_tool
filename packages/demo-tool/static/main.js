Vue.component('v-select', VueSelect.VueSelect);

const EHC_SERVER = 'http://localhost:3000';
const UNITY_SERVER = 'ws://[IP HERE]:3000/ehc';

const app = new Vue({
  el: '#app',
  data: {
    status: 'Open two windows (http://localhost:1234) and click Send Roles button',
    socket: null,
    participant_id: '',
    condition: '',
    domain: '',
    run: false,
    rolesSet: false,
    waitForConfirmation: false,
    unitySocket: null,
    run_count: 10,
  },
  methods: {
    setRoles() {
      this.rolesSet = true;
      this.status = 'Roles send, fill in test info and click Start Test to start the test';
      this.socket.emit('setRole');
    },
    startTest() {
      if(this.waitForConfirmation) {
        // Forward the unity stimulusEvent to internal server
        this.unitySocket.addEventListener('message', (event) => {
          const data = JSON.parse(event.data)
          this.socket.emit('AttentionEvent', data.stimuli);
        });
      }
      this.run = true;
      this.status = 'Test is running';
      const message = {
        participant_id: this.participant_id,
        condition: this.condition,
        domain: this.domain,
        wait_for_confirmation: this.waitForConfirmation,
        run_count: this.run_count,
      };
      this.socket.emit('setTestData', message);
      this.socket.emit('startTest');
    },
    stopTest() {
      this.run = false;
      this.status = 'Test stopped, click Reset Test to continue to the next test';
      this.socket.emit('stopTest');
    },
    resetTest() {
      this.run = false;
      this.rolesSet = false;
      this.status = 'Test reset, click Send Roles to continue to the next test';
      this.socket.emit('resetTest');
    },
    triggerConfirmation() {
      this.socket.emit('AttentionEvent', {stimuli: 'left'});
    },
    toggleUnitySocket(checked) {
      // If not checked, reset this socket to not produce connection errors
      if (!checked) {
        this.unitySocket.close();
      } else {
        this.unitySocket = new WebSocket('ws://134.221.73.6:3000/ehc');
      }
    },
  },
  created() {
    this.socket = io(EHC_SERVER, { extraHeaders: { 'type-of-client': 'admin' } });
    this.socket.on('playSounds', (index) => {
      this.status = 'Stimulus ' + index.toString() + ' is running';
      if (this.run) {
        var lookAtObject = new Audio('./assets/look-at-object.mp3');
        var beep = new Audio('./assets/beep.mp3');
        lookAtObject.play();
        setTimeout(() => {
          if (this.run) {
            beep.play();
            this.socket.emit('beepPlayed');
          }
        }, 6000);
      }
    });
    this.socket.on('testDone', () => {
      this.status = 'Test done, click Reset Test to continue to the next test';
    });
  },
});
