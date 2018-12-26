<template>
  <div class="resource-attachment-editor">
    <div>
      <el-input
        placeholder="Please input attachment name"
        v-model="fieldName"
        class="input-with-select">
        <el-button slot="append" icon="el-icon-plus" @click="showUploadDialog">Attach new file</el-button>
      </el-input>
    </div>

    <!-- File list -->
    <el-upload
      class="upload-list"
      :file-list="fileList"
      :on-remove="onRemove"
      action=""
      list-type="picture">
    </el-upload>

    <!-- Drop zone -->
    <el-dialog title="Upload" :visible.sync="uploadDialogVisible">
      <el-upload
        class="upload-zone"
        drag
        :headers="headers"
        :name="fieldName"
        :action="actionUrl"
        :on-success="onSuccess"
        :file-list="[]">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script>
  import config         from '../config'
  import { resolve }    from 'url'
  import PocketService  from '../services/PocketService'
  import common         from '../mixins/common'
  import _              from 'lodash'

  export default {
    props: ['record', 'resource'],
    mixins: [common],
    computed: {
      fileList() {
        return this.record
          ._attachments
          .map(att => ({
            name: att.name,
            url: this.attachmentUrl(att),
            attachment: att,
            id: att.id
          }));
      },
      actionUrl() {
        return resolve(config.baseUrl, `/rest/${this.resource}/${this.record._id}/attachments`);
      },
      headers() {
        return PocketService.headers;
      }
    },
    data() {
      return {
        fieldName: '',
        uploadDialogVisible: false
      };
    },
    methods: {
      attachmentUrl(att) {
        return resolve(config.baseUrl, `/rest/${this.resource}/${this.record._id}/attachments/${att.id}`);
      },
      showUploadDialog() {
        if (this.fieldName.length === 0) {
          return this.$message({
            message: `Attachment name is required`,
            type: 'error'
          });
        }

        this.uploadDialogVisible = true;
      },
      hideUploadDialog() {
        this.uploadDialogVisible = false;
      },
      async onRemove({ attachment }){
        await this.runTask(
          'Deleting attachment',
          PocketService.deleteAttachment(this.resource, this.record, attachment.id)
        );
        _.remove(this.record._attachments, att => att.id === attachment.id);
      },
      async onSuccess(updatedRecord) {
        _.each(updatedRecord._attachments, (att) => {
          if (!_.find(this.record._attachments, ['id', att.id])) {
            this.record._attachments.push(att);
          }
        });
      }
    }
  }
</script>


<style lang="scss">
  .resource-attachment-editor {
    .input-field-name {
      max-width: 150px;
    }
    .el-dialog {
      .el-upload-list {
        max-height: 120px;
      }
      .upload-zone {
        color: green;
        .el-upload {
          width: 100%;
          color: red;
          .el-upload-dragger {
            width: 100%;
          }
        }
      }
    }
  }
</style>
