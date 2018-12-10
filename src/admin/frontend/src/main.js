import Vue        from 'vue'
import ElementUI  from 'element-ui'
import router     from "./router";
import store      from "./store";
import App        from './App'

import locale from 'element-ui/lib/locale/lang/en'
import './styles/main.scss'
import'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI, { locale });

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app");