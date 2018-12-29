<template>
  <div class="cms-page">
    <el-container class="container">

      <!-- Side Menu -->
      <el-aside class="side-panel">
        <div class="title">Pocket CMS</div>
        <el-menu :default-openeds="['0']">
          <el-submenu v-if="section.isSection" v-for="(section, sectionIdx) in panelSections" :index="sectionIdx.toString()" :key="sectionIdx">
            <template slot="title">
              <i :class="`el-icon-${section.icon}`"></i>
              {{ section.name }}
            </template>

            <el-menu-item  v-if="!item.isSection" v-for="(item, idx) in section.items" @click="item.onClick" :index="sectionIdx.toString() + idx.toString()" :key="item.key">
              <i :class="'el-icon-' + item.icon"></i> {{ item.name }}
            </el-menu-item>
          </el-submenu>

          <el-menu-item v-if="!item.isSection" v-for="(item, idx) in panelSections" @click="item.onClick" :index="idx.toString()" :key="idx">
              <i :class="'el-icon-' + item.icon"></i> {{ item.name }}
          </el-menu-item>
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

        const SECTION = (name, icon, items) => {
          return {
            name,
            icon,
            key: name,
            isSection: true,
            items
          };
        }

        const COMPONENT_ITEM = (name, icon, component, options = {}) => {
          let item = {
            name,
            icon,
            component,
            options,
            key: name,
            isComponent: true,
            isAction: false
          };
          item.onClick = () => this.selectItem(item);
          return item;
        }

        const ACTION_ITEM = (name, icon, action) => {
          return {
            name,
            icon,
            key: name,
            onClick: action,
            isComponent: false,
            isAction: true
          };
        }

        const hasSchemas = this.schemas || this.schemas.length > 0;

        return _.compact([
          hasSchemas && SECTION('Resources', 'menu', this.schemas.map(sch => {
            return COMPONENT_ITEM(sch.name, null, 'RecordEditor', { resource: sch.name });
          })),
          COMPONENT_ITEM('Stats', 'service', 'div'),
          COMPONENT_ITEM('Logs', 'tickets', 'div'),
          COMPONENT_ITEM('API Keys', 'mobile-phone', 'div'),
          COMPONENT_ITEM('Plugins', 'share', 'div'),
          ACTION_ITEM('Logout', 'close', () => {
            this.$store.dispatch("logout");
            this.$router.replace('/');
          })
        ]);
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

        .title {
          width: 100%;
          text-align: center;
          margin-top: 10px;
          margin-bottom: 10px;
          color: gray;
        }

        .el-menu {
          border-right: none;
        }
      }
    }
  }
</style>