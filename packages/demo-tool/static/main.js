Vue.component('v-select', VueSelect.VueSelect)

const app = new Vue({
    el: '#app',
    data: {
        title: 'EHC Tool',
        status: 'Open two windows (http://localhost:1234) and click Set Roles button',
        socket: null,
        participant_id: '',
        condition: '',
        domain: '',
        block: true,
    },
    methods: {
        setRoles() {
            this.socket.emit('setRole', 'set')
            this.status = 'Roles set, fill in test info and start the test.'
        },
        startTest() {
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
            this.block = true
            this.status = 'Test aborted'
            this.socket.emit('stopTest')
        },
        resetTest() {
            this.block = true
            this.status = 'Test reset'
            this.socket.emit('resetTest')
        }
    },
    created() {
        this.socket = io('http://localhost:3000', { extraHeaders: { "type-of-client": "admin" } })
        this.socket.on('playSounds', () => {
            if (!this.block) {
                var lookAtObject = new Audio('./assets/look-at-object.mp3')
                var beep = new Audio('./assets/beep.mp3')
                lookAtObject.play()
                setTimeout(() => {
                    if (!this.block) {
                        beep.play()
                        this.socket.emit('beepPlayed')
                    }
                }, 10000)
            }
        })
        this.socket.on('testDone', () => {
            this.status = 'Test done'
        })
    }
})