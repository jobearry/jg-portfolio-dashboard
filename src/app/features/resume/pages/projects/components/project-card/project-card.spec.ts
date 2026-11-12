import { TestBed } from '@angular/core/testing';
import { ProjectCard } from './project-card';

describe('ProjectCard', () => {
  const render = () => {
    const fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('project', {
      id: 1,
      title: 'Client portal',
      contribution: 'Delivered the portal',
      tags: ['Angular', '.NET'],
    });
    fixture.componentRef.setInput('index', '02');
    fixture.detectChanges();
    return fixture;
  };

  it('renders the project title, contribution, tags, and index', () => {
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelector('h3')?.textContent?.trim()).toBe('Client portal');
    expect(element.textContent).toContain('Delivered the portal');
    expect(element.textContent).toContain('Angular');
    expect(element.textContent).toContain('.NET');
    expect(element.textContent).toContain('02');
    expect(element.querySelector('[aria-label="Project technologies"]')).toBeTruthy();
    expect(element.querySelector('a')).toBeNull();
  });

  it('falls back to a neutral mark when the title has no letters or digits', () => {
    const fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('project', {
      id: 2,
      title: '—',
      contribution: 'No content',
      tags: [],
    });
    fixture.detectChanges();

    const mark = (fixture.nativeElement as HTMLElement).querySelector('[aria-hidden="true"]');
    expect(mark?.textContent?.trim()).toBe('·');
    expect((fixture.nativeElement as HTMLElement).querySelector('ul')).toBeNull();
  });
});
