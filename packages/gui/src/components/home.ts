import m from 'mithril';
import { IStimulusStart } from 'ehc-models-utils';
import { MeiosisComponent } from '../services';

let clickedButtons = 0;

export const HomePage: MeiosisComponent = () => ({
  view: (vnode) => {
    const { screenRole, testRunning, buttons } = vnode.attrs.state;
    const { updateTiming, sendTiming } = vnode.attrs.actions;

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
      : m('.centerText', screenRole);
  },
});
