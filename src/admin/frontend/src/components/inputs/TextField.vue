<template>
   <div>
    <el-input placeholder="Text..." v-model="record[field.name]"></el-input>
  </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>

