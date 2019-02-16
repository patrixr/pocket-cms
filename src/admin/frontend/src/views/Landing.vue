<template>
  <div id="landing-page">
    <el-card class="box-card">
      <!-- Title -->
      <el-row>
        <el-col :span="24">
          <h3 class="title"> Pocket Admin</h3>
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
    </el-card>

    <div class="message">
      Thank you for using Pocket. <br>
      Issues can be reported on our <a href="https://github.com/patrixr/pocket-cms">Github</a> page <br>
    </div>
  </div>
</template>

<script>
import Validator        from '../utils/validation'
import router           from '../router'
import _                from 'lodash'
import { mapGetters }   from 'vuex'
import common           from '../mixins/common'

export default {
  name: "landing",
  mixins: [ common ],
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
  mounted() {
    if (this.$route.error) {
      this.$message({
        message: this.$route.error,
        type: 'error'
      });
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
            .then(() => this.navigateTo('cms'))
            .catch((e) => this.showError(e, 'Unable to login'))
        } else {
          this.$alert('Please enter valid credentials', 'Unable to login', {
            confirmButtonText: 'OK',
            callback: _.noop
          });
          return false;
        }
      });
    }
  }
};
</script>


<style lang="scss" scoped>
  @import "../styles/colors";

  #landing-page {
    max-width: 500px;
    margin: 0 auto;
    .title {
      text-indent: 80px;
    }

    .box-card {
      margin-top: 5rem;
      padding: 2rem;
    }

    .message {
      color: $color-info;
      text-align: center;
      margin-top: 2rem;

      a {
        text-decoration: none;
      }
    }
  }
</style>
