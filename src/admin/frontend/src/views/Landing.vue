<template>
  <div id="landing-page">
    <!-- Title -->
    <el-row>
      <el-col :span="24">
        <h2 class="title"> Pocket </h2>
      </el-col>
    </el-row>

    <!-- Form -->
    <el-form
      :model="formData"
      status-icon
      :rules="validationRules"
      ref="loginForm"
      label-width="80px"
      class="login-form"
    >
      <!-- Username Input -->
      <el-form-item label="Username" prop="username">
        <el-input v-model="formData.username"></el-input>
      </el-form-item>

      <!-- Password Input -->
      <el-form-item label="Password" prop="password">
        <el-input type="password" v-model="formData.password" autocomplete="off"></el-input>
      </el-form-item>

      <!-- Submit -->
      <el-form-item>
        <el-button type="primary" @click="login">
          Log in
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import Validator        from '../utils/validation'
import router           from '../router'
import _                from 'lodash'
import { mapGetters }   from 'vuex'
import {
  errorCb,
  navigateTo
} from '../utils/callbacks'

export default {
  name: "landing",
  data() {
    return {
      formData: {
        username: '',
        password: ''
      },
      validationRules: {
        password: [{
          trigger: ['blur', 'change'],
          validator: Validator.PASSWORD
        }],
        username: [{
          trigger: ['blur', 'change'],
          validator: Validator.USERNAME
        }]
      }
    }
  },
  computed: {
    ...mapGetters([
      'currentUser'
    ]),
    isLoggedIn() {
      return !!this.currentUser
    }
  },
  methods: {
    login() {
      this.$refs['loginForm'].validate(valid => {
        if (valid) {
          this.$store.dispatch("login", this.formData)
            .then(navigateTo('cms'))
            .catch(errorCb(this, 'Unable to login'))
        } else {
          this.$alert('Please enter valid credentials', 'Unable to login', {
            confirmButtonText: 'OK',
            callback: _.noop
          });
          return false;
        }
      });
    }
  },
  created() {
    if (this.isLoggedIn) {
      return router.replace('/cms');
    }
  }
};
</script>


<style lang="scss" scoped>
  #landing-page {
    max-width: 500px;
    margin: 0 auto;
    .title {
      text-indent: 80px;
    }
  }
</style>
