export interface IAttentionTest {
  /** Whether the test was successful */
  correct: boolean;
  /** x-y-coordinates of middle of button*/
  button_middle: [number, number];
  /** x-y-coordinates on the touch screen */
  touch_location: [number, number];
  /** Reaction  time */
  reaction_time: number;
  /** Precision of the touch */
  touch_precision: number;
}

export interface IAttentionButton {
  /** Start time of attention test */
  start_time: string;
  /** Whether the test was correct or not */
  correct: boolean;
  /** Far (āFā) or Near (āNā) touch screen */
  button_screen: string;
  /** x-y-coordinates of middle of button*/
  button_middle: [number, number];
  /** x-y-coordinates on the touch screen */
  touch_location: [number, number];
  /** Time of button press */
  touch_time: string;
  /** direction */
  id: string;
  /** pressed direction */
  pressed: string;
}
