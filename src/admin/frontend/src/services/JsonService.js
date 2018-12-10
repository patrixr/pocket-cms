import axios        from 'axios'
import _            from 'lodash'
import { resolve }  from 'url'

export class JsonService {

  constructor(baseUrl = "/") {
    this.baseUrl = baseUrl;
  }

  async _request({ path, method = 'GET', params = {}, data = {}, headers = {} }) {
    const url = resolve(this.baseUrl, path);
    console.log(headers);
    return axios({
      url,
      baseURL: this.baseUrl,
      method,
      params,
      data,
      headers
    })
    .then(_.property('data'))
    .catch(e => {
      throw _.get(e, 'response.data');
    });
  }

  async GET(path, params = {}, headers = {}) {
    return this._request({
      path,
      params,
      headers,
      method: 'GET',
    });
  }

  async POST(path, body = {}, headers = {}) {
    return this._request({
      path,
      headers,
      data: body,
      method: 'POST'
    });
  }

}