import { Component, OnInit, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBlocks } from '@ng-icons/lucide';
import { Router } from '@angular/router';
import { Highlights } from '../components/highlights';
import { BlockComponent } from '../../home/components/block-container/block-container';
import { Github } from '../../../github/ui/github';
import { GithubRepoSignalService } from '../../../github/github-repo.service';
import { Pill } from '../../../components/pill';
import { ThemeToggler } from '../../../components/theme-toggler';
import { DashboardLink } from '../../../components/dashboard-link';
import { ResumeFooter } from '../../../components/resume-footer/resume-footer';
import { ResumeProjectSignalService } from '../../../projects/project.service';
import { Project as ApiProject } from '../../../../dashboard/core';
import { Project as ProjectHighlight } from '../types/project.type';

@Component({
  selector: 'app-projects',
  imports: [
    Highlights,
    NgIcon,
    BlockComponent,
    Github,
    Pill,
    ThemeToggler,
    DashboardLink,
    ResumeFooter,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideBlocks })],
  templateUrl: './projects.html',
  styles: ``,
})
export class Projects implements OnInit {
  private readonly router = inject(Router);
  private readonly githubRepos = inject(GithubRepoSignalService);
  private readonly projects = inject(ResumeProjectSignalService);

  readonly projectState = computed(() => this.projects.getState());
  readonly corpoProjects = computed(() => this.projectState().content.map(this.toHighlight));
  readonly githubState = computed(() => this.githubRepos.getState());

  ngOnInit(): void {
    void this.githubRepos.load();
    void this.projects.load();
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }

  loadProjects(): void {
    void this.projects.load();
  }

  private readonly toHighlight = (project: ApiProject): ProjectHighlight => ({
    id: project.projectId,
    title: project.projectName,
    contribution: project.contribution || project.description,
    tags: project.techStackSpecs?.map((spec) => spec.toolName) ?? [],
  });
}
