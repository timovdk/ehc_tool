Vue.component('v-select', VueSelect.VueSelect)

const app = new Vue({
    el: '#app',
    data: {
        title: 'EHC Tool',
        status: 'Open two windows (http://localhost:1234) and click Send Roles button',
        socket: null,
        participant_id: '',
        condition: '',
        domain: '',
        block: true,
        reset: false,
        run: false,
        stop: false,
        rolesSet: false,
    },
    methods: {
        setRoles() {
            this.rolesSet = true;
            this.socket.emit('setRole', 'set')
            this.status = 'Roles send, fill in test info and click Start Test to start the test'
        },
        startTest() {
            this.stop = false;
            this.reset = false;
            this.run = true;
            this.block = false
            this.status = 'Test is running'
            const message = {
                participant_id: this.participant_id,
                condition: this.condition,
                domain: this.domain,
            }
            this.socket.emit('setTestData', message)
            this.socket.emit('startTest')
        },
        stopTest() {
            this.run = false;
            this.stop = true;
            this.block = true
            this.status = 'Test stopped, click Reset Test to continue to the next test'
            this.socket.emit('stopTest')
        },
        resetTest() {
            this.run = false;
            this.stop = false;
            this.reset = true;
            this.block = true;
            this.rolesSet = false;
            this.status = 'Test reset, click Send Roles to continue to the next test'
            this.socket.emit('resetTest')
        }
    },
    created() {
        this.socket = io('http://localhost:3000', { extraHeaders: { "type-of-client": "admin" } })
        this.socket.on('playSounds', (index) => {
            this.status = 'Stimulus ' + index.toString() + ' is running'
            if (!this.block) {
                var lookAtObject = new Audio('./assets/look-at-object.mp3')
                var beep = new Audio('./assets/beep.mp3')
                lookAtObject.play()
                setTimeout(() => {
                    if (!this.block) {
                        beep.play()
                        this.socket.emit('beepPlayed')
                    }
                }, 12000)
            }
        })
        this.socket.on('testDone', () => {
            this.status = 'Test done, click Reset Test to continue to the next test'
        })
    }
})