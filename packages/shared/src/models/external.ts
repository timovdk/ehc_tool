export interface IStimulusEvent {
  /** Location of the confirmation stimulus */
  stimuli: string /* “left”, “right”, “bars”, “bars_top”, “bars_mid”, “bars_lower”, "none" */;
  /** Background during stimulus event */
  background: string /* “target”, “uniform” */;
}
