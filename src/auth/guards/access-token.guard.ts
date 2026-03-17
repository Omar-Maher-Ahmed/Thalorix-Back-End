import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schema/user.schema';

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        console.log({authHeader})
        if (!authHeader) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authHeader.replace('Bearer ', '');
        const userFromJwt = request.user; // من JwtStrategy

        if (!userFromJwt || !token) {
            throw new UnauthorizedException();
        }

        console.log('🔍 AccessTokenGuard checking token...');

        // نجيب المستخدم بالتوكن المخزن
        const dbUser = await this.userModel
            .findById(userFromJwt.userId)
            .select('+currentAccessToken');

        if (!dbUser) {
            console.log('❌ User not found in DB');
            throw new UnauthorizedException('User not found');
        }

        console.log('📊 Comparing tokens:');
        console.log('   - Token from request:', token.substring(0, 20) + '...');
        console.log('   - Token in database:', dbUser.currentAccessToken ? dbUser.currentAccessToken.substring(0, 20) + '...' : 'NONE');

        // ✅ المقارنة هنا
        if (!dbUser.currentAccessToken || dbUser.currentAccessToken !== token) {
            console.log('❌ Token mismatch or expired session');
            throw new UnauthorizedException('Invalid token session');
        }

        console.log('✅ Token validated successfully');
        return true;
    }
}