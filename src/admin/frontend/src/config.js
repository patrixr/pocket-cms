export default {

  /**
   * API endpoint
   */
  get baseUrl() {
    if (process.env.NODE_ENV == 'development' && process.env.PARCEL_DEV == 'true') {
      return 'http://localhost:8000/'
    }
    const path = location.pathname;
    if (path.indexOf('admin') >= 0) {
      return path.slice(0, path.indexOf('admin'));
    }
    return path;
  }

}