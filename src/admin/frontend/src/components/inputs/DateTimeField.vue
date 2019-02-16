<template>
   <div class="record-number-input">
      <el-date-picker
        v-model="record[field.name]"
        type="datetime"
        placeholder="Pick date and time">
      </el-date-picker>
  </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>
