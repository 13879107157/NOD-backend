// 成功响应
const successResponse = (message, data = null) => {
    return {
        success: true,
        message,
        data,
    };
};

// 错误响应
const errorResponse = (message) => {
    return {
        success: false,
        message,
        data: null,
    };
};

module.exports = {
    successResponse,
    errorResponse,
};
