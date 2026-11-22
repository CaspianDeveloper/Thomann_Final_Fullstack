export class AppError extends Error {
    constructor (
        public status: number,
        public code: string,
        message: string,
        public details?: unknown[],
    ){
        super(message)
    }
};

export class BadRequestError extends AppError {
    constructor(message = "Bad request" , details?: unknown[]){
        super(400 , "BAD_REQUEST" , message , details);
    }
};


export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized"){
        super(401 , "UNAUTHORIZED" , message)
    }
};

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(401 , "FORBIDDEN" , message)
    }
};


export class NotFoundError extends AppError {
    constructor(message = "Not found") {
        super(404 ,"NOT_FOUND", message)
    }
};

export class ConflictError extends AppError {
    constructor (message = "Conflict") {
        super(409, "CONFLICT", message)
    }
}