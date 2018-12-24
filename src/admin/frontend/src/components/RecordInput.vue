<template>
  <div>
    <!-- STRING -->
    <div v-if="field.type === 'text'">
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

    <div v-else-if="field.type === 'select'">
      <el-select v-model="record[fieldName]" filterable="" no-match-text="No match" default-first-option placeholder="Select">
        <el-option v-for="opt in field.options" :key="opt" :label="opt" :value="opt" />
      </el-select>
    </div>

    <div class='unsupported-input' v-else>
      Complex type - <el-button v-on:click="showRaw = !showRaw" type="text">{{ showRaw ? 'hide raw' : 'view raw' }}</el-button>
      <pre v-if="showRaw">
        {{ record[fieldName] | prettyJSON }}
      </pre>
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
        showRaw: false,
      }
    },
    methods: {
      isStringList() {
        const field = this.field;
        if (field.type !== 'array') {
          return false;
        }
        if (!field.items) {
          return false;
        }
        return !!_.find(['text'], (type) => {
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

  pre {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
  }
</style>
