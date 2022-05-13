import { IStimulus } from './coordination';

export interface ITestData {
  /** participant ID (PP001, 002 ...) */
  participant_id: string;
  /** Condition of the test (Baseline, Reference, XR-HMSD) */
  condition: string;
  /** Domain of the test (Air, Land, Maritime_motion, Maritime_static) */
  domain: string;
  /** Start time of the test (when is the first stimulus send) */
  start_time: string;
  /** List of stimuli */
  stimuli: Array<Partial<IStimulus>>;
  /** Number of stimuli */
  run_count: number;
}

/** Enum for the three roles screens can have */
export enum ScreenRoles {
  NEAR = 'NEAR',
  FAR = 'FAR',
  UNKNOWN = 'UNKNOWN',
}

/** Enum for the three statuses we use */
export enum status {
  OK = 'OK',
  FAIL = 'FAIL',
  STOP = 'STOP',
}
