import Vue from "vue";
import Router from "vue-router";
import LandingView from "../views/Landing";
import CMSView from "../views/CMS";
import Store from "../store";
import _ from "lodash"

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
        params: {
          nextUrl: to.fullPath
        }
      });
    } else if (!_.includes(currentUser.groups, 'admins')) {
      /**
       * Note: a non admin can technically login to the admin panel,
       * however none of the api calls that follows would work, leaving them an empty blank page.
       * We gracefully redirect them to the login page with a message.
       */
      Store.dispatch('logout');
      return next({
        path: "/",
        params: {
          nextUrl: to.fullPath,
          error: 'Access forbidden'
        }
      });
    }
  }
  next();
});

export default router;
