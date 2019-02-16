<template>
   <div class="record-number-input">
      <el-date-picker
        v-model="record[field.name]"
        type="date"
        format="yyyy-MM-dd"
        value-format="yyyy-MM-dd"
        placeholder="Pick a day">
      </el-date-picker>
  </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>
