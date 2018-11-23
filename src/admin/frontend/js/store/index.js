import Vue from "vue";
import Vuex from "vuex";
import { 
  LOAD_SCHEMAS 
} from "./actions.type";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    schemas: []
  },
  getters: {
    schemas(state) {
      return state.schemas;
    }
  },
  actions: {
    [LOAD_SCHEMAS](context, { schemas }) {
      context.commit('setSchemas', []);
    }
  },
  mutations: {
    setSchemas(state, schemas) {
      state.schemas = schemas;
    }
  }
});
