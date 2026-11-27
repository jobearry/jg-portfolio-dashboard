# Testing rules

## 1. Why test-first here

Angular with Vitest. Tests matter because:

1. **Component logic and signal state is easy to regress.** Loading/empty/error states, signal computations, and template bindings need executable proof.
2. **AI-generated code is plausible-looking.** The failure mode is not a syntax error; it is code that compiles, renders, and is subtly wrong (e.g., missing error state, wrong signal updates). A test is the only cheap oracle.

So: **TDD is the default for component logic, signal state, services, and HTTP contracts.** It is *not* required for trivial pass-through components — writing a test that asserts a template renders adds noise, not safety.

| Change | Test-first? |
|---|---|
| Signal state with branching | **Yes** |
| Service with HTTP calls and error handling | **Yes** |
| Component template logic (conditionals, loops) | **Yes** |
| API response type/shape contract | **Yes** |
| Pure presentational component | No |
| Configuration / DI wiring | Smoke test only |

## 2. Test projects

```
src/app/
  **/*.spec.ts               # component, service, pipe, directive tests (Vitest)
```

Use the existing test file conventions. Ask before adding a testing package.

## 3. The loop

1. **Red** — write the smallest failing test that states the behaviour.
   Run it. Confirm it fails *for the right reason*.
2. **Green** — write the minimum code to pass. No speculative generality.
3. **Refactor** — improve names and structure with the test green.
4. Commit. Repeat.

Example for a service error handling:

```typescript
it('should return error state when API fails', async () => {
  // Arrange
  const mockApi = { getProjects: vi.fn().mockRejectedValue(new Error('Network error')) };
  
  // Act
  const result = await service.loadProjects();
  
  // Assert
  expect(result).toEqual({ status: 'error', error: 'Network error' });
});
```

That test fails today (service returns loading forever). It is the specification for the change, not an afterthought.

## 4. Naming

```
MethodOrProperty_Scenario_ExpectedOutcome
```

- `loadProjects_WhenApiFails_ReturnsErrorState`
- `ProjectCardComponent_WhenNoDescription_RendersPlaceholder`
- `ApiClient_WhenRequestTimesOut_ReturnsTimeoutError`

One behaviour per test. No `Test1`. No `expect(true).toBe(true)`.

## 5. Structure

Arrange / Act / Assert, visually separated by blank lines. Prefer a small builder over 20 lines of setup:

```typescript
const project = aProject()
  .withTitle('Test Project')
  .withDescription('Description')
  .build();
```

Test data must be **explicit** — no shared mutable fixtures, no ordering dependencies.

## 6. HTTP testing

- Use `HttpTestingController` for service tests
- Assert on **outcomes** (returned value, signal state), not on call counts, unless the call itself is the contract (e.g. "must not hit the API twice")
- Test loading, success, empty, and error states explicitly

## 7. Component tests

- Use `ComponentFixture` for DOM assertions
- Test rendering of loading/empty/error states
- Test user interactions (clicks, inputs) that change signals
- Assert on visible text/attributes, not implementation details

## 8. Mapping tests are mandatory

Service mappers (API response → internal model) are a high-risk boundary. Every direction that is used must have a runtime test:

```typescript
it('maps API experience to model preserving dates', () => {
  const apiExp = { id: 1, role: 'Dev', startedAt: '2023-01-01', finishedAt: null };
  const result = ExperienceMapper.fromApi(apiExp);
  expect(result.startedAt).toEqual(new Date('2023-01-01'));
  expect(result.finishedAt).toBeNull();
});
```

Assert mapped values, especially dates, nullable fields, and arrays. There is no `AssertConfigurationIsValid()` equivalent; a test that only constructs the mapper proves nothing.

## 9. What not to test

- Framework behaviour (Angular routing, change detection, signals internals)
- Private methods
- Getters and setters with no logic
- The exact text of an error message — assert the **kind**/status code instead
- Third-party library internals

## 10. Gates

- `npm test` must pass before merge.
- A bug fix without a regression test is not complete.
- Coverage percentage is not a target. "Every invariant has a test" is the target.