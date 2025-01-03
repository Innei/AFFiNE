import '@affine/core/bootstrap/electron';
import '@affine/component/theme';
import './global.css';

import { apis } from '@affine/electron-api';
import { bindNativeDBApis } from '@affine/nbstore/sqlite';

bindNativeDBApis(apis!.nbstore);
