use cosmwasm_std::{
    debug_print, to_binary, Api, Binary, Env, Extern, HandleResponse, InitResponse, Querier,
     StdResult, Storage,
};

use crate::msg::{HelloResponse, HandleMsg, InitMsg, QueryMsg};
use crate::state::{config, config_read, State};

pub fn init<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    msg: InitMsg,
) -> StdResult<InitResponse> {
    let state = State {
        display: msg.display,
        owner: deps.api.canonical_address(&env.message.sender)?,
    };

    config(&mut deps.storage).save(&state)?;

    debug_print!("Contract was initialized by {}", env.message.sender);

    Ok(InitResponse::default())
}

pub fn handle<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    msg: HandleMsg,
) -> StdResult<HandleResponse> {
    match msg {
        HandleMsg::Hello {} => try_hello(deps, env),
    }
}

pub fn try_hello<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    _env: Env,
) -> StdResult<HandleResponse> {
    config(&mut deps.storage).update(|mut state| {
        state.display = "Hello World!".to_string();
        Ok(state)
    })?;

    debug_print("Hello World executed successfully");
    Ok(HandleResponse::default())
}

pub fn query<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    msg: QueryMsg,
) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetHello {} => to_binary(&query_display(deps)?),
    }
}

fn query_display<S: Storage, A: Api, Q: Querier>(deps: &Extern<S, A, Q>) -> StdResult<HelloResponse> {
    let state = config_read(&deps.storage).load()?;
    Ok(HelloResponse { display: state.display })
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env};
    use cosmwasm_std::{coins, from_binary, StdError};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies(20, &[]);

        let msg = InitMsg { display: " " };
        let env = mock_env("creator", &coins(1000, "earth"));

        // we can just call .unwrap() to assert this was a success
        let res = init(&mut deps, env, msg).unwrap();
        assert_eq!(0, res.messages.len());

        // it worked, let's query the state
        let res = query(&deps, QueryMsg::GetHello {}).unwrap();
        let value: HelloResponse = from_binary(&res).unwrap();
        assert_eq!(" ", value.display);
    }

    #[test]
    fn hello() {
        let mut deps = mock_dependencies(20, &coins(2, "token"));

        let msg = InitMsg { display: " " };
        let env = mock_env("creator", &coins(2, "token"));
        let _res = init(&mut deps, env, msg).unwrap();

        // anyone can implement hello world
        let env = mock_env("anyone", &coins(2, "token"));
        let msg = HandleMsg::Increment {};
        let _res = handle(&mut deps, env, msg).unwrap();

        // should implement hello world
        let res = query(&deps, QueryMsg::GetHello {}).unwrap();
        let value: HelloResponse = from_binary(&res).unwrap();
        assert_eq!("Hello World!", value.display);
    } 
}
