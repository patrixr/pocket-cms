import Vue            from "vue";
import Vuex           from "vuex";
import _              from 'lodash';
import PocketService  from '../services/PocketService';
import LocalStorage   from '../services/LocalStorage';

Vue.use(Vuex);

function setter(name) {
  return function (state, value) {
    state[name] = value;
  }
}

function getter(name) {
  return function (state) {
    return state[name];
  }
}

export default new Vuex.Store({
  state: {
    schemas: [],
    user: null,
    authToken: LocalStorage.get('authToken')
  },
  getters: {
    schemas: getter('schemas'),
    currentUser: getter('user'),
    authToken: getter('authToken')
  },
  actions: {

    async loadSchemas(ctx) {
      const schemas = await PocketService.fetchSchemas();
      ctx.commit('setSchemas', schemas || []);
    },

    async login(ctx, { username, password }) {
      const { user, token } = await PocketService.login(username, password);

      if (!_.includes(user.groups, 'admins')) {
        throw { message: 'Access Forbidden' };
      }

      ctx.commit('setUser', user);
      ctx.commit('setAuthToken', token);
      return user;
    },

    async restoreUser(ctx) {
      if (ctx.getters.currentUser) {
        return;
      }
      const user = await PocketService.getUser();

      if (user) {
        ctx.commit('setUser', user);
      }
    },

    logout(ctx) {
      ctx.commit('clearUser');
      ctx.commit('setAuthToken', null);
    }

  },
  mutations: {
    setSchemas: setter('schemas'),
    setUser: setter('user'),

    setAuthToken(state, token) {
      state.authToken = token;
      LocalStorage.set('authToken', token);
    },

    clearUser(state) {
      state.user = null;
    }
  }
});
