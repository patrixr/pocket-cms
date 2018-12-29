<template>
   <div>
    <el-input placeholder="Set password..." v-model="record[field.name]" type="password"></el-input>
  </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>