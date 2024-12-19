const asyncHandler = (requestHandler) => {
  return (req, res, next) => { //next is middleware
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
  }
}

export {asyncHandler}