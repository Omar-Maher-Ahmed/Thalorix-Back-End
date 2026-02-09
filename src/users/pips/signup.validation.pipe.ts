import {
    PipeTransform,
    Injectable,
    BadRequestException,
    ArgumentMetadata,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class SignupValidationPipe implements PipeTransform {
    async transform(value: any, metadata: ArgumentMetadata) {
        if (!metadata.metatype) return value;

        // ===== Sanitize Input =====
        if (value.name) value.name = value.name.trim();
        if (value.email) value.email = value.email.toLowerCase().trim();
        if (value.phone) value.phone = value.phone.trim();

        // ===== Convert plain object to DTO =====
        const object = plainToInstance(metadata.metatype, value);

        // ===== Validate =====
        const errors = await validate(object, {
            whitelist: true,               // remove unknown fields
            forbidNonWhitelisted: true,    // throw error if extra fields exist
            stopAtFirstError: true,        // performance boost
        });

        if (errors.length > 0) {
            const formattedErrors = errors.map(err => ({
                field: err.property,
                message: err.constraints ? Object.values(err.constraints)[0] : 'Validation failed',
            }));

            throw new BadRequestException({
                statusCode: 400,
                error: 'Validation Failed',
                errors: formattedErrors,
            });
        }

        return object;
    }
}
