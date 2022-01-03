use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{HumanAddr, Uint128, VoteOption};

#[derive(Serialize, Deserialize, Clone, JsonSchema, Debug)]
pub struct SingleVote {
    pub address: HumanAddr,
    pub vote: u32,
    pub voting_power: u64,
}

#[derive(Serialize, Deserialize, JsonSchema, Debug)]
pub struct VoteChange {
    pub voting_power: u64,
    pub address: HumanAddr,
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum VotingMessages {
    // Token contract tells voting contract to vote
    Vote {
        proposal: u64,
        vote: SingleVote,
    },
    // Voting contract tells staking contract to vote
    VoteOnChain {
        proposal: u64,
        vote: VoteOption,
    },
    NotifyBalanceChange {
        changes: Vec<VoteChange>,
    },
    QueryVote {
        address: HumanAddr,
        proposal: u64,
        password: String,
    },
    SetPassword {
        password: String,
    },
}

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum VoteResponse {
    QueryVote {
        address: HumanAddr,
        proposal: u64,
        vote: Option<VoteOption>,
        voting_power: Uint128,
    },
}

pub fn u32_to_vote_option(num: u32) -> VoteOption {
    match num {
        0 => VoteOption::Abstain,
        1 => VoteOption::NoWithVeto,
        2 => VoteOption::No,
        3 => VoteOption::Yes,
        _ => panic!(),
    }
}

pub fn vote_option_to_u32(option: VoteOption) -> u32 {
    match option {
        VoteOption::Abstain => 0,
        VoteOption::NoWithVeto => 1,
        VoteOption::No => 2,
        VoteOption::Yes => 3,
    }
}
