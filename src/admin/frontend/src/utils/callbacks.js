import _      from 'lodash';
import router from '../router'

export function errorCb(ctx, title = '') {
  return function (error) {
    const msg = _.get(error, 'message', 'Something went wrong');
    this.$alert(msg, title, {
      confirmButtonText: 'OK',
      callback: _.noop
    });
  }.bind(ctx);
}

export function navigateTo(page) {
  return function () {
    router.push(page);
  }
}