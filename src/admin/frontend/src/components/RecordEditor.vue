<template>
  <el-container class="container" v-loading="loading">

    <!-- Resource selector on the left -->
    <el-aside class="side-panel">
      <el-menu>
          <el-menu-item v-for="(record, recordIdx) in records" :index="recordIdx.toString()" :key="record._id || 'newrecord'" @click="selectRecord(record)">
            <div v-if="!record._id">(new record)</div>
            <div v-else>{{ record | prettyRecord }}</div>
          </el-menu-item>
      </el-menu>
      <div class="options-footer">
        <el-pagination
          v-if="totalPages > 0"
          layout="prev, pager, next"
          :current-page.sync="page"
          :page-count="totalPages">
        </el-pagination>
        <el-button class="add-button" icon="el-icon-plus" @click="newRecord"></el-button>
      </div>
    </el-aside>

    <!-- Resource edition form on the right -->
    <el-main class="edit-form" v-if="editableRecord">
      <el-tabs>
        <!-- JSON Editor -->
        <el-tab-pane>
          <span slot="label"><i class="el-icon-document"></i> JSON </span>
          <div class="resource-input" v-for="field in fields" :key='field.name'>
            <div class="label">
              {{ field.name | camelToText | capitalize }}
              <span class="index-label" v-if="field.index">
                index[unique={{ field.index.unique ? 'true' : 'false' }}]
              </span>
            </div>
            <record-input :record='editableRecord' :field='field' />
          </div>
          <div>
            <el-row>
              <el-button type="success" @click='saveRecord'>Save</el-button>
              <el-popover placement="top" width="160" v-model="showDeleteConfirmation">
                <p>Are you sure ?</p>
                <div style="text-align: right; margin: 0">
                  <el-button size="mini" type="text" @click="showDeleteConfirmation = false">No</el-button>
                  <el-button type="danger" size="mini" @click="deleteRecord">YES!</el-button>
                </div>
                <el-button type="danger" slot="reference">Delete</el-button>
              </el-popover>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- File Editor -->
        <el-tab-pane v-if='!isNewRecord'>
          <span slot="label"><i class="el-icon-picture"></i> Files </span>
          <file-list :record='selectedRecord' :resource='resource' />
        </el-tab-pane>
      </el-tabs>
    </el-main>

  </el-container>
</template>

<script>
  import Vue            from 'vue'
  import PocketService  from '../services/PocketService'
  import RecordInput    from './RecordInput'
  import FileList       from './FileList'
  import { mapGetters } from "vuex"
  import _              from "lodash"
  import common         from '../mixins/common'

  export default {
    props: ['options'],
    mixins: [common],
    components: {
      RecordInput,
      FileList
    },
    data() {
      return {
        page: 1,
        records: [],
        selectedRecord: null,
        editableRecord: null,
        showDeleteConfirmation: false,
        pageSize: 25,
        totalPages: 0
      }
    },
    created() {
      this.loadPage(this.page);
    },
    computed: {
      ...mapGetters([
        "currentUser",
        "schemas",
        "authToken"
      ]),
      fields() {
        return _.find(this.schemas, ['name', this.resource]).fields;
      },
      resource() {
        return this.options.resource;
      },
      isNewRecord() {
        return this.selectedRecord && !this.selectedRecord._id;
      }
    },
    watch: {
      page(newPage) {
        this.loadPage(newPage);
      },
      options({ resource }) {
        // On resource change, we go back to the first page
        this.page = 1;
        this.selectedRecord = null;
        this.editableRecord = null;
        this.loadPage(this.page);
      }
    },
    methods: {

      selectRecord(record) {
        if (this.selectedRecord === record) {
          return;
        }
        if (this.selectedRecord && this.isNewRecord) {
          this.deleteRecord();
        }
        this.selectedRecord = record;
        this.editableRecord = _.cloneDeep(record);
      },

      newRecord() {
        const newRecord = {};
        this.records.unshift(newRecord);
        return this.selectRecord(newRecord);
      },

      async saveRecord() {
        if (!this.editableRecord) {
          return;
        }

        let savedRecord = await this.runTask(
          'Saving record',
          this.isNewRecord ?
            PocketService.createRecord(this.resource, this.editableRecord) :
            PocketService.updateRecord(this.resource, this.editableRecord._id, this.editableRecord)
        );

        const indexOfItem = this.records.indexOf(this.selectedRecord);
        Vue.set(this.records, indexOfItem, savedRecord)

        this.selectedRecord = savedRecord;
        this.editableRecord = _.cloneDeep(savedRecord);
      },

      async deleteRecord() {
        this.showDeleteConfirmation = false
        if (!this.isNewRecord) {
          await this.runTask(
            'Deleting record',
            PocketService.deleteRecord(this.resource, this.selectedRecord._id)
          );
        }
        _.pull(this.records, this.selectedRecord);
        this.selectedRecord = null;
        this.editableRecord = null;
      },

      async loadPage(page) {
        if (!this.resource || this.loading) {
          return;
        }
        const { records, meta } = await this.runTask(PocketService.fetchPage(this.resource, page, this.pageSize));
        this.records = records;
        this.totalPages = meta.totalPages;
      }
    }
  }
</script>

<style lang="scss" scoped>

  $pagination-footer-height: 72px;

  .side-panel {
    width: 200px;
    height: 100%;
    border-right: 1px solid #eee;
    position: relative;

    >ul {
      height: calc(100% - #{$pagination-footer-height});
      overflow-y: auto;
    }

    .el-menu {
      border-right: none;
    }

    .options-footer {
      width: 100%;
      height: $pagination-footer-height;
      position: absolute;
      position: sticky;
      bottom: 0;
      background: #F2F6FC;
      z-index: 1000;

      .add-button {
        width: 100%;
      }
    }
  }

  .edit-form {
    .label {
      opacity: 0.7;
      margin-bottom: 5px;

      .index-label {
        font-size: 0.8em;
        color: gray;
      }
    }

    .resource-input {
      margin-bottom: 15px;
    }
  }
</style>

