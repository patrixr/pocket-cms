import { JsonService }  from "./JsonService"
import config           from '../config'
import Store            from "../store"
import _                from "lodash"

function ID(record) {
  return _.isString(record) ? record : record._id;
}

class PocketService extends JsonService {
  constructor() {
    super(config.baseUrl);
  }

  get authToken() {
    return Store.getters.authToken;
  }

  get headers() {
    if (!this.authToken) {
      return {};
    }
    return {
      'authorization': `Bearer ${this.authToken}`
    };
  }

  async login(username, password) {
    return this.POST('/users/login', { username, password });
  }

  async getUser() {
    if (!this.authToken) {
      return null;
    }

    const { user } = await this.GET('/users/status', {}, this.headers);
    return user;
  }

  async fetchSchemas() {
    return this.GET('/admin/schemas', {}, this.headers);
  }

  async fetchRecord(resource, id) {
    return this.GET(`/rest/${resource}/${id}`, {}, this.headers);
  }

  async fetchMonitoringStats() {
    return this.GET(`/monitor/stats`, {}, this.headers);
  }

  async fetchPage(resource, page = 1, pageSize = 25) {
    if (page < 1) {
      page = 1;
    }
    if (pageSize <= 0) {
      pageSize = 25;
    }
    try {
      const { data, headers } = await this.request({
        path: `/rest/${resource}`,
        params: { page, pageSize },
        headers: this.headers,
        method: 'GET',
      });
      return {
        meta: {
          totalPages: Number(headers['x-total-pages']),
          page: Number(headers['x-page']),
          pageSize: Number(headers['x-per-page'])
        },
        records: data
      };
    } catch (e) {
      throw _.get(e, 'response.data');
    }
  }

  async createRecord(resource, record) {
    return this.POST(`/rest/${resource}`, record, this.headers);
  }

  async updateRecord(resource, recordId, record) {
    return this.PUT(`/rest/${resource}/${recordId}`, record, this.headers);
  }

  async deleteRecord(resource, record) {
    return this.DELETE(`/rest/${resource}/${ID(record)}`, {}, this.headers);
  }

  async deleteAttachment(resource, record, attachmentId) {
    return this.DELETE(`/rest/${resource}/${ID(record)}/attachments/${attachmentId}`, {}, this.headers);
  }
}

export default new PocketService();