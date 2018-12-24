import Vue from "vue";
import Router from "vue-router";
import LandingView from "../views/Landing";
import CMSView from "../views/CMS";
import Store from "../store";

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: "/",
      component: LandingView
    },
    {
      path: "/cms",
      component: CMSView,
      meta: {
        requiresAuth: true
      }
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    await Store.dispatch("restoreUser");

    const currentUser = Store.getters.currentUser;
    if (!currentUser) {
      return next({
        path: "/",
        params: { nextUrl: to.fullPath }
      });
    }
  }
  next();
});

export default router;
