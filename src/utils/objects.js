 class ObjectWrapper {

  constructor(o) {
    this.obj = o;
  }

  computeIfAbsent(prop, defaultValue) {
    this.obj[prop] = this.obj[prop] || defaultValue;
    return this.obj[prop];
  }

 }

 export function Wrap(o) {
   return new ObjectWrapper(o);
 }