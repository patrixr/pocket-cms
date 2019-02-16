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
  import StringList       from './inputs/StringList'
  import TextField        from './inputs/TextField'
  import PasswordField    from './inputs/PasswordField'
  import NumberField      from './inputs/NumberField'
  import SelectField      from './inputs/SelectField'
  import MultiSelectField from './inputs/MultiSelectField'
  import ColorField       from './inputs/ColorField'
  import TimeField        from './inputs/TimeField'
  import CheckboxField    from './inputs/CheckboxField'
  import DateField        from './inputs/DateField'
  import DateTimeField    from './inputs/DateTimeField'
  import Timestamp        from './inputs/TimestampField'
  import MapField         from './inputs/MapField'
  import _                from 'lodash'

  const INPUT_MAPPING = {
    'text':       'TextField',
    'string':     'TextField',
    'number':     'NumberField',
    'password':   'PasswordField',
    'select':     'SelectField',
    'enum':       'SelectField',
    'multiselect':'MultiSelectField',
    'color':      'ColorField',
    'boolean':    'CheckboxField',
    'checkbox':   'CheckboxField',
    'time':       'TimeField',
    'date':       'DateField',
    'datetime':   'DateTimeField',
    'timestamp':  'Timestamp'
  };

  export default {
    name: 'record-input',
    props: ['record', 'field'],
    components: {
      StringList,
      TextField,
      NumberField,
      PasswordField,
      SelectField,
      ColorField,
      CheckboxField,
      TimeField,
      DateField,
      DateTimeField,
      MultiSelectField,
      MapField,
      Timestamp
    },
    data() {
      let inputComponent = '';

      if (this.isStringList()) {
        inputComponent = 'StringList';
      } else if (this.isMap()) {
        inputComponent = 'MapField';
      } else {
        inputComponent = INPUT_MAPPING[this.field.type];
      }

      return {
        showRaw: false,
        inputComponent
      }
    },
    methods: {
      isStringList(field = this.field) {
        if (field.type !== 'array') {
          return false;
        }
        if (!field.items) {
          return false;
        }
        return !!_.find(['text', 'string'], (type) => {
          return field.items === type || field.items.type === type;
        });
      },
      isMap(field = this.field) {
        if (field.type === 'map' && field.items) {
          const itemField = _.isString(field.items) ? { type: field.items} : field.items;
          return this.isStringList(itemField) || INPUT_MAPPING[itemField.type]; // It's a map of a supported type
        }
        return false;
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
