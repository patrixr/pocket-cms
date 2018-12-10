export default {

  /**
   * API endpoint
   */
  get baseUrl() {
    if (process.env.NODE_ENV == 'development' && process.env.PARCEL_DEV == 'true') {
      return 'http://localhost:8000/'
    }
    return '/'
  }

}