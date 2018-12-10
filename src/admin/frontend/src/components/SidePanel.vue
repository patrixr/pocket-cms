<template>
  <el-aside class="side-panel">
    <el-menu :default-openeds="['1']">
      <el-submenu v-for="(section, sectionIdx) in sections" :index="sectionIdx.toString()" :key="sectionIdx">

        <template slot="title">
          <i class="el-icon-app"></i>
          {{ section.name }}
        </template>

        <el-menu-item v-for="(it, idx) in section.items" :index="idx.toString()" v-bind:key="it.key" >
          {{ it.name }}
        </el-menu-item>

      </el-submenu>
    </el-menu>
  </el-aside>
</template>

<script>
export default {
  props: ['sections']
}
</script>

<style lang="scss" scoped>
  .side-panel {
    width: 200px;
    height: 100%;
    border-right: 1px solid #eee;

    .el-menu {
      border-right: none;
    }
  }
</style>

