import { UserProviderState, User } from '../types';
import React, { Component } from 'react';
import { UsersContext } from './contexts';
import Axios from 'axios';
import { APP_URLS, get_data } from '../urls';
import { update_state } from '../utils';

export default class UsersProvider extends Component<{}, UserProviderState> {
    
    update_state: (update_func: (draft: UserProviderState) => void) => Promise<void>
    constructor(props: {}) {
        super(props)
        this.state = {
            initialized: true,
            loaded: false,
            error: {
                is_error: false,
                message: ""
            },
            users: []
        }

        this.update_state = update_state.bind(this)
        this.refresh_users = this.refresh_users.bind(this)
        this.add_user = this.add_user.bind(this)
    }

    componentDidMount() {
        this.refresh_users()
    }

    async refresh_users() {
        return get_data(APP_URLS.USERS)
        .then((users: User[]) => {
            this.update_state(draft => {
                draft.users = users
            })
        })
    }

    async add_user(name: string) {
        return Axios.post(APP_URLS.USERS, {
            name
        }).then(this.refresh_users)
    }

    render() {
        return (
            <UsersContext.Provider
                value={{
                    state: this.state,
                    refresh_users: this.refresh_users,
                    add_user: this.add_user
                }}
            >
                {this.props.children}
            </UsersContext.Provider>
        )
    }
}