import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RepoGrid } from '../../../../components/repo-grid/repo-grid';
import { GithubRepoSignalService } from '../../../../github/github-repo.service';

@Component({
  selector: 'app-recent-repositories',
  imports: [RepoGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-repo-grid
      [repos]="repositories()"
      [loading]="state().loading"
      [error]="state().error"
      [showViewMore]="true"
      (retry)="retry()"
    />
  `,
})
export class RecentRepositories implements OnInit {
  private readonly githubRepos = inject(GithubRepoSignalService);

  protected readonly state = computed(() => this.githubRepos.getState());
  protected readonly repositories = computed(() => this.state().content.slice(0, 2));

  ngOnInit(): void {
    void this.githubRepos.load();
  }

  protected retry(): void {
    void this.githubRepos.load();
  }
}
