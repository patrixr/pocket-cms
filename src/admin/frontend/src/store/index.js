import Vue from "vue";
import Vuex from "vuex";
import _ from 'lodash';
import PocketService from '../services/PocketService';

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
    authToken: null
  },
  getters: {
    schemas: getter('schemas'),
    currentUser: getter('user'),
    authToken: getter('authToken')
  },
  actions: {
    async loadSchemas(ctx) {
      const schemas = await PocketService
        .withAuth(ctx.state.authToken)
        .fetchSchemas();
      ctx.commit('setSchemas', schemas || []);
    },
    async login(ctx, { username, password }) {
      const { user, token } = await PocketService.login(username, password);
      ctx.commit('setUser', user);
      ctx.commit('setAuthToken', token);
      return user;
    },
    logout(ctx) {
      ctx.commit('clearUser');
    }
  },
  mutations: {
    setSchemas: setter('schemas'),
    setUser: setter('user'),
    setAuthToken: setter('authToken'),

    clearUser(state) {
      state.user = null;
      state.authToken = null;
    }
  }
});
