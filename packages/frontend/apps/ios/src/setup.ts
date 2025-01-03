import '@affine/core/bootstrap/browser';
import '@affine/component/theme';
import '@affine/core/mobile/styles/mobile.css';

import { bindNativeDBApis } from '@affine/nbstore/sqlite';

import { NbStoreNativeDBApis } from './plugins/nbstore';

bindNativeDBApis(NbStoreNativeDBApis);
// TODO(@L-Sun) Uncomment this when the `show` method implement by `@capacitor/keyboard` in ios
// import './virtual-keyboard';
