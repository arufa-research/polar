export const POLAR_NAME = "polar";

export const defaultFees = {
  upload: {
    amount: [{ amount: "250000", denom: "uscrt" }],
    gas: String(1000000)
  },
  init: {
    amount: [{ amount: "125000", denom: "uscrt" }],
    gas: String(500000)
  },
  exec: {
    amount: [{ amount: "50000", denom: "uscrt" }],
    gas: String(200000)
  },
  send: {
    amount: [{ amount: "20000", denom: "uscrt" }],
    gas: String(80000)
  }
};
