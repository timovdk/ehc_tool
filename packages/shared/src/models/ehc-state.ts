export interface IStimulusStart {
    /** Margin from top of the screen to top of the button in pixels */
    top: number,
    /** Margin from left of the screen to left of the button in pixels */
    left: number,
    /** The letter label (“A”, “B”, “C”, or “D”) */
    label: string
}

export interface IButton {
    /** Button (“A”, “B”, “C”, or “D”) or no button reaction (“0”) */
    button_id: string,
    /** Far (“F”) or Near (“N”) touch screen */
    button_screen: string,
    /** x-y-coordinates of middle of button*/
    button_middle: [number, number],
    /** x-y-coordinates on the touch screen */
    touch_location: [number, number],
    /** Time of button press */
    touch_time: string,
}
                             
export interface IStimulus {
    /** Stimuli number (s01, 02 ...) */
    stimulus_id: string,
    /** Start time per stimulus */
    start_time: string,
    /** End-time of this stimulus (time of last button press) */
    end_time: string,
    /** List of buttons */
    buttons: Array<IButton>
}

export interface ITestData {
    /** participant ID (PP001, 002 ...) */
    participant_id: string,
    /** Condition of the test (Baseline, Reference, XR-HMSD) */
    condition: string,
    /** Domain of the test (Air, Land, Maritime_motion, Maritime_static) */
    domain: string,
    /** Start time of the test (when is the first stimulus send) */
    start_time: string,
    /** List of stimuli */
    stimuli: Array<Partial<IStimulus>>
}

/** Enum for the three roles screens can have */
export enum ScreenRoles {
    NEAR = 'NEAR',
    FAR = 'FAR',
    UNKOWN = 'UNKNOWN'
}

/** Enum for the three statuses we use */
export enum status {
    OK = 'OK',
    FAIL = 'FAIL',
    STOP = 'STOP'
}

export interface ILogRawRow {
    /** participant ID (PP001, 002 ...) */
    participant_id: string,
    /** Status of this button press */
    button_status: status,
    /** Condition of the test (Baseline, Reference, XR-HMSD) */
    condition: string,
    /** Domain of the test (Air, Land, Maritime_motion, Maritime_static) */
    domain: string,
    /** Start time of the test (when is the first stimulus send) */
    test_start_time: string,
    /** Stimuli number (s01, 02 ...) */
    stimulus_id: string,
    /** Start time per stimulus */
    stimulus_start_time: string,
    /** End-time of this stimulus (time of last button press) */
    stimulus_end_time: string,  
    /** Button (“A”, “B”, “C”, or “D”) or no button reaction (“0”) */
    button_id: string,
    /** Far (“F”) or Near (“N”) touch screen */
    screen_location: string,
    /** x-y-coordinates of middle of button*/
    button_centre: [number, number],
    /** x-y-coordinates on the touch screen */
    touch_location: [number, number],
    /** Time of button press */
    touch_time: string,
    /** Button precision (distance from touch location to centre of the button in pixels)  */
    touch_precision: number,
}

export interface ILogProcessedRow {
    /** participant ID (PP001, 002 ...) */
    participant_id: string,
    /** Status of this stimulus */
    stimulus_status: status,
    /** Stimuli number (s01, 02 ...) */
    stimulus_id: string,
    /** Duration of this stimulus */
    stimulus_duration: number,
    /** Correct order */
    touch_order_correct: boolean,
    /** Button order */
    touch_order: Array<string>,
    /** Touch precisions based on the order (distance from touch location to centre of the button in pixels) */
    touch_precisions: Array<number>,
    /** Button delta's in milliseconds*/
    touch_time_deltas: Array<number>
}
