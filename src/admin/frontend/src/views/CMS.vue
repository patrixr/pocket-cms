<template>
  <div class="cms-page">
    <el-container class="container">
      <Sidepanel v-bind:sections="panelSections"/>
    </el-container>
  </div>
</template>

<script>
  import _                          from "lodash";
  import router                     from "../router";
  import Sidepanel                  from "../components/SidePanel";
  import { errorCb, navigateTo }    from "../utils/callbacks";
  import { mapActions, mapGetters } from "vuex";

  const CMSView = {
    name: "cms",
    components: {
      Sidepanel
    },
    created() {
      if (!this.currentUser) {
        return router.replace("/");
      }
      this.loadSchemas();
    },
    methods: {
      ...mapActions(["loadSchemas"])
    },
    computed: {
      ...mapGetters([
        "currentUser",
        "schemas"
      ]),
      panelSections() {
        if (!this.schemas || !this.schemas.length === 0) {
          return [];
        }
        return [
          {
            name: "Resources",
            items: this.schemas.map(sch => ({ name: sch.name, key: sch.name }))
          }
        ];
      }
    }
  };
  export default CMSView;
</script>

<style lang="scss" scoped>
  .cms-page {
    height: 100%;
    .container {
      height: 100%;
    }
  }
</style>