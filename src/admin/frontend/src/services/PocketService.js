import { JsonService }  from "./JsonService"
import config           from '../config'
import Store            from "../store"

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

  async fetchRecords(resource, page = 1, pageSize = 25) {
    if (page < 1) {
      page = 1;
    }
    return this.GET(`/rest/${resource}`, { page, pageSize }, this.headers);
  }

  async createRecord(resource, record) {
    return this.POST(`/rest/${resource}`, record, this.headers);
  }

  async updateRecord(resource, recordId, record) {
    return this.PUT(`/rest/${resource}/${recordId}`, record, this.headers);
  }

  async deleteRecord(resource, recordId, record) {
    return this.DELETE(`/rest/${resource}/${recordId}`, {}, this.headers);
  }
}

export default new PocketService();