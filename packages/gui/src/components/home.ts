import m from 'mithril';
import { IStimulusStart } from 'ehc-models-utils';
import { MeiosisComponent } from '../services';

let clickedButtons = 0;

export const HomePage: MeiosisComponent = () => ({
  view: (vnode) => {
    const {
      screenRole,
      testRunning,
      buttons,
      attentionTestRunning,
      attentionAccommodationTestRunning,
      accommodationTestRunning,
      accommodationArrow,
      showBars,
      bars
    } = vnode.attrs.state;
    const {
      updateTiming,
      sendTiming,
      attentionButtonClicked,
      sendAttention,
      sendAccommodationAttention,
      sendAccommodationTest,
    } = vnode.attrs.actions;

    return testRunning
      ? buttons.map((s: IStimulusStart, index: number) => {
          return m(
            `div.ehc-div-parent#button-${index}`,
            {
              style: {
                top: s.top + 'px',
                left: s.left + 'px',
              },
            },
            m(
              `.btn.ehc-button`,
              {
                onclick: (e: PointerEvent) => {
                  updateTiming(e.x, e.y, s);
                  clickedButtons++;
                  if (clickedButtons === 2) {
                    sendTiming();
                    clickedButtons = 0;
                  }
                  let btn = document.getElementById(`button-${index}`);
                  btn ? (btn.style.visibility = 'hidden') : undefined;
                },
              },
              m('div.ehc-div', m('span.ehc-span', s.label))
            )
          );
        })
      : attentionTestRunning
      ? m(
          `div.ehc-div-parent#button-attention`,
          {
            style: {
              top: '445px',
              left: '865px',
            },
          },
          m(
            `.btn.attention-button`,
            {
              onclick: (e: PointerEvent) => {
                attentionButtonClicked(e.x, e.y);
                sendAttention();
                let btn = document.getElementById(`button-attention`);
                btn ? (btn.style.visibility = 'hidden') : undefined;
              },
            },
            m('div', m('span.ehc-span', screenRole === 'NEAR' ? 'LEFT' : 'RIGHT'))
          )
        )
      : attentionAccommodationTestRunning
      ? m(
          `div.ehc-div-parent#button-attention-acc`,
          {
            style: {
              top: '445px',
              left: '865px',
            },
          },
          m(
            `.btn.attention-button`,
            {
              onclick: (e: PointerEvent) => {
                attentionButtonClicked(e.x, e.y);
                sendAccommodationAttention();
                let btn = document.getElementById(`button-attention-acc`);
                btn ? (btn.style.visibility = 'hidden') : undefined;
              },
            },
            m('div', m('span.ehc-span', screenRole === 'NEAR' ? 'LEFT' : 'RIGHT'))
          )
        )
      : accommodationTestRunning && screenRole === 'NEAR'
      ? [
          m(
            `div.ehc-div-parent#button-acc-direction-left`,
            {
              style: {
                top: '0px',
                left: '0px',
              },
            },
            m(
              `.btn.acc-dir`,
              {
                onclick: () => {
                  sendAccommodationTest('left', accommodationArrow, new Date().toISOString());
                },
              },
              m('div', m('span.acc-span', '←'))
            )
          ),
          screenRole === accommodationArrow.location
            ? m(
                'div.acc-dir-span',
                { style: { 'margin-top': '500px', 'margin-left': '865px' } },
                accommodationArrow.direction === 'left' ? '<' : '>'
              )
            : undefined,
          m(
            `div.ehc-div-parent#button-acc-direction-right`,
            {
              style: {
                top: '0px',
                left: '1731px',
              },
            },
            m(
              `.btn.acc-dir`,
              {
                onclick: () => {
                  sendAccommodationTest('right', accommodationArrow, new Date().toISOString());
                },
              },
              m('div', m('span.acc-span', '→'))
            )
          ),
        ]
      : accommodationTestRunning
      ? screenRole === accommodationArrow.location
        ? m(
            'div.acc-dir-span',
            { style: { 'margin-top': '500px', 'margin-left': '865px' } },
            accommodationArrow.direction === 'left' ? '<' : '>'
          )
        : undefined
      : showBars ? [
        bars.stimuli === 'bars_top' ? m('hr', {style: {border: '1px solid white', 'margin-top': '200px'}}) : undefined,
        bars.stimuli === 'bars_mid' ? m('hr', {style: {border: '1px solid white', 'margin-top': '510px'}}) : undefined,
        bars.stimuli === 'bars_lower' ? m('hr', {style: {border: '1px solid white', 'margin-top': '710px'}}) : undefined,
      ]
      : m('.centerText', screenRole);
  },
});
