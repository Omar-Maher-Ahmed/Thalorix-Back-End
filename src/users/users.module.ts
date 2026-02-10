import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SignupValidationPipe } from './pips/signup.validation.pipe';
import { User, userSchema } from './schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, SignupValidationPipe],
})
export class UsersModule { }