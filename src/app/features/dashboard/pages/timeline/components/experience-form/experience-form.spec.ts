import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExperienceTimeline } from '../../../../core';
import { ExperienceForm } from './experience-form';

describe('ExperienceForm', () => {
  let fixture: ComponentFixture<ExperienceForm>;

  const experience: ExperienceTimeline = {
    id: 7,
    company: 'Acme',
    role: 'Engineer',
    startedAt: '2020-01-01T00:00:00',
    finishedAt: null,
    durationMonths: 12,
    description: 'Built things',
    responsibility: 'Shipped features',
    type: 'Full-time',
    projects: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperienceForm);
  });

  const element = () => fixture.nativeElement as HTMLElement;
  const input = (id: string) => element().querySelector(`#${id}`) as HTMLInputElement;
  const save = () =>
    [...element().querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Save'),
    );

  function type(id: string, value: string): void {
    input(id).value = value;
    input(id).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('whenEditing_PrefillsFieldsAndUsesDateOnlyValues', () => {
    fixture.componentRef.setInput('experience', experience);
    fixture.detectChanges();

    expect(input('experience-company').value).toBe('Acme');
    expect(input('experience-role').value).toBe('Engineer');
    expect(input('experience-started-at').value).toBe('2020-01-01');
    expect(input('experience-finished-at').value).toBe('');
  });

  it('whenRequiredFieldsAreEmpty_SaveIsDisabled', () => {
    fixture.detectChanges();

    expect(save()?.hasAttribute('disabled')).toBe(true);
  });

  it('submit_EmitsTrimmedPayloadWithIsoDates', () => {
    let payload: unknown;
    fixture.componentInstance.saved.subscribe((value) => (payload = value));
    fixture.detectChanges();

    type('experience-company', '  Acme  ');
    type('experience-role', ' Engineer ');
    type('experience-started-at', '2020-01-01');
    type('experience-finished-at', '2022-06-30');
    type('experience-type', ' Full-time ');
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
    fixture.detectChanges();

    expect(payload).toEqual({
      company: 'Acme',
      role: 'Engineer',
      startedAt: '2020-01-01T00:00:00.000Z',
      finishedAt: '2022-06-30T00:00:00.000Z',
      description: null,
      responsibility: null,
      type: 'Full-time',
    });
  });

  it('cancel_EmitsCancelled', () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    fixture.detectChanges();

    [...element().querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Cancel'))
      ?.click();

    expect(cancelled).toBe(true);
  });

  it('whenApiErrorIsProvided_RendersAlert', () => {
    fixture.componentRef.setInput('error', 'The API rejected the request.');
    fixture.detectChanges();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain(
      'The API rejected the request.',
    );
  });
});
