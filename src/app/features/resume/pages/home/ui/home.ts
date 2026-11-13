import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAward, lucideBriefcase, lucideCode, lucideGrid } from '@ng-icons/lucide';
import { ResumeFooter } from '../../../components/resume-footer/resume-footer';
import { ResumeHeader } from '../../../components/resume-header/resume-header';
import { ResumeSection } from '../../../components/resume-section/resume-section';
import { About } from '../components/about';
import { Certifications } from '../components/certifications/certifications';
import { Contact } from '../components/contact/contact';
import { Hero } from '../components/hero/hero';
import { RecentRepositories } from '../components/recent-repositories/recent-repositories';
import { TechStackList } from '../components/tech-stack-list/tech-stack-list';
import { Timeline } from '../components/timeline/timeline';

@Component({
  selector: 'app-home',
  imports: [
    NgIcon,
    ResumeHeader,
    ResumeFooter,
    ResumeSection,
    Hero,
    About,
    Timeline,
    Certifications,
    TechStackList,
    RecentRepositories,
    Contact,
  ],
  providers: [provideIcons({ lucideAward, lucideBriefcase, lucideCode, lucideGrid })],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
