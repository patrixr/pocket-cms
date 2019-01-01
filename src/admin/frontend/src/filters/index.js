import Vue  from 'vue'
import _    from 'lodash'

const PREFERRED_TITLE_PROPS = [
  'title',
  'header',
  'name',
  'username',
  'description',
  'text',
  'label',
  'message',
  'data'
];

Vue.filter("prettyRecord", (record) => {
  const props = _.concat(PREFERRED_TITLE_PROPS, _.keys(record));
  for (var prop of props) {
    if (prop[0] != '_' && record[prop] && _.isString(record[prop])) {
      return record[prop];
    }
  }
  return record._id;
});

Vue.filter("prettyJSON", (data) => {
  return JSON.stringify(data, null, 4);
});

Vue.filter("camelToText", (text) => {
  return text.replace(/([A-Z])/g, " $1");
});

Vue.filter("capitalize", (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
});

Vue.filter("timeSince", (date) => {
    let seconds   = Math.floor((new Date() - date) / 1000);
    let interval  = Math.floor(seconds / 31536000);

    if (interval > 1) {
      return interval + " years ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + " months ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + " days ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + " hours ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
});