import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'sequelize';

@Catch(ValidationError)
export class SequelizeValidationFilter implements ExceptionFilter {
  catch(exception: ValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errors = exception.errors.map((err) => ({
      field: err.path,
      message: err.message,
    }));

    response.status(400).json({
      statusCode: 400,
      message: 'Validation Error',
      errors,
    });
  }
}
