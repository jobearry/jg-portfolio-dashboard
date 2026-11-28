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
  const search = () => element().querySelector('#stack-search') as HTMLInputElement;

  function setInputs(selectedIds: number[] = [], error: string | null = null): void {
    fixture.componentRef.setInput('stacks', stacks);
    fixture.componentRef.setInput('selectedIds', selectedIds);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
  }

  function type(term: string): void {
    search().value = term;
    search().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function pressEnter(): void {
    search().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StackPicker] }).compileComponents();
    fixture = TestBed.createComponent(StackPicker);
  });

  it('rendersOnlyTheSearchFieldWhenNothingIsSelected', () => {
    setInputs();

    expect(search()).toBeTruthy();
    expect(element().querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    expect(element().textContent).not.toContain('Angular');
  });

  it('showsTheFirstMatchAsAnEnterHint', () => {
    setInputs();
    type('ang');

    expect(element().textContent).toContain('Press Enter to add');
    expect(element().textContent).toContain('Angular');
    expect(element().textContent).not.toContain('Spring');
  });

  it('showsAMessageWhenNoStackMatches', () => {
    setInputs();
    type('rust');

    expect(element().textContent).toContain('No matching stack.');
  });

  it('onEnter_EmitsTheMatchedStackAndClearsTheSearch', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs();
    type('type');

    pressEnter();

    expect(selection).toEqual([3]);
    expect(search().value).toBe('');
  });

  it('onEnter_DoesNotReselectAnAlreadySelectedMatch', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs([1]);
    type('ang');

    pressEnter();

    expect(selection).toBeUndefined();
  });

  it('remove_WhenChipClicked_EmitsSelectionWithoutThatStack', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs([1, 2]);

    (element().querySelector('button[aria-label="Remove Angular"]') as HTMLButtonElement).click();

    expect(selection).toEqual([2]);
  });

  it('clear_EmitsAnEmptySelection', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs([1, 2]);

    [...element().querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Clear'))
      ?.click();

    expect(selection).toEqual([]);
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
