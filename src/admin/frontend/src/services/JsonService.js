import axios        from 'axios'
import _            from 'lodash'
import { resolve }  from 'url'

export class JsonService {

  constructor(baseUrl = "/") {
    this.baseUrl = baseUrl;
  }

  request({ path, method = 'GET', params = {}, data = {}, headers = {} }) {
    const url = resolve(this.baseUrl, path);
    return axios({
      url,
      baseURL: this.baseUrl,
      method,
      params,
      data,
      headers
    })
  }

  dataRequest({ path, method = 'GET', params = {}, data = {}, headers = {} }) {
    return this.request(...arguments)
      .then(_.property('data'))
      .catch(e => {
        throw _.get(e, 'response.data');
      });
  }

  async GET(path, params = {}, headers = {}) {
    return this.dataRequest({
      path,
      params,
      headers,
      method: 'GET',
    });
  }

  async POST(path, body = {}, headers = {}) {
    return this.dataRequest({
      path,
      headers,
      data: body,
      method: 'POST'
    });
  }

  async PUT(path, body = {}, headers = {}) {
    return this.dataRequest({
      path,
      headers,
      data: body,
      method: 'PUT'
    });
  }

  async DELETE(path, params = {}, headers = {}) {
    return this.dataRequest({
      path,
      params,
      headers,
      method: 'DELETE',
    });
  }

}