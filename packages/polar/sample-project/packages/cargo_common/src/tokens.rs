use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::contract::Contract;
use cosmwasm_std::{Binary, HumanAddr, StdError, StdResult, Uint128};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InitHook {
    pub msg: Binary,
    pub contract_addr: HumanAddr,
    pub code_hash: String,
}

/// TokenContract InitMsg
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct TokenInitBalance {
    pub amount: Uint128,
    pub address: HumanAddr,
}

/// TokenContract InitMsg
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct TokenInitMsg {
    pub name: String,
    pub admin: Option<Vec<HumanAddr>>,
    pub symbol: String,
    pub decimals: u8,
    pub initial_balances: Option<Vec<TokenInitBalance>>,
    pub prng_seed: Binary,
    pub init_hook: Option<InitHook>,
    pub config: Option<InitConfig>,
    pub token_code_id: Option<u64>,
    pub is_being_minted: Option<bool>,
    pub is_voting_token: Option<bool>,
}

#[derive(Serialize, Deserialize, JsonSchema, Clone, Default, Debug)]
#[serde(rename_all = "snake_case")]
pub struct InitConfig {
    /// Indicates whether the total supply is public or should be kept secret.
    /// default: False
    pub public_total_supply: Option<bool>,
}

#[allow(clippy::too_many_arguments)]
impl TokenInitMsg {
    pub fn new(
        name: String,
        admin: Vec<HumanAddr>,
        symbol: String,
        decimals: u8,
        prng_seed: Binary,
        init_hook: InitHook,
        code_id: Option<u64>,
        is_being_minted: Option<bool>,
    ) -> Self {
        Self {
            name,
            admin: Some(admin),
            symbol,
            decimals,
            initial_balances: None,
            prng_seed,
            init_hook: Some(init_hook),
            config: Some(InitConfig {
                public_total_supply: Some(true),
            }),
            token_code_id: code_id,
            is_being_minted,
            is_voting_token: None,
        }
    }
    pub fn validate(&self) -> StdResult<()> {
        // Check name, symbol, decimals
        if !is_valid_name(&self.name) {
            return Err(StdError::generic_err(
                "Name is not in the expected format (3-50 UTF-8 bytes)",
            ));
        }
        if !is_valid_symbol(&self.symbol) {
            return Err(StdError::generic_err(
                "Ticker symbol is not in expected format [a-zA-Z\\-]{3,12}",
            ));
        }
        if self.decimals > 18 {
            return Err(StdError::generic_err("Decimals must not exceed 18"));
        }
        Ok(())
    }
}

fn is_valid_name(name: &str) -> bool {
    let bytes = name.as_bytes();
    if bytes.len() < 3 || bytes.len() > 50 {
        return false;
    }
    true
}

fn is_valid_symbol(symbol: &str) -> bool {
    let bytes = symbol.as_bytes();
    if bytes.len() < 3 || bytes.len() > 12 {
        return false;
    }
    for byte in bytes.iter() {
        if (*byte != 45) && (*byte < 65 || *byte > 90) && (*byte < 97 || *byte > 122) {
            return false;
        }
    }
    true
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum TokenQuery {
    MultipleBalances {
        address: HumanAddr,
        key: String,
        addresses: Vec<HumanAddr>,
    },
    TokenInfo {},
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum TokenQueryResponse {
    MultipleBalances {
        balances: Binary,
    },
    TokenInfo {
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: Option<Uint128>,
    },
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum TokenHandleMessage {
    SetVotingContract {
        contract: Option<Contract>,
        gov_token: bool,
    },
}
