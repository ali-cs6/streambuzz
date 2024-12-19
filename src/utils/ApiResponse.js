class ApiResponse { //error/api response- always in class format
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400 //anything above- client/server error
  }
}


export {ApiResponse}