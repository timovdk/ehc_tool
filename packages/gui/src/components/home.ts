import m from 'mithril';
import { IStimulusStart } from 'ehc-models-utils';
import { MeiosisComponent } from '../services';

let clickedButtons = 0;

export const HomePage: MeiosisComponent = () => ({
  view: (vnode) => {
    const { screenRole, testRunning, buttons, attentionTestRunning } = vnode.attrs.state;
    const { updateTiming, sendTiming, attentionButtonClicked, sendAttention } = vnode.attrs.actions;

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
      : m('.centerText', screenRole);
  },
});
