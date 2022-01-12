import m from 'mithril';
import Stream from 'mithril/stream';
import { merge } from '../utils/mergerino';
import { FactoryComponent } from 'mithril';
import { SocketService } from './socket-service';
import { ehcState, IEHCStateActions, IEHCStateModel } from './states';
import { socketState, ISocketStateActions, ISocketStateModel } from './states/socket-state';

export interface IAppModel extends ISocketStateModel, IEHCStateModel {}

export interface IActions extends ISocketStateActions, IEHCStateActions {}

export type ModelUpdateFunction = Partial<IAppModel> | ((model: Partial<IAppModel>) => Partial<IAppModel>);

export type UpdateStream = Stream<Partial<ModelUpdateFunction>>;

export type MeiosisComponent = FactoryComponent<{
  state: IAppModel;
  actions: IActions;
}>;

const update = Stream<ModelUpdateFunction>();

const app = {
  initial: Object.assign({}, { socket: new SocketService(update) } as ISocketStateModel, ehcState.initial),
  actions: (update: UpdateStream, states: Stream<IAppModel>) =>
    Object.assign({}, socketState.actions(update, states), ehcState.actions(update, states)) as IActions,
};

export const states = Stream.scan(merge, app.initial, update);
export const actions = app.actions(update, states);

states.map((_state) => {
  m.redraw();
});
