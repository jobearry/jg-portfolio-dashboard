import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Theme, ThemeService } from '../../../../core/theme';
import { getApiErrorMessage, PageHeader, Skeleton, StateMessage } from '../../../../shared';
import { ProjectStackService, SkillCategoryItem, TechStackItem } from '../../core';

interface SettingsState {
  loading: boolean;
  error: string | null;
  categories: SkillCategoryItem[];
  skills: TechStackItem[];
}

/** Create-only administration for categories/skills plus the shared theme. */
@Component({
  selector: 'app-settings',
  imports: [PageHeader, Skeleton, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly stacks = inject(ProjectStackService);
  private readonly themeService = inject(ThemeService);

  protected readonly state = signal<SettingsState>({
    loading: true,
    error: null,
    categories: [],
    skills: [],
  });
  protected readonly theme = this.themeService.theme;

  protected readonly categoryName = signal('');
  protected readonly skillName = signal('');
  protected readonly selectedCategory = signal('');
  protected readonly savingCategory = signal(false);
  protected readonly savingSkill = signal(false);
  protected readonly categoryError = signal<string | null>(null);
  protected readonly skillError = signal<string | null>(null);

  protected readonly canSaveCategory = computed(
    () => !!this.categoryName().trim() && !this.savingCategory(),
  );
  protected readonly canSaveSkill = computed(
    () => !!this.skillName().trim() && !!this.selectedCategory() && !this.savingSkill(),
  );

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const [categories, skills] = await Promise.all([
        this.stacks.getAllCategories(),
        this.stacks.getAll(),
      ]);

      this.state.set({ loading: false, error: null, categories, skills });
    } catch (error) {
      this.state.update((state) => ({
        ...state,
        loading: false,
        error: getApiErrorMessage(error),
      }));
    }
  }

  protected async addCategory(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSaveCategory()) {
      return;
    }

    this.savingCategory.set(true);
    this.categoryError.set(null);

    try {
      const created = await this.stacks.createCategory(this.categoryName().trim());
      this.state.update((state) => ({ ...state, categories: [...state.categories, created] }));
      this.categoryName.set('');
    } catch (error) {
      this.categoryError.set(getApiErrorMessage(error));
    } finally {
      this.savingCategory.set(false);
    }
  }

  protected async addSkill(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSaveSkill()) {
      return;
    }

    this.savingSkill.set(true);
    this.skillError.set(null);

    try {
      const created = await this.stacks.createSkill({
        stackName: this.skillName().trim(),
        imgSrc: null,
        category: this.selectedCategory(),
      });
      this.state.update((state) => ({ ...state, skills: [...state.skills, created] }));
      this.skillName.set('');
    } catch (error) {
      this.skillError.set(getApiErrorMessage(error));
    } finally {
      this.savingSkill.set(false);
    }
  }

  protected onCategoryNameInput(event: Event): void {
    this.categoryName.set((event.target as HTMLInputElement).value);
  }

  protected onSkillNameInput(event: Event): void {
    this.skillName.set((event.target as HTMLInputElement).value);
  }

  protected onCategoryChange(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
  }

  protected setTheme(theme: Theme): void {
    this.themeService.set(theme);
  }
}
