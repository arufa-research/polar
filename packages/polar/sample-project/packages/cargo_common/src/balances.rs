use cosmwasm_std::{Binary, HumanAddr, StdError, StdResult};

use serde::{Deserialize, Serialize};
use std::convert::TryFrom;

pub const BALANCES: &[u8] = b"balances";

#[derive(Serialize, Deserialize, Default)]
pub struct Balance {
    pub account: HumanAddr,
    pub amount: u128,
}

#[derive(Serialize, Deserialize, Default)]
pub struct Balances(pub Vec<Balance>);

impl Balances {
    pub fn to_binary(&self) -> StdResult<Binary> {
        let bin_data =
            bincode2::serialize(&self).map_err(|e| StdError::serialize_err("Balances", e))?;

        Ok(Binary::from(bin_data))
    }
}

impl TryFrom<Binary> for Balances {
    type Error = StdError;

    fn try_from(bin_data: Binary) -> StdResult<Self> {
        Ok(bincode2::deserialize::<Self>(&bin_data.as_slice())
            .map_err(|e| StdError::serialize_err("Balances", e))?)
    }
}
