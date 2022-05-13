import {
  IAccommodationButton,
  IAttentionButton,
  IButton,
  ILogAccRow,
  ILogProcessedRow,
  IStimulus,
  IStimulusStart,
  ITestData,
} from 'ehc-models-utils';
import { createWriteStream } from 'fs';
import * as fastcsv from 'fast-csv';
import { Row } from '@fast-csv/format';
const seedrandom = require('seedrandom');

/**
 * Fisher Yates Shuffle
 * Taken from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
export const shuffle = (array: Array<any>, index: number) => {
  let currentIndex = array.length,
    randomIndex;
  const rng = seedrandom(index.toString());

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(rng() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
};

export const getPositions = (
  width: number,
  height: number,
  bwidth: number,
  bheight: number,
  index: number,
  location: string
) => {
  const spaceH = height - bheight;
  const spaceW = width - bwidth;

  const rng0 = seedrandom(index.toString() + '1' + location),
    rng1 = seedrandom(index.toString() + '2' + location);
  let rng2 = seedrandom(index.toString() + '3' + location),
    rng3 = seedrandom(index.toString() + '4' + location);

  const h1 = Math.round(rng0() * spaceH);
  const w1 = Math.round(rng1() * spaceW);

  let h2 = Math.round(rng2() * spaceH);
  let w2 = Math.round(rng3() * spaceW);
  while (
    //h2 between h1 h1+190 && w2 between w1 w1+190
    (h1 < h2 && h2 < h1 + 190 && w1 < w2 && w2 < w1 + 190) ||
    //h1 between h2 h2+190 && w1 between w2 w2+190
    (h2 < h1 && h1 < h2 + 190 && w2 < w1 && w1 < w2 + 190) ||
    //h2 between h1 h1+190 && w1 between w2 w2+190
    (h1 < h2 && h2 < h1 + 190 && w2 < w1 && w1 < w2 + 190) ||
    //h1 between h2 h2+190 && w1 between w2 w2+190
    (h2 < h1 && h1 < h2 + 190 && w1 < w2 && w2 < w1 + 190)
  ) {
    rng2 = seedrandom(index.toString() + '3' + location + 'bad');
    rng3 = seedrandom(index.toString() + '4' + location + 'bad');
    h2 = Math.round(rng2() * spaceH);
    w2 = Math.round(rng3() * spaceW);
  }

  return [
    { top: h1, left: w1 },
    { top: h2, left: w2 },
  ];
};

export const prepareMessage = (positions, letter_1: string, letter_2: string) => {
  return [
    {
      top: positions[0].top,
      left: positions[0].left,
      label: letter_1,
    } as IStimulusStart,
    {
      top: positions[1].top,
      left: positions[1].left,
      label: letter_2,
    } as IStimulusStart,
  ] as IStimulusStart[];
};

export const formatNumber = (value: number, length: number) => {
  let num = value.toString();
  while (num.length < length) num = '0' + num;
  return num;
};

export const getPrecision = (button: [number, number], touch: [number, number]): number => {
  return Math.sqrt(Math.pow(touch[0] - button[0], 2) + Math.pow(touch[1] - button[1], 2));
};

export const getDelta = (start: string, end: string) => {
  const d1 = new Date(start);
  const d2 = new Date(end);

  const difference = +d2 - +d1;
  return difference;
};

export const getCalculatedFields = (buttons: Array<IButton>, start_time: string) => {
  buttons.sort((a: IButton, b: IButton) => {
    return a.touch_time < b.touch_time ? -1 : a.touch_time > b.touch_time ? 1 : 0;
  });

  const touchScreens = [
    buttons[0].button_screen,
    buttons[1].button_screen,
    buttons[2].button_screen,
    buttons[3].button_screen,
  ] as Array<string>

  const touchLocations = [
    buttons[0].button_middle,
    buttons[1].button_middle,
    buttons[2].button_middle,
    buttons[3].button_middle,
  ] as Array<[number, number]>

  const touchTimes = [
    buttons[0].touch_time,
    buttons[1].touch_time,
    buttons[2].touch_time,
    buttons[3].touch_time,
  ] as Array<string>

  const buttonOrderTouchPrecision = [
    buttons[0].button_id === 'A' && buttons[0].touch_time !== 'FAIL' ? getPrecision(buttons[0].button_middle, buttons[0].touch_location) : -1,
    buttons[1].button_id === 'B' && buttons[1].touch_time !== 'FAIL' ? getPrecision(buttons[1].button_middle, buttons[1].touch_location) : -1,
    buttons[2].button_id === 'C' && buttons[2].touch_time !== 'FAIL' ? getPrecision(buttons[2].button_middle, buttons[2].touch_location) : -1,
    buttons[3].button_id === 'D' && buttons[3].touch_time !== 'FAIL' ? getPrecision(buttons[3].button_middle, buttons[3].touch_location) : -1,
  ] as Array<number>;

  buttons.sort((a: IButton, b: IButton) => {return a.button_id.localeCompare(b.button_id)})

  const buttonScreens = [
    buttons[0].button_screen,
    buttons[1].button_screen,
    buttons[2].button_screen,
    buttons[3].button_screen,
  ] as Array<string>

  const buttonLocations = [
    buttons[0].button_middle,
    buttons[1].button_middle,
    buttons[2].button_middle,
    buttons[3].button_middle,
  ] as Array<[number, number]>

  return {
    bs: buttonScreens,
    bls: buttonLocations,
    ts: touchScreens,
    tls: touchLocations,
    tts: touchTimes,
    tp: buttonOrderTouchPrecision,
  };
};

export const testObjectToProcessedRow = (obj: Partial<ITestData>, att: Array<IAttentionButton>): Array<Row> => {
  let rows: Array<Row> = [];
  obj.stimuli.forEach((stimulus: IStimulus, index: number) => {
    const { bs, bls, ts, tls, tts, tp } = getCalculatedFields(stimulus.buttons, stimulus.start_time);
    rows.push({
      trial_num: stimulus.stimulus_id,
      participant_id: obj.participant_id,
      trial_start_time: obj.start_time,
      condition: obj.condition,
      domain: obj.domain,
      target_onset_time: att[index].start_time,
      target_id: att[index].id,
      target_response_time:	att[index].touch_time,
      target_key_response: att[index].pressed,
      button_onset_time: stimulus.start_time,
      button_locations: bs,
      button_centres: bls,
      touch_locations: ts,
      touch_centres: tls,
      touch_time:	tts,
      touch_precision: tp,
      trial_end_time:	new Date().toISOString(),
    } as ILogProcessedRow);
  });
  return rows;
};

export const accObjectToProcessedRow = (obj: Partial<ITestData>, acc: Array<IAccommodationButton>, att: Array<IAttentionButton>): Array<Row> => {
  let rows: Array<Row> = [];
  rows.push({
    id: -1,
    start_time: att[0].start_time,
    touch_time: att[0].touch_time,
    location: att[0].button_screen,
    correct: att[0].correct,    
  } as ILogAccRow)
  acc.forEach((btn: IAccommodationButton, index: number) => {
    rows.push({
      id: index,
      start_time: btn.start_time,
      touch_time: btn.time_pressed,
      location: btn.arrow.location,
      correct: btn.pressed_dir === btn.arrow.direction,
    } as ILogAccRow);
  });
  return rows;
};

export const writeTestToCSV = (test: Partial<ITestData>, attentionTest: Array<IAttentionButton>) => {
  const ws_processed = createWriteStream(
    `./data/coordination_${test.participant_id}_${test.domain}_${test.condition}.csv`
  );
  fastcsv.write(testObjectToProcessedRow(test, attentionTest), { headers: true }).pipe(ws_processed);
};

export const writeAccommodationTestToCSV = (test: Partial<ITestData>, accommodationTest: Array<IAccommodationButton>, attentionTest: Array<IAttentionButton>) => {
  const ws_processed = createWriteStream(
    `./data/accommodation_${test.participant_id}_${test.domain}_${test.condition}.csv`
  );
  fastcsv.write(accObjectToProcessedRow(test, accommodationTest, attentionTest), { headers: true }).pipe(ws_processed);
};

export const getAttentionLocation = (index: number) => {
  const rng = seedrandom(index.toString());
  return Math.round(rng() * 10) % 2 === 0 ? 'left' : 'right';
};

export const getBarsLocation = (index: number) => {
  const rng = seedrandom(index.toString());
  const num = Math.round(rng() * 10) 
  return num % 3 === 0 ? 'bars_top' : num % 3 === 1 ? 'bars_mid' : 'bars_lower';
};
