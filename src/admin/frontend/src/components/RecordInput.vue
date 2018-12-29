<template>
  <div>
    <div v-if="inputComponent">
      <component
        :is="inputComponent"
        :record="record"
        :field="field"
        class="tab"
      />
    </div>

    <div v-else class='unsupported-input'>
      Complex type - <el-button v-on:click="showRaw = !showRaw" type="text">{{ showRaw ? 'hide raw' : 'view raw' }}</el-button>
      <pre v-if="showRaw">
        {{ record[field.name] | prettyJSON }}
      </pre>
    </div>
  </div>
</template>

<script>
  import StringList     from './inputs/StringList'
  import TextField      from './inputs/TextField'
  import PasswordField  from './inputs/PasswordField'
  import NumberField    from './inputs/NumberField'
  import _              from 'lodash'

  const INPUT_MAPPING = {
    'text':       'TextField',
    'string':     'TextField',
    'number':     'NumberField',
    'password':   'PasswordField'
  };

  export default {
    props: ['record', 'field'],
    components: {
      StringList,
      TextField,
      NumberField,
      PasswordField
    },
    data() {
      let inputComponent = '';

      if (this.isStringList()) {
        inputComponent = 'StringList';
      } else {
        inputComponent = INPUT_MAPPING[this.field.type];
      }

      return {
        showRaw: false,
        inputComponent
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
        return !!_.find(['text', 'string'], (type) => {
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
