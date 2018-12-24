<template>
  <div class="cms-page">
    <el-container class="container">

      <!-- Side Menu -->
      <el-aside class="side-panel">
        <el-menu :default-openeds="['0']">
          <el-submenu v-for="(section, sectionIdx) in panelSections" :index="sectionIdx.toString()" :key="sectionIdx">

            <template slot="title">
              <i class="el-icon-app"></i>
              {{ section.name }}
            </template>

            <el-menu-item v-for="(it, idx) in section.items" :index="idx.toString()" v-bind:key="it.key" v-on:click="selectItem(it)">
              {{ it.name }}
            </el-menu-item>

          </el-submenu>
        </el-menu>
      </el-aside>

      <!-- Content -->
      <el-main>
        <component
          v-if="selectedItem"
          v-bind:is="selectedItem.component"
          v-bind:options="selectedItem.options"
          class="tab"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script>
  import _                          from "lodash";
  import router                     from "../router";
  import RecordEditor             from "../components/RecordEditor";

  import { mapActions, mapGetters } from "vuex";

  const CMSView = {
    name: "cms",
    components: {
      RecordEditor
    },
    created() {
      this.loadSchemas();
    },
    methods: {
      ...mapActions(["loadSchemas"]),
      selectItem(item) {
        this.selectedItem = item;
      }
    },
    data() {
      return {
        selectedItem: null
      }
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
            items: this.schemas.map(sch => ({
              name: sch.name,
              key: sch.name,
              component: 'RecordEditor',
              options: {
                resource: sch.name
              }
            }))
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

      .el-main {
        padding: 0px;
      }

      .side-panel {
        width: 200px;
        height: 100%;
        border-right: 1px solid #eee;

        .el-menu {
          border-right: none;
        }
      }
    }
  }
</style>