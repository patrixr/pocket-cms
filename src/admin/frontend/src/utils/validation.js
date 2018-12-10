export default class Validator {

  constructor(fieldName) {
    this.name = fieldName;
    this.validators = [];
  }

  shouldHaveLength(min = 0, max = 0) {
    this.validators.push((value) => {
      if (min > 0 && value.length < min) {
        return new Error(`${this.name} should have a minimum of ${min} characters`);
      }
      if (max > 0 && value.length > max) {
        return new Error(`${this.name} should have a maximum of ${max} characters`);
      }
    });
    return this;
  }

  shouldExist() {
    this.validators.push((value) => {
      if (!value) {
        return new Error(`${this.name} should not be empty`);
      }
    });
    return this;
  }

  val(opts = {}) {
    const { onValidate } = opts;
    return (rule, value, callback) => {
      for (let i = 0; i < this.validators.length; ++i) {
        let error = this.validators[i](value);
        if (error) {
          callback(error);
          return;
        }
      }
      if (onValidate) {
        onValidate();
      }
      callback();
    }
  }

}

Validator.PASSWORD = new Validator('password')
  .shouldHaveLength(5)
  .shouldExist()
  .val()

Validator.USERNAME = new Validator('username')
  .shouldExist()
  .val()