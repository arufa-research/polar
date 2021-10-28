import './types';

import { supportProperAddress } from './matchers/properAddress';
import { supportProperHex } from './matchers/properHex';
import { supportProperSecretAddress } from './matchers/properSecretAddress';

export function polarChai (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils): void {
  supportProperHex(chai.Assertion);
  supportProperAddress(chai.Assertion);
  supportProperSecretAddress(chai.Assertion);
}
