import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TechStackItem } from '../../../../core';
import { StackPicker } from './stack-picker';

describe('StackPicker', () => {
  let fixture: ComponentFixture<StackPicker>;

  const stacks: TechStackItem[] = [
    { id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' },
    { id: 2, stackName: 'Spring', imgSrc: null, category: 'Backend' },
    { id: 3, stackName: 'TypeScript', imgSrc: null, category: 'Frontend' },
  ];

  const element = () => fixture.nativeElement as HTMLElement;

  function setInputs(selectedIds: number[] = [], error: string | null = null): void {
    fixture.componentRef.setInput('stacks', stacks);
    fixture.componentRef.setInput('selectedIds', selectedIds);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StackPicker] }).compileComponents();
    fixture = TestBed.createComponent(StackPicker);
  });

  it('groups stacks by category', () => {
    setInputs();

    const legends = [...element().querySelectorAll('legend')].map((node) =>
      node.textContent?.trim(),
    );

    expect(legends).toContain('Frontend');
    expect(legends).toContain('Backend');
    expect(element().textContent).toContain('Angular');
    expect(element().textContent).toContain('Spring');
  });

  it('filters stacks by the search term', () => {
    setInputs();
    const search = element().querySelector('#stack-search') as HTMLInputElement;
    search.value = 'ang';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element().textContent).toContain('Angular');
    expect(element().textContent).not.toContain('Spring');
    expect(element().textContent).not.toContain('TypeScript');
  });

  it('toggle_WhenChecked_EmitsTheNewSelection', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs();

    const checkbox = element().querySelector(
      'input[type="checkbox"][value="2"]',
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(selection).toEqual([2]);
  });

  it('remove_WhenChipClicked_EmitsSelectionWithoutThatStack', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs([1, 2]);

    (element().querySelector('button[aria-label="Remove Angular"]') as HTMLButtonElement).click();

    expect(selection).toEqual([2]);
  });

  it('whenCatalogFails_RendersErrorAndRetry', () => {
    let retried = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    setInputs([], 'Stacks could not be loaded.');

    expect(element().querySelector('[role="alert"]')?.textContent).toContain(
      'Stacks could not be loaded.',
    );

    [...element().querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Try again'))
      ?.click();

    expect(retried).toBe(true);
  });
});
