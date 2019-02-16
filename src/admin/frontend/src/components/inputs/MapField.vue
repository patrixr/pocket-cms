<template>
  <div class="map-field">
    <el-table
      :data="tableData"
      style="width: 100%">

      <el-table-column
        label=""
        align="center"
        width="70">
        <template slot-scope="scope">
          <el-button plain circle icon="el-icon-delete" @click="remove(scope.row.obj, scope.row.key)"></el-button>
        </template>
      </el-table-column>

      <el-table-column
        label="Key"
        width="180">
        <template slot-scope="scope">
          <span class="key-label">{{ scope.row.key }}</span>
        </template>
      </el-table-column>

      <el-table-column
        label="Value">
        <template slot-scope="scope">
          <record-input :record="scope.row.obj" :field="scope.row.field"></record-input>
        </template>
      </el-table-column>
    </el-table>
    <el-row class="bottom-controls">
      <el-col :span="6">
        <el-input
          placeholder="New key"
          suffix-icon="el-icon-edit"
          v-model="newKey">
        </el-input>
      </el-col>
      <el-col :span="6">
        <el-button @click="insert()" :disabled="!newKey || obj[newKey]">+ new</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  import _ from 'lodash'
  import Vue from 'vue'

  export default {
    props: ['record', 'field'],
    name: 'map-field',
    data() {
      return {
        newKey: "",
      };
    },
    beforeCreate: function () {
      this.$options.components.RecordInput = require('../RecordInput.vue').default
    },
    computed: {
      tableData() {
        const obj = this.obj;
        return _.keys(obj).map(key => {
          let field = _.isString(this.field.items) ? { type: this.field.items } : { ...this.field.items };
          field.name = key;
          return { key, obj, field };
        });
      },
      obj() {
        return this.record[this.field.name];
      }
    },
    methods: {
      remove(obj, key) {
        Vue.delete(obj, key);
      },
      insert() {
        if (this.newKey && !_.has(this.obj, this.newKey)) {
          this.$set(this.obj, this.newKey, null);
          this.newKey = "";
        }
      }
    }
  }
</script>

<style lang="scss">
  .map-field {
    .key-label {
      font-size: 1.2rem;
    }
    .bottom-controls {
      margin: 1rem 1rem;
      margin-bottom: 2.5rem;
    }
    .el-table__empty-block {
      height: inherit;
    }
  }
</style>

