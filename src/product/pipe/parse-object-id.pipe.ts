import {
    PipeTransform,
    Injectable,
    BadRequestException
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
    transform(value: string): string {
        if (!value) {
            throw new BadRequestException('(ID) is required');
        }
        if (typeof value !== 'string') {
            throw new BadRequestException('(ID) must be a string');
        }
        const isValid = Types.ObjectId.isValid(value);

        if (!isValid) {
            throw new BadRequestException(
                `"${value}" is not valid. It must be a valid MongoDB ObjectId.`
            );
        }
        return value;
    }
}