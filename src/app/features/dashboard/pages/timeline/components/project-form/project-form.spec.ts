import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    });
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
