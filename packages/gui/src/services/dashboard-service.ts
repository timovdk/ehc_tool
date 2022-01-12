import m, { RouteDefs } from 'mithril';
import { IDashboard } from '../models';
import { actions, states } from './meiosis';
import { HomePage } from '../components';

export enum Dashboards {
  HOME = 'HOME',
}

class DashboardService {
  private dashboards!: ReadonlyArray<IDashboard>;

  constructor(dashboards: IDashboard[]) {
    this.setList(dashboards);
  }

  public setList(list: IDashboard[]) {
    this.dashboards = Object.freeze(list);
  }

  public get defaultRoute() {
    const dashboard = this.dashboards.filter((d) => d.default).shift();
    return dashboard ? dashboard.route : this.dashboards[0].route;
  }

  public routingTable() {
    return this.dashboards.reduce((p, c) => {
      p[c.route] = {
        render: () => m(c.component, { state: states(), actions: actions }),
      };
      return p;
    }, {} as RouteDefs);
  }
}

export const dashboardSvc: DashboardService = new DashboardService([
  {
    id: Dashboards.HOME,
    default: true,
    hasNavBar: false,
    title: 'HOME',
    route: '/',
    visible: false,
    component: HomePage,
  },
]);
