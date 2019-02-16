<template>
  <el-card class="box-card">

    <div slot="header" class="clearfix">
      <div>Metadata</div>
    </div>

    <div class="data-row" v-for="(val, label) in props" :key="label">
      <div class="label">{{ label }}</div>
      <div>{{ val }} </div>
    </div>


  </el-card>
</template>

<style lang="scss" scoped>
  @import "../styles/colors";

  .data-row {
    margin-bottom: 1.5rem;
    .label {
      margin-bottom: 0.5rem;
      color: $color-main;
    }
  }
</style>


<script>
export default {
  props: ['resource', 'record'],
  computed: {
    props() {
      return {
        "Type": this.resource,
        "Id": this.record._id,
        "Created by user": this.record._createdBy || "n/a",
        "Created at":  new Date(this.record._createdAt).toString(),
        "Last update":  new Date(this.record._updatedAt).toString(),
        "Attachments": this.record._attachments.length
      }
    }
  }
}
</script>

