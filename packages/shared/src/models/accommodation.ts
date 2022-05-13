export interface IArrow {
  /** location of the arrow, top, mid, bot */
  location: string;
  /** Direction of the arrow, left/right */
  direction: string;
}

export interface IAccommodationButton {
  /** direction of the icon*/
  arrow: IArrow;
  /** pressed direction */
  pressed_dir: string;
  /** time of press */
  time_pressed: string;
  /** start time */
  start_time?: string;
}
