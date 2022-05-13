export interface ILogAccRow {
  /** id of the test */
  id: number;
  /** start time */
  start_time: string;
  /** touch time */
  touch_time: string;
  /** touch location */
  location: string;
  /** button press correct */
  correct: boolean;
}

export interface ILogProcessedRow {
  /** Stimuli number (s01, 02 ...) */
  trial_num: string;
  /** participant ID (PP001, 002 ...) */
  participant_id: string;
  /** Start time of this stimulus */
  trial_start_time: string;
  /** Condition of the test (Baseline, Reference, XR-HMSD) */
  condition: string;
  /** Domain of the test (Air, Land, Maritime_motion, Maritime_static) */
  domain: string;
  /** time that the < or > appears */
  target_onset_time: string;
  /** < or > */
  target_id: string;
  /** time that the participants press the target key */
  target_response_time: string;
  /** target key pressed (either < or >) */
  target_key_response: string;
  /** time that the buttons appear on the touch screens */
  button_onset_time: string;
  /** list of four locations corresponding to button a-d [N,F,F,N]: N (near), F (far) */
  button_locations: Array<string>;
  /** list of four centre x,y coordinates of touch a-d [(xa,ya), …, (xd,yd)] */
  button_centres: Array<[number, number]>;
  /** list of four locations corresponding to touch a-d [N,F,F,N]: N (near), F (far) */
  touch_locations: Array<string>;
  /** list of four centre x,y coordinates of touch a-d [(xa,ya), …, (xd,yd)] */
  touch_centres: Array<[number, number]>;
  /** list of four times when participants press the touch screens [t1,t2,t3,t4] */
  touch_time: Array<string>;
  /** the precision between touch and button [p1,p2,p3,p4] Note that precision is -1 if the wrong display is pressed. */
  touch_precision: Array<number>;
  /** time that the trial is finished (time of the last touch:t4) */
  trial_end_time: string;
}
