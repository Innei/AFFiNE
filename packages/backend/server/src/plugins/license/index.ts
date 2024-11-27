import { OptionalModule } from '../../base';
import { PermissionModule } from '../../core/permission';
import { QuotaModule } from '../../core/quota';
import { LicenseService } from './service';

@OptionalModule({
  if: config => config.isSelfhosted,
  imports: [QuotaModule, PermissionModule],
  providers: [LicenseService],
})
export class LicenseModule {}
