<template>
  <div>
    <!-- STRING -->
    <div v-if="field.type === 'string'">
      <el-input placeholder="Text..." v-model="record[fieldName]"></el-input>
    </div>

    <!-- PASSWORD -->
    <div v-else-if="field.type === 'password'">
      <el-input placeholder="Set password..." v-model="record[fieldName]" type="password"></el-input>
    </div>

    <!-- NUMBER -->
    <div v-else-if="field.type === 'number'">
      <el-input-number v-model="record[fieldName]"></el-input-number> <!-- :min="1" :max="10" -->
    </div>

    <!-- List of String -->
    <div v-else-if="isStringList()">
      <StringList v-bind:record='record' v-bind:fieldName='fieldName' v-bind:field='field' />
    </div>

    <div class='unsupported-input' v-else>
      Unsupported input ({{ field.type }})
    </div>

  </div>
</template>

<script>
  import StringList from './inputs/StringList'
  import _          from 'lodash'

  export default {
    props: ['record', 'fieldName', 'field'],
    components: {
      StringList,
      Map
    },
    data() {
      return {
        newStringItem: '',
      }
    },
    methods: {
      isStringList() {
        const field = this.field;
        if (field.type !== 'list' && field.type !== 'array') {
          return false;
        }
        if (!field.items) {
          return false;
        }
        return !!_.find(['string', 'text'], (type) => {
          return field.items === type || field.items.type === type;
        });
      }
    }
  }
</script>


<style lang="scss" scoped>
  .unsupported-input {

    color: gray;
    font-size: 0.8rem;
    text-indent: 1em;
  }
</style>
