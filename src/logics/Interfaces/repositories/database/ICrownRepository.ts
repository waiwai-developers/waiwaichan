import type { CrownDto } from "@/src/entities/dto/CrownDto";

export interface ICrownRepository {
	findOne(data: CrownDto): Promise<CrownDto | undefined>;
	create(data: CrownDto): Promise<boolean>;
}
