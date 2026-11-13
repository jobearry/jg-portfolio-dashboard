import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideChevronUp } from '@ng-icons/lucide';
import { getContent, SkillsSignalService, Skeleton, StateMessage } from '../../../../../../shared';
import { TechStackItem } from '../../../../../dashboard/core';

interface SkillGroup {
  category: string;
  skills: TechStackItem[];
  index: string;
}

/** The landing page shows the three layers of the stack; other categories are
 *  revealed by the "View more" toggle, still in the master order. */
const CATEGORY_ORDER: readonly string[] = [
  'Frontend',
  'Backend',
  'Database',
  'Cloud & Infrastructure',
  'Language',
  'AI Tool',
];

const LANDING_CATEGORIES = CATEGORY_ORDER.slice(0, 3);

/** Cards show this many skills before the list starts scrolling. */
const VISIBLE_SKILLS = 4;

@Component({
  selector: 'app-tech-stack-list',
  imports: [Skeleton, StateMessage, NgIcon],
  providers: [provideIcons({ lucideChevronDown, lucideChevronUp })],
  templateUrl: './tech-stack-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* Fades the clipped edge of a scrolling list so the overflow is visible. */
    .scroll-fade {
      mask-image: linear-gradient(to bottom, #000 calc(100% - 1rem), transparent);
    }
  `,
})
export class TechStackList implements OnInit {
  private readonly skillsService = inject(SkillsSignalService);

  protected readonly visibleSkills = VISIBLE_SKILLS;
  protected readonly state = computed(() => this.skillsService.getState());
  protected readonly expanded = signal(false);
  protected readonly groups = computed<SkillGroup[]>(() => {
    const groups = new Map<string, TechStackItem[]>();
    for (const skill of this.state().content) {
      if (!CATEGORY_ORDER.includes(skill.category)) {
        continue;
      }

      const skills = groups.get(skill.category) ?? [];
      skills.push(skill);
      groups.set(skill.category, skills);
    }

    return CATEGORY_ORDER.flatMap((category, index) => {
      const skills = groups.get(category);
      return skills
        ? [{ category, skills, index: String(index + 1).padStart(2, '0') }]
        : [];
    });
  });
  protected readonly visibleGroups = computed(() =>
    this.expanded() ? this.groups() : this.groups().slice(0, LANDING_CATEGORIES.length),
  );
  protected readonly overflows = computed(
    () =>
      this.groups().length > LANDING_CATEGORIES.length ||
      this.groups().some((group) => group.skills.length > VISIBLE_SKILLS),
  );

  ngOnInit(): void {
    void this.load();
  }

  protected load(): Promise<void> {
    return getContent<TechStackItem>('v1/skill', this.skillsService);
  }

  protected toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }

  protected scrolls(group: SkillGroup): boolean {
    return !this.expanded() && group.skills.length > VISIBLE_SKILLS;
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
