import { JsonService } from "./JsonService"
import config          from '../config'
import { debug } from "util";

class PocketService extends JsonService {
  constructor() {
    super(config.baseUrl);
    this.authToken = null;
  }

  withAuth(authToken) {
    const service = new PocketService();
    service.authToken = authToken;
    return service;
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

  async fetchSchemas() {
    return this.GET('/admin/schemas', {}, this.headers);
  }
}

export default new PocketService();