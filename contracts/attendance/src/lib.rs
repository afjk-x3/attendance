#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Event {
    pub organizer: Address,
    pub max_attendees: u32,
    pub end_timestamp: u64,
    pub attendee_count: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Event(u64), // Map<event_id, Event>
    CheckIn(u64, Address), // Map<(event_id, attendee), bool>
}

#[contract]
pub struct AttendanceContract;

#[contractimpl]
impl AttendanceContract {
    pub fn create_event(
        env: Env,
        organizer: Address,
        event_id: u64,
        max_attendees: u32,
        end_timestamp: u64,
    ) {
        organizer.require_auth();

        let key = DataKey::Event(event_id);
        if env.storage().instance().has(&key) {
            panic!("Event already exists");
        }

        let event = Event {
            organizer,
            max_attendees,
            end_timestamp,
            attendee_count: 0,
        };

        env.storage().instance().set(&key, &event);
    }

    pub fn check_in(env: Env, event_id: u64, attendee: Address) {
        attendee.require_auth();

        let event_key = DataKey::Event(event_id);
        let mut event: Event = env
            .storage()
            .instance()
            .get(&event_key)
            .unwrap_or_else(|| panic!("Event does not exist"));

        let current_time = env.ledger().timestamp();
        if current_time > event.end_timestamp {
            panic!("Event has ended");
        }

        if event.attendee_count >= event.max_attendees {
            panic!("Event is full");
        }

        let checkin_key = DataKey::CheckIn(event_id, attendee.clone());
        if env.storage().instance().has(&checkin_key) {
            panic!("Attendee already checked in");
        }

        event.attendee_count += 1;
        env.storage().instance().set(&event_key, &event);
        env.storage().instance().set(&checkin_key, &true);
    }

    pub fn has_attended(env: Env, event_id: u64, attendee: Address) -> bool {
        let key = DataKey::CheckIn(event_id, attendee);
        env.storage().instance().get(&key).unwrap_or(false)
    }

    pub fn get_attendee_count(env: Env, event_id: u64) -> u32 {
        let key = DataKey::Event(event_id);
        let event: Event = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| panic!("Event does not exist"));
        event.attendee_count
    }

    pub fn get_event(env: Env, event_id: u64) -> Event {
        let key = DataKey::Event(event_id);
        env.storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| panic!("Event does not exist"))
    }
}


#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_create_and_check_in() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AttendanceContract);
        let client = AttendanceContractClient::new(&env, &contract_id);

        let organizer = Address::generate(&env);
        let attendee = Address::generate(&env);

        let event_id = 1;
        let max_attendees = 10;
        let end_timestamp = env.ledger().timestamp() + 1000;

        client
            .mock_all_auths()
            .create_event(&organizer, &event_id, &max_attendees, &end_timestamp);

        assert_eq!(client.get_attendee_count(&event_id), 0);
        assert_eq!(client.has_attended(&event_id, &attendee), false);

        client.mock_all_auths().check_in(&event_id, &attendee);

        assert_eq!(client.get_attendee_count(&event_id), 1);
        assert_eq!(client.has_attended(&event_id, &attendee), true);
    }
}
