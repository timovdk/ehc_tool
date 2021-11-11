import { IButton, ILogProcessedRow, ILogRawRow, IStimulus, IStimulusStart, ITestData } from 'ehc-models-utils';
import { createWriteStream } from 'fs';
import * as fastcsv from 'fast-csv'
import { Row } from '@fast-csv/format';

/**
 * Fisher Yates Shuffle
 * Taken from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
export const shuffle = (array: Array<any>) => {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export const getPositions = (width: number, height: number, bwidth: number, bheight: number) => {
  const spaceH = height - bheight;
  const spaceW = width - bwidth;
  const h1 = Math.round(Math.random() * spaceH)
  const w1 = Math.round(Math.random() * spaceW)

  let h2 = Math.round(Math.random() * spaceH)
  let w2 = Math.round(Math.random() * spaceW)
  while (
    //h2 between h1 h1+190 && w2 between w1 w1+190
    ((h1 < h2 && h2 < h1 + 190) && (w1 < w2 && w2 < w1 + 190)) ||
    //h1 between h2 h2+190 && w1 between w2 w2+190 
    ((h2 < h1 && h1 < h2 + 190) && (w2 < w1 && w1 < w2 + 190)) ||
    //h2 between h1 h1+190 && w1 between w2 w2+190
    ((h1 < h2 && h2 < h1 + 190) && (w2 < w1 && w1 < w2 + 190)) ||
    //h1 between h2 h2+190 && w1 between w2 w2+190 
    ((h2 < h1 && h1 < h2 + 190) && (w1 < w2 && w2 < w1 + 190))) {
    console.log('Error: ', h1, w1, h2, w2)
    h2 = Math.round(Math.random() * spaceH)
    w2 = Math.round(Math.random() * spaceW)
  }

  return [{ top: h1, left: w1 }, { top: h2, left: w2 }]
}

export const prepareMessage = (positions, letter_1: string, letter_2: string) => {
  return [{
    top: positions[0].top,
    left: positions[0].left,
    label: letter_1
  } as IStimulusStart,
  {
    top: positions[1].top,
    left: positions[1].left,
    label: letter_2
  } as IStimulusStart
  ] as IStimulusStart[]
}

export const formatNumber = (value: number, length: number) => {
  let num = value.toString();
  while (num.length < length) num = "0" + num;
  return num;
}

export const getPrecision = (button: [number, number], touch: [number, number]): number => {
  return Math.sqrt(Math.pow((touch[0] - button[0]), 2) + Math.pow((touch[1] - button[1]), 2));
}

export const testObjectToRawRow = (obj: Partial<ITestData>): Array<Row> => {
  let rows: Array<Row> = [];
  obj.stimuli.forEach((stimulus: IStimulus) => {
    stimulus.buttons.forEach((button: IButton) => {
      const touchPrecision = getPrecision(button.button_middle, button.touch_location)
      rows.push({
        participant_id: obj.participant_id,
        condition: obj.condition,
        domain: obj.domain,
        test_start_time: obj.start_time,
        stimulus_id: stimulus.stimulus_id,
        stimulus_start_time: stimulus.start_time,
        stimulus_end_time: stimulus.end_time,
        button_id: button.button_id,
        screen_location: button.button_screen,
        button_centre: button.button_middle,
        touch_location: button.touch_location,
        touch_time: button.touch_time,
        touch_precision: touchPrecision,
      } as ILogRawRow)
    })
  })
  return rows
}

export const getDelta = (start: string, end: string) => {
  const d1 = new Date(start);
  const d2 = new Date(end);

  const difference = (+d2 - +d1);
  console.log('Start: ', start, ' End: ', end, ' Difference: ', difference)
  return difference;
}

export const getCalculatedFields = (buttons: Array<IButton>, start_time: string) => {
  buttons.sort((a: IButton, b: IButton) => {
    return (a.touch_time < b.touch_time) ? -1 : ((a.touch_time > b.touch_time) ? 1 : 0);
  })

  const buttonOrder = [buttons[0].button_id, buttons[1].button_id, buttons[2].button_id, buttons[3].button_id] as Array<string>
  const buttonOrderCorrect = (buttonOrder[0] === "A" && buttonOrder[1] === "B" && buttonOrder[2] === "C" && buttonOrder[3] === "D") as boolean;
  const buttonOrderTouchPrecision = [getPrecision(buttons[0].button_middle, buttons[0].touch_location), getPrecision(buttons[1].button_middle, buttons[1].touch_location), getPrecision(buttons[2].button_middle, buttons[2].touch_location), getPrecision(buttons[3].button_middle, buttons[3].touch_location)] as Array<number>;
  const buttonOrderTouchTimeDeltas = [getDelta(start_time, buttons[0].touch_time), getDelta(buttons[0].touch_time, buttons[1].touch_time), getDelta(buttons[1].touch_time, buttons[2].touch_time), getDelta(buttons[2].touch_time, buttons[3].touch_time)]

  return {
    toc: buttonOrderCorrect,
    to: buttonOrder,
    tp: buttonOrderTouchPrecision,
    ttd: buttonOrderTouchTimeDeltas
  }
}

export const testObjectToProcessedRow = (obj: Partial<ITestData>): Array<Row> => {
  let rows: Array<Row> = [];
  obj.stimuli.forEach((stimulus: IStimulus) => {
    const { toc, to, tp, ttd } = getCalculatedFields(stimulus.buttons, stimulus.start_time)
    rows.push({
      participant_id: obj.participant_id,
      stimulus_id: stimulus.stimulus_id,
      stimulus_duration: getDelta(stimulus.start_time, stimulus.end_time),
      touch_order_correct: toc,
      touch_order: to,
      touch_precisions: tp,
      touch_time_deltas: ttd,
    } as ILogProcessedRow)
  })
  return rows
}

export const writeTestToCSV = (test: Partial<ITestData>) => {
  const ws_raw = createWriteStream(`raw_${test.participant_id}_${test.domain}_${test.condition}.csv`);
  fastcsv.write(testObjectToRawRow(test), { headers: true }).pipe(ws_raw)

  const ws_processed = createWriteStream(`processed_${test.participant_id}_${test.domain}_${test.condition}.csv`);
  fastcsv.write(testObjectToProcessedRow(test), { headers: true }).pipe(ws_processed)
}