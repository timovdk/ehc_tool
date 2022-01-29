export interface IStimulusEvent {
  /** Location of the confirmation stimulus */
  stimuli: string;
}

export interface IAttentionTest {
  /** Whether the test was successful */
  correct: boolean;
  /** x-y-coordinates of middle of button*/
  button_middle: [number, number];
  /** x-y-coordinates on the touch screen */
  touch_location: [number, number];
  /** Reaction  time */
  reaction_time: number;
}

export interface IAttentionButton {
  /** Far (“F”) or Near (“N”) touch screen */
  button_screen: string;
  /** x-y-coordinates of middle of button*/
  button_middle: [number, number];
  /** x-y-coordinates on the touch screen */
  touch_location: [number, number];
  /** Time of button press */
  touch_time: string;
}