import { assert } from "chai";

import {
  getValidationErrors,
  validateConfig
} from "../../../../src/internal/core/config/config-validation";
import { ERRORS } from "../../../../src/internal/core/errors-list";
import { expectPolarError } from "../../../helpers/errors";

const accountStatic = {
  name: "staticAccount",
  address: 'secret13kulyh3gnm5rzhz0plxrtdmx6g0tup3t3k7eke',
  mnemonic: "misery into cram ugly primary since describe crystal mother tackle slow source"
};

describe("Config validation", function () {
  describe("paths config", function () {
    const invalidPaths = [
      { paths: 123 }, // invalid path type
      { paths: { cache: 123 } },
      { paths: { artifacts: 123 } },
      { paths: { sources: 123 } },
      { paths: { tests: 123 } },
      { paths: { root: 123 } }
    ];

    it("Should fail with invalid types (paths)", function () {
      for (const cfg of invalidPaths) {
        expectPolarError(
          () => validateConfig(cfg),
          ERRORS.GENERAL.INVALID_CONFIG,
          undefined,
          JSON.stringify(cfg));
      }
    });

    it("Shouldn't fail with an empty paths config", function () {
      let errors = getValidationErrors({ paths: {} });
      assert.isTrue(errors.isEmpty());

      errors = getValidationErrors({});
      assert.isTrue(errors.isEmpty());
    });

    it("Shouldn't fail with valid paths configs", function () {
      const errors = getValidationErrors({
        paths: {
          root: "root",
          cache: "cache",
          artifacts: "artifacts",
          sources: "sources",
          tests: "tests"
        }
      });

      assert.isTrue(errors.isEmpty());
    });

    it("Shouldn't fail with unrecognized params", function () {
      const errors = getValidationErrors({
        paths: {
          unrecognized: 123
        }
      });

      assert.isTrue(errors.isEmpty());
    });
  });

  describe("networks config", function () {
    it("Should fail with duplicated account ", function () {
      const cfg = {
        networks: {
          default: {
            accounts: [accountStatic, accountStatic],
            endpoint: "localhost"
          }
        }
      };

      expectPolarError(
        () => validateConfig(cfg),
        ERRORS.GENERAL.INVALID_CONFIG,
        `Account name ${accountStatic.name} already exists at index 0`);
    });

    describe("Invalid types", function () {
      describe("Networks object", function () {
        it("Should fail with invalid types (networks)", function () {
          expectPolarError(
            () => validateConfig({ networks: 123 }),
            ERRORS.GENERAL.INVALID_CONFIG
          );

          expectPolarError(
            () =>
              validateConfig({
                networks: {
                  asd: 123
                }
              }),
            ERRORS.GENERAL.INVALID_CONFIG
          );
        });
      });

      describe("HTTP network config", function () {
        describe("Accounts field", function () {
          it("Shouldn't work with invalid types", function () {
            expectPolarError(
              () =>
                validateConfig({
                  networks: {
                    asd: {
                      accounts: 123,
                      endpoint: "localhost"
                    }
                  }
                }),
              ERRORS.GENERAL.INVALID_CONFIG
            );

            expectPolarError(
              () =>
                validateConfig({
                  networks: {
                    asd: {
                      accounts: {},
                      endpoint: "localhost"
                    }
                  }
                }),
              ERRORS.GENERAL.INVALID_CONFIG
            );

            expectPolarError(
              () =>
                validateConfig({
                  networks: {
                    asd: {
                      accounts: { asd: 123 },
                      endpoint: "localhost"
                    }
                  }
                }),
              ERRORS.GENERAL.INVALID_CONFIG
            );
          });

          describe("OtherAccountsConfig", function () {
            it("Should fail with invalid types", function () {
              expectPolarError(
                () =>
                  validateConfig({
                    networks: {
                      asd: {
                        accounts: {
                          type: 123
                        },
                        endpoint: "localhost"
                      }
                    }
                  }),
                ERRORS.GENERAL.INVALID_CONFIG
              );
            });
          });
        });
      });
    });
  });
});
