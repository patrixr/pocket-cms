<template>
  <div>
    <el-tag :key="text" v-for="text in list" closable :disable-transitions="false" @close="remove(text)">
      {{ text }}
    </el-tag>
    <el-input
      class="input-new-text"
      v-if="inputVisible"
      v-model="inputValue"
      ref="newTextInput"
      size="mini"
      @keyup.enter.native="handleInputConfirm"
      @blur="handleInputConfirm">
    </el-input>
    <el-button v-else class="button-new-text" size="small" @click="showInput">+ Add</el-button>
  </div>
</template>

<script>
export default {
  props: ['record', 'fieldName', 'field'],
  data() {
    return {
      inputVisible: false,
      inputValue: ''
    };
  },
  computed: {
    list() {
      if (!this.record[this.fieldName]) {
        this.record[this.fieldName] = [];
      }
      return this.record[this.fieldName];
    }
  },
  methods: {
    remove(text) {
      if (this.list.indexOf(text) >= 0) {
        this.list.splice(this.list.indexOf(text), 1);
      }
    },

    showInput() {
      this.inputVisible = true;
      this.$nextTick(_ => {
        this.$refs.newTextInput.$refs.input.focus();
      });
    },

    handleInputConfirm() {
      let inputValue = this.inputValue;
      if (inputValue) {
        this.list.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = '';
    }
  }
}
</script>
