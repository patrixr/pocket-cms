<template>
   <div class="record-number-input">
      <el-date-picker
        v-model="record[field.name]"
        type="datetime"
        value-format="timestamp"
        placeholder="Pick a moment">
      </el-date-picker>
  </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>
