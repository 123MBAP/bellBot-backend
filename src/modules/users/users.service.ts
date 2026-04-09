import { UsersRepository } from './users.repository.js';

export class UsersService {
    constructor(private readonly repo: UsersRepository) { }

    async listCustomers() {
        return this.repo.listCustomers();
    }
}
