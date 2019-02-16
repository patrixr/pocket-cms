<template>
   <div class="record-number-input">
     <el-color-picker v-model="record[field.name]"></el-color-picker>
  </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>
