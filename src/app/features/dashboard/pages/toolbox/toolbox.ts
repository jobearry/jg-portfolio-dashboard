import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucidePencil, lucideTrash2, lucideX } from '@ng-icons/lucide';
import { getApiErrorMessage, PageHeader, Skeleton, StateMessage } from '../../../../shared';
import { ProjectStackService, SkillCategoryItem, TechStackItem } from '../../core';

interface ToolboxState {
  loading: boolean;
  error: string | null;
  categories: SkillCategoryItem[];
  skills: TechStackItem[];
}

/** Catalog administration for tech stack categories and skills. */
@Component({
  selector: 'app-toolbox',
  imports: [NgIcon, PageHeader, Skeleton, StateMessage],
  providers: [provideIcons({ lucideCheck, lucidePencil, lucideTrash2, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toolbox.html',
})
export class Toolbox implements OnInit {
  private readonly stacks = inject(ProjectStackService);

  protected readonly state = signal<ToolboxState>({
    loading: true,
    error: null,
    categories: [],
    skills: [],
  });

  protected readonly categoryName = signal('');
  protected readonly skillName = signal('');
  protected readonly selectedCategory = signal('');
  protected readonly savingCategory = signal(false);
  protected readonly savingSkill = signal(false);
  protected readonly categoryError = signal<string | null>(null);
  protected readonly skillError = signal<string | null>(null);

  protected readonly editingCategoryId = signal<number | null>(null);
  protected readonly categoryDraft = signal('');
  protected readonly categoryActionId = signal<number | null>(null);
  protected readonly confirmingDeleteCategoryId = signal<number | null>(null);
  protected readonly categoryActionError = signal<string | null>(null);

  protected readonly editingSkillId = signal<number | null>(null);
  protected readonly skillDraftName = signal('');
  protected readonly skillDraftCategory = signal('');
  protected readonly skillActionId = signal<number | null>(null);
  protected readonly confirmingDeleteSkillId = signal<number | null>(null);
  protected readonly skillActionError = signal<string | null>(null);

  protected readonly canSaveCategory = computed(
    () => !!this.categoryName().trim() && !this.savingCategory(),
  );
  protected readonly canSaveSkill = computed(
    () => !!this.skillName().trim() && !!this.selectedCategory() && !this.savingSkill(),
  );
  protected readonly canSaveCategoryEdit = computed(
    () => !!this.categoryDraft().trim() && this.categoryActionId() === null,
  );
  protected readonly canSaveSkillEdit = computed(
    () =>
      !!this.skillDraftName().trim() &&
      !!this.skillDraftCategory() &&
      this.skillActionId() === null,
  );

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.update((state) => ({ ...state, loading: true, error: null }));
    this.editingCategoryId.set(null);
    this.confirmingDeleteCategoryId.set(null);
    this.categoryActionError.set(null);
    this.editingSkillId.set(null);
    this.confirmingDeleteSkillId.set(null);
    this.skillActionError.set(null);

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

  protected startCategoryEdit(category: SkillCategoryItem): void {
    if (this.categoryActionId() !== null) {
      return;
    }

    this.confirmingDeleteCategoryId.set(null);
    this.categoryActionError.set(null);
    this.categoryDraft.set(category.category);
    this.editingCategoryId.set(category.id);
  }

  protected cancelCategoryEdit(): void {
    this.editingCategoryId.set(null);
    this.categoryDraft.set('');
    this.categoryActionError.set(null);
  }

  protected onCategoryDraftInput(event: Event): void {
    this.categoryDraft.set((event.target as HTMLInputElement).value);
  }

  protected async saveCategoryEdit(id: number, event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSaveCategoryEdit()) {
      return;
    }

    const previousName = this.state().categories.find((item) => item.id === id)?.category ?? '';
    const category = this.categoryDraft().trim();

    this.categoryActionId.set(id);
    this.categoryActionError.set(null);

    try {
      const updated = await this.stacks.updateCategory(id, category);
      this.state.update((state) => ({
        ...state,
        categories: state.categories.map((item) => (item.id === id ? updated : item)),
        skills: state.skills.map((skill) =>
          skill.category === previousName ? { ...skill, category: updated.category } : skill,
        ),
      }));
      if (this.selectedCategory() === previousName) {
        this.selectedCategory.set(updated.category);
      }
      if (this.skillDraftCategory() === previousName) {
        this.skillDraftCategory.set(updated.category);
      }
      this.editingCategoryId.set(null);
      this.categoryDraft.set('');
    } catch (error) {
      this.categoryActionError.set(getApiErrorMessage(error));
    } finally {
      this.categoryActionId.set(null);
    }
  }

  protected categoryUsage(categoryName: string): number {
    return this.state().skills.filter((skill) => skill.category === categoryName).length;
  }

  protected categoryUsageLabel(categoryName: string): string {
    const count = this.categoryUsage(categoryName);
    if (count === 0) {
      return '—';
    }
    return count === 1 ? 'Used by 1 stack' : `Used by ${count} stacks`;
  }

  protected startCategoryDelete(category: SkillCategoryItem): void {
    if (this.categoryActionId() !== null || this.categoryUsage(category.category) > 0) {
      return;
    }

    this.editingCategoryId.set(null);
    this.categoryDraft.set('');
    this.categoryActionError.set(null);
    this.confirmingDeleteCategoryId.set(category.id);
  }

  protected cancelCategoryDelete(): void {
    this.confirmingDeleteCategoryId.set(null);
    this.categoryActionError.set(null);
  }

  protected async deleteCategory(id: number): Promise<void> {
    if (this.categoryActionId() !== null) {
      return;
    }

    const category = this.state().categories.find((item) => item.id === id);

    this.categoryActionId.set(id);
    this.categoryActionError.set(null);

    try {
      await this.stacks.deleteCategory(id);
      this.state.update((state) => ({
        ...state,
        categories: state.categories.filter((item) => item.id !== id),
      }));
      if (category && this.selectedCategory() === category.category) {
        this.selectedCategory.set('');
      }
      this.confirmingDeleteCategoryId.set(null);
    } catch (error) {
      this.categoryActionError.set(getApiErrorMessage(error));
    } finally {
      this.categoryActionId.set(null);
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

  protected startSkillEdit(skill: TechStackItem): void {
    if (this.skillActionId() !== null) {
      return;
    }

    this.confirmingDeleteSkillId.set(null);
    this.skillActionError.set(null);
    this.skillDraftName.set(skill.stackName ?? '');
    this.skillDraftCategory.set(skill.category ?? '');
    this.editingSkillId.set(skill.id);
  }

  protected cancelSkillEdit(): void {
    this.editingSkillId.set(null);
    this.skillDraftName.set('');
    this.skillDraftCategory.set('');
    this.skillActionError.set(null);
  }

  protected onSkillDraftNameInput(event: Event): void {
    this.skillDraftName.set((event.target as HTMLInputElement).value);
  }

  protected onSkillDraftCategoryChange(event: Event): void {
    this.skillDraftCategory.set((event.target as HTMLSelectElement).value);
  }

  protected async saveSkillEdit(id: number, event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSaveSkillEdit()) {
      return;
    }

    const current = this.state().skills.find((skill) => skill.id === id);
    const stackName = this.skillDraftName().trim();
    const category = this.skillDraftCategory();

    this.skillActionId.set(id);
    this.skillActionError.set(null);

    try {
      const updated = await this.stacks.updateSkill(id, {
        stackName,
        imgSrc: current?.imgSrc ?? null,
        category,
      });
      this.state.update((state) => ({
        ...state,
        skills: state.skills.map((skill) => (skill.id === id ? updated : skill)),
      }));
      this.editingSkillId.set(null);
      this.skillDraftName.set('');
      this.skillDraftCategory.set('');
    } catch (error) {
      this.skillActionError.set(getApiErrorMessage(error));
    } finally {
      this.skillActionId.set(null);
    }
  }

  protected startSkillDelete(skill: TechStackItem): void {
    if (this.skillActionId() !== null) {
      return;
    }

    this.editingSkillId.set(null);
    this.skillDraftName.set('');
    this.skillDraftCategory.set('');
    this.skillActionError.set(null);
    this.confirmingDeleteSkillId.set(skill.id);
  }

  protected cancelSkillDelete(): void {
    this.confirmingDeleteSkillId.set(null);
    this.skillActionError.set(null);
  }

  protected async deleteSkill(id: number): Promise<void> {
    if (this.skillActionId() !== null) {
      return;
    }

    this.skillActionId.set(id);
    this.skillActionError.set(null);

    try {
      await this.stacks.deleteSkill(id);
      this.state.update((state) => ({
        ...state,
        skills: state.skills.filter((skill) => skill.id !== id),
      }));
      this.confirmingDeleteSkillId.set(null);
    } catch (error) {
      this.skillActionError.set(getApiErrorMessage(error));
    } finally {
      this.skillActionId.set(null);
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
}
