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

Vue.filter("camelToText", (text) => {
  return text.replace(/([A-Z])/g, " $1");
});

Vue.filter("capitalize", (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
});