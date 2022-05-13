export interface IStimulusStart {
  /** Margin from top of the screen to top of the button in pixels */
  top: number;
  /** Margin from left of the screen to left of the button in pixels */
  left: number;
  /** The letter label (“A”, “B”, “C”, or “D”) */
  label: string;
}

export interface IButton {
  /** Button (“A”, “B”, “C”, or “D”) or no button reaction (“0”) */
  button_id: string;
  /** Far (“F”) or Near (“N”) touch screen */
  button_screen: string;
  /** x-y-coordinates of middle of button*/
  button_middle: [number, number];
  /** x-y-coordinates on the touch screen */
  touch_location: [number, number];
  /** Time of button press */
  touch_time: string;
}

export interface IStimulus {
  /** Stimuli number (s01, 02 ...) */
  stimulus_id: string;
  /** Start time per stimulus */
  start_time: string;
  /** End-time of this stimulus (time of last button press) */
  end_time: string;
  /** List of buttons */
  buttons: Array<IButton>;
}
