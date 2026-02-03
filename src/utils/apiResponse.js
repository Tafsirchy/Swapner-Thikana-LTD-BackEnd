/**
 * Standard API response format
 */
class ApiResponse {
  constructor(success, message, data = null, statusCode = 200) {
    this.success = success;
    this.message = message;
    if (data) this.data = data;
    this.statusCode = statusCode;
  }

  /**
   * Success response
   */
  static success(res, message, data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
    };
    
    // Only add data field if data is provided and not null
    if (data !== null && data !== undefined) {
      response.data = data;
    }
    
    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   */
  static error(res, message, statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
  }

  /**
   * Paginated response
   */
  static paginated(res, message, data, pagination, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        itemsPerPage: pagination.limit,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
      },
    });
  }
}

module.exports = ApiResponse;
