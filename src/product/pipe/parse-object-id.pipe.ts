import { 
    PipeTransform, 
    Injectable, 
    BadRequestException 
} from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * ============================================
 * Parse ObjectId Pipe
 * ============================================
 * 
 * ده الـ Pipe اللي بيتحقق إن الـ ID اللي جاي من الـ Params
 * هو MongoDB ObjectId صحيح
 * 
 * الفايدة:
 * - منع NoSQL Injection
 * - رسائل خطأ واضحة
 * - Fail Fast (نوقف الـ Request بدري لو الـ ID غلط)
 * 
 * الاستخدام:
 * @Param('id', ParseObjectIdPipe) id: string
 */

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
    
    /**
     * تحويل وتحقق من الـ ID
     * 
     * @param value - الـ ID اللي جاي من الـ Request
     * @returns نفس الـ ID لو كان صحيح
     * @throws BadRequestException لو الـ ID غلط
     */
    transform(value: string): string {
        // التحقق إن الـ Value موجود
        if (!value) {
            throw new BadRequestException('المعرف (ID) مطلوب');
        }

        // التحقق إن الـ Value String
        if (typeof value !== 'string') {
            throw new BadRequestException('المعرف (ID) لازم يكون نص');
        }

        // التحقق من صحة الـ MongoDB ObjectId
        const isValid = Types.ObjectId.isValid(value);
        
        if (!isValid) {
            throw new BadRequestException(
                `المعرف "${value}" غير صالح. لازم يكون MongoDB ObjectId صحيح.`
            );
        }

        // التحقق الإضافي: الـ ID لازم يكون 24 حرف hexadecimal
        const isValidLength = value.length === 24;
        
        if (!isValidLength) {
            throw new BadRequestException(
                `المعرف "${value}" غير صالح. لازم يكون 24 حرف.`
            );
        }

        // لو كل حاجة صح، نرجع الـ ID
        return value;
    }
}