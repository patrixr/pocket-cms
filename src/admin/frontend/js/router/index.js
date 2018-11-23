import Vue from "vue";
import Router from "vue-router";
import LandingView from "../views/Landing"
import CMSView from "../views/CMS"

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      component: LandingView
    },
    {
      path: "/cms",
      component: CMSView
    },
  ]
});
