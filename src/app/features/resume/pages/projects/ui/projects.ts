import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBriefcase, lucideGithub } from '@ng-icons/lucide';
import { RouterLink } from '@angular/router';
import { Skeleton, StateMessage } from '../../../../../shared';
import { Project as ApiProject } from '../../../../dashboard/core';
import { RepoGrid } from '../../../components/repo-grid/repo-grid';
import { ResumeFooter } from '../../../components/resume-footer/resume-footer';
import { ResumeHeader } from '../../../components/resume-header/resume-header';
import { ResumeSection } from '../../../components/resume-section/resume-section';
import { GithubRepoSignalService } from '../../../github/github-repo.service';
import { ResumeProjectSignalService } from '../../../projects/project.service';
import { ProjectCard } from '../components/project-card/project-card';
import { Project as ProjectHighlight } from '../types/project.type';

@Component({
  selector: 'app-projects',
  imports: [
    NgIcon,
    RouterLink,
    Skeleton,
    StateMessage,
    RepoGrid,
    ResumeHeader,
    ResumeFooter,
    ResumeSection,
    ProjectCard,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideBriefcase, lucideGithub })],
  templateUrl: './projects.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projects implements OnInit {
  private readonly githubRepos = inject(GithubRepoSignalService);
  private readonly projects = inject(ResumeProjectSignalService);

  protected readonly projectState = computed(() => this.projects.getState());
  protected readonly clientProjects = computed(() =>
    this.projectState().content.map(this.toHighlight),
  );
  protected readonly githubState = computed(() => this.githubRepos.getState());
  protected readonly repositories = computed(() => this.githubState().content);

  ngOnInit(): void {
    void this.githubRepos.load();
    void this.projects.load();
  }

  protected loadProjects(): void {
    void this.projects.load();
  }

  protected loadRepositories(): void {
    void this.githubRepos.load();
  }

  protected label(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  private readonly toHighlight = (project: ApiProject): ProjectHighlight => ({
    id: project.id,
    title: project.projectName,
    contribution: project.contribution || project.description,
    tags: project.techStacks?.map((stack) => stack.stackName) ?? [],
  });
}
