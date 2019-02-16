<template>
   <div class="record-number-input">
     <el-checkbox v-model="record[field.name]"> {{ record[field.name] === true ? 'Yes' : 'No' }} </el-checkbox>
  </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>
