<template>
   <div class="record-number-input">
    <el-input-number
      :max="field.max || Infinity"
      :nin="field.min || Infinity"
      v-model="record[field.name]">
    </el-input-number>
  </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>

<style lang="scss">
  .record-number-input {
    .el-icon-minus, .el-icon-plus {
      line-height: 38px;
    }
  }
</style>
