import _      from 'lodash'
import router from '../router'

export default {
  data() {
    return {
      runningTasks: 0
    }
  },
  computed: {
    loading() {
      return this.runningTasks > 0;
    }
  },
  methods: {
    async runTask(desc, promise) {
      if (arguments.length === 1) {
        promise = desc;
        desc = null;
      }

      this.runningTasks++;

      try {
        const result = await promise;
        this.runningTasks--;
        if (desc) {
          this.$message({
            message: `${desc} : Done`,
            type: 'success'
          });
        }
        return result;
      } catch (e) {
        this.showError(e, 'Error');
        this.runningTasks--;
        if (desc) {
          this.$message({
            message: `${desc} : Failed`,
            type: 'error'
          });
        }
        throw e;
      }
    },

    showError(error, title = '') {
      const msg     = _.get(error, 'message', 'Something went wrong');
      const code    = _.get(error, 'code');
      const codeStr = code ? ` (${code})` : '';

      this.$alert(msg + codeStr, title, {
        confirmButtonText: 'OK',
        callback: _.noop
      });
    },

    navigateTo(page) {
      router.push(page);
    }
  }
};