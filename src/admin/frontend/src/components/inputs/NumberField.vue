<template>
   <div>
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

