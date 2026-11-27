import { TechStackItem } from './techstack';
import { TechStackDto } from './techstack-write';

/** Maps the nullable API tech stack DTO onto the view model. */
export class TechStackMapper {
  static fromDto(dto: TechStackDto): TechStackItem {
    return {
      id: dto.id,
      stackName: dto.stackName ?? '',
      imgSrc: dto.imgSrc ?? null,
      category: dto.category ?? '',
    };
  }
}
