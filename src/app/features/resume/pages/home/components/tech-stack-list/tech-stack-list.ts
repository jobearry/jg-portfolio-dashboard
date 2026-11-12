import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { getContent, SkillsSignalService, Skeleton, StateMessage } from '../../../../../../shared';
import { TechStackItem } from '../../../../../dashboard/core';

interface SkillGroup {
  category: string;
  skills: TechStackItem[];
  index: string;
}

@Component({
  selector: 'app-tech-stack-list',
  imports: [Skeleton, StateMessage],
  templateUrl: './tech-stack-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechStackList implements OnInit {
  private readonly skillsService = inject(SkillsSignalService);

  protected readonly state = computed(() => this.skillsService.getState());
  protected readonly groups = computed<SkillGroup[]>(() => {
    const groups = new Map<string, TechStackItem[]>();
    for (const skill of this.state().content) {
      const skills = groups.get(skill.category) ?? [];
      skills.push(skill);
      groups.set(skill.category, skills);
    }

    return Array.from(groups, ([category, skills], index) => ({
      category,
      skills,
      index: String(index + 1).padStart(2, '0'),
    }));
  });

  ngOnInit(): void {
    void this.load();
  }

  protected load(): Promise<void> {
    return getContent<TechStackItem>('v1/skill', this.skillsService);
  }

  protected mark(name: string): string {
    const words = name
      .trim()
      .split(/[\s._+#-]+/)
      .filter(Boolean);

    if (words.length > 1) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    const letters = name.replace(/[^a-zA-Z0-9]/g, '');
    return letters.slice(0, 2).replace(/^./, (character) => character.toUpperCase()) || '·';
  }
}
