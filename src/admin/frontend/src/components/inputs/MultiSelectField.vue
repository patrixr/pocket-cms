<template>
    <div>
      <el-select v-model="record[field.name]" filterable="" no-match-text="No match" default-first-option placeholder="Select" multiple>
        <el-option v-for="opt in field.options" :key="opt" :label="opt" :value="opt" />
      </el-select>
    </div>
</template>

<script>
export default {
  props: ['record', 'field']
}
</script>

