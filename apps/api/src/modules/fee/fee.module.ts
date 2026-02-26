import { Global, Module } from '@nestjs/common';
import { FeeService } from './fee.service';
import { FeePublicController, FeeAdminController } from './fee.controller';

@Global() // Global designation prevents circular dependency issues with Donation/Wallet modules
@Module({
    controllers: [FeePublicController, FeeAdminController],
    providers: [FeeService],
    exports: [FeeService],
})
export class FeeModule { }