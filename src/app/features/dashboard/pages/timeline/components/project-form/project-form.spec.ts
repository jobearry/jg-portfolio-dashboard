import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TechStackItem } from '../../../../core';
import { ProjectForm } from './project-form';

describe('ProjectForm', () => {
  let fixture: ComponentFixture<ProjectForm>;

  const element = () => fixture.nativeElement as HTMLElement;
  const input = (id: string) => element().querySelector(`#${id}`) as HTMLInputElement;
  const textarea = (id: string) => element().querySelector(`#${id}`) as HTMLTextAreaElement;
  const save = () =>
    [...element().querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Save project'),
    ) as HTMLButtonElement;

  const stacks: TechStackItem[] = [
    { id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' },
    { id: 2, stackName: 'Spring', imgSrc: null, category: 'Backend' },
  ];

  function setValue(selector: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    selector.value = value;
    selector.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectForm);
    fixture.detectChanges();
  });

  it('whenProjectNameIsEmpty_SaveIsDisabled', () => {
    expect(save().hasAttribute('disabled')).toBe(true);
  });

  it('submit_EmitsTrimmedPayload', () => {
    let payload: unknown;
    fixture.componentInstance.saved.subscribe((value) => (payload = value));

    setValue(input('project-name'), '  Portal  ');
    setValue(textarea('project-description'), ' Internal dashboard ');
    setValue(textarea('project-contribution'), ' Frontend ');
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
    fixture.detectChanges();

    expect(payload).toEqual({
      projectName: 'Portal',
      description: 'Internal dashboard',
      contribution: 'Frontend',
      techStackIds: [],
    });
  });

  it('submit_IncludesSelectedStackIds', () => {
    let payload: unknown;
    fixture.componentInstance.saved.subscribe((value) => (payload = value));
    fixture.componentRef.setInput('stacks', stacks);
    fixture.detectChanges();

    const checkbox = element().querySelector(
      'input[type="checkbox"][value="1"]',
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    setValue(input('project-name'), 'Portal');
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
    fixture.detectChanges();

    expect(payload).toMatchObject({ techStackIds: [1] });
  });

  it('whenApiErrorIsProvided_RendersAlert', () => {
    fixture.componentRef.setInput('error', 'Project name is required.');
    fixture.detectChanges();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain(
      'Project name is required.',
    );
  });

  it('whenBusy_SaveIsDisabled', () => {
    setValue(input('project-name'), 'Portal');
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();

    expect(save().hasAttribute('disabled')).toBe(true);
  });
});
