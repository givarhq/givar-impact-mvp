import { Global, Module } from '@nestjs/common';
import { FeeService } from './fee.service';
import { FeePublicController, FeeAdminController } from './fee.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
    imports: [AuthModule],
    controllers: [FeePublicController, FeeAdminController],
    providers: [FeeService],
    exports: [FeeService],
})
export class FeeModule { }