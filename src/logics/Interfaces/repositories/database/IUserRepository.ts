import type { UserDto } from "@/src/entities/dto/UserDto";

export interface IUserRepository {
	create(data: UserDto): Promise<boolean>;
	delete(data: UserDto): Promise<boolean>;
}
