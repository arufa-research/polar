use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::HumanAddr;

#[derive(Serialize, Debug, Deserialize, JsonSchema, Clone, PartialEq, Default)]
pub struct Contract {
    pub address: HumanAddr,
    pub hash: String,
}
