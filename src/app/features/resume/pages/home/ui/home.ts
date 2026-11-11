import { Component, HostListener, OnInit } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAward,
  lucideBlocks,
  lucideHistory,
  lucideIdCard,
  lucideToolbox,
} from '@ng-icons/lucide';
import { MAIN_BLOCK_CONTENT, SIDE_BLOCK_CONTENT } from '../constants/home.constants';
import { DynamicHostComponent } from '../components/host';
import { BlockComponent } from '../components/block-container/block-container';
import { Profile } from '../components/profile/profile';
import { ResumeFooter } from '../../../components/resume-footer/resume-footer';

@Component({
  selector: 'app-home',
  imports: [BlockComponent, Profile, NgIcon, DynamicHostComponent, ResumeFooter],
  providers: [
    provideIcons({ lucideAward, lucideBlocks, lucideHistory, lucideIdCard, lucideToolbox }),
  ],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  sideblock = SIDE_BLOCK_CONTENT;
  mainblock = MAIN_BLOCK_CONTENT;
  isDesktop = window.innerHeight >= 768;
  @HostListener('window:resize') onResize() {
    this.isDesktop = window.innerWidth >= 768;
  }
  ngOnInit(): void {
    this.isDesktop = window.innerWidth >= 768;
  }
}
