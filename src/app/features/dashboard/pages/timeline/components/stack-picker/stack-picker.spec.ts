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

  function pressKey(key: string): void {
    search().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
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

  it('showsMatchingStacksInAListboxAndExcludesSelectedStacks', () => {
    setInputs([1]);
    type('t');

    expect(element().querySelector('[role="listbox"]')?.getAttribute('id')).toBe(
      'stack-search-listbox',
    );
    expect(
      [...element().querySelectorAll('[role="option"]')].map((option) =>
        option.textContent?.trim(),
      ),
    ).toEqual(['TypeScript']);
  });

  it('exposesComboboxSemanticsWithTheFirstOptionActive', () => {
    setInputs();
    type('an');

    expect(search().getAttribute('role')).toBe('combobox');
    expect(search().getAttribute('aria-expanded')).toBe('true');
    expect(search().getAttribute('aria-controls')).toBe('stack-search-listbox');
    expect(search().getAttribute('aria-activedescendant')).toBe('stack-option-1');
    expect(element().querySelector('#stack-option-1')?.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowDownMovesTheActiveOptionAndEnterAddsThatStack', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs();
    type('p');

    pressKey('ArrowDown');

    expect(search().getAttribute('aria-activedescendant')).toBe('stack-option-3');

    pressKey('Enter');

    expect(selection).toEqual([3]);
    expect(search().value).toBe('');
  });

  it('ArrowUpWrapsToTheLastOption', () => {
    setInputs();
    type('p');

    pressKey('ArrowUp');

    expect(search().getAttribute('aria-activedescendant')).toBe('stack-option-3');
  });

  it('EscapeClosesTheListAndTypingReopensIt', () => {
    setInputs();
    type('ang');

    pressKey('Escape');

    expect(element().querySelector('[role="listbox"]')).toBeNull();

    type('spr');

    expect(element().querySelector('[role="listbox"]')).not.toBeNull();
  });

  it('clickingAnOptionAddsThatStackAndClearsTheSearch', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs();
    type('ang');

    (element().querySelector('#stack-option-1') as HTMLElement).click();
    fixture.detectChanges();

    expect(selection).toEqual([1]);
    expect(search().value).toBe('');
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

    pressKey('Enter');

    expect(selection).toEqual([3]);
    expect(search().value).toBe('');
  });

  it('onEnter_DoesNotReselectAnAlreadySelectedMatch', () => {
    let selection: number[] | undefined;
    fixture.componentInstance.selectionChange.subscribe((value) => (selection = value));
    setInputs([1]);
    type('ang');

    pressKey('Enter');

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
