import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ResumeSection } from './resume-section';

@Component({
  imports: [ResumeSection],
  template: `
    <app-resume-section sectionId="about" title="About">
      <p>About content</p>
    </app-resume-section>
  `,
})
class ResumeSectionHost {}

describe('ResumeSection', () => {
  it('renders a labelled panel with the projected content', () => {
    const fixture = TestBed.createComponent(ResumeSectionHost);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const section = element.querySelector('section');

    expect(section?.getAttribute('aria-labelledby')).toBe('about-heading');
    expect(element.querySelector('h2#about-heading')?.textContent?.trim()).toBe('About');
    expect(element.textContent).toContain('About content');
  });
});
