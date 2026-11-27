---
name: add-crud-slice
description: Add a CRUD feature to the portfolio API (if allowed by product decision)
---

# Add a CRUD Feature

Follow the vertical-slice shape and add this to an existing or new slice.

## Preconditions

- The product has approved adding CRUD functionality
- The feature is needed for user-facing functionality
- You have approval to modify the backend API

## Steps

### 1. Define the domain model

Create or update the domain entity in `src/Portfolio/Shared/Common/`:
- Define the aggregate root with proper invariants
- Use value objects where appropriate
- No EF attributes

### 2. Add repository port

In `src/Portfolio/Features/<Slice>/<Slice>Repository.cs`:
- Define the repository interface with CRUD methods
- Ensure it returns `Result<T>` for all operations
- Pass `CancellationToken` to all I/O methods

### 3. Implement repository

In `src/Portfolio/Features/<Slice>/Ef<Slice>Repository.cs`:
- Implement the CRUD methods with proper EF Core usage
- Use `.AsNoTracking()` for reads
- Use `.AsSplitQuery()` for sibling includes
- Validate inputs and handle errors appropriately

### 4. Add DTOs

Create request and response DTOs in `src/Portfolio/Features/<Slice>/`:
- Request DTOs for Create/Update operations with validation
- Response DTOs for all operations
- No domain or EF types

### 5. Add handler

Create a handler in `src/Portfolio/Features/<Slice>/<Slice>Handler.cs`:
- Handle input validation
- Call repository methods
- Return `Result<T>` with proper error handling
- Log failures with structured context

### 6. Add endpoints

In `src/Portfolio/Features/<Slice>/<Slice>Endpoints.cs`:
- Add CRUD endpoints under `/api/v1/<slice>`
- Use proper HTTP methods (POST, PUT, PATCH, DELETE)
- Return appropriate status codes
- Include `.WithName`, `.WithTags`, `.Produces`, `.ProducesProblem`

### 7. Add tests

- One success test for each CRUD operation
- One failure test for each operation (e.g., validation error, not found)
- Use hand-written fakes for repository in unit tests
- Add integration test with WebApplicationFactory for end-to-end verification

### 8. Update docs

- `docs/api-reference.md`: document new endpoints
- `docs/known-issues.md`: note any new gaps
- Update `docs/api-reference.md` with sample requests/responses

## Anti-patterns to avoid

- Returning `result.Value` without checking `IsSuccess`
- Hardcoding status codes instead of using `ApiResult.ToHttpResult()`
- Adding write operations without approval
- Adding CRUD without updating API contract in `docs/`
- Adding private setters to domain entities
- Using `[FromServices]` attributes on parameters
- Adding secrets or tokens in query strings
- Not passing `CancellationToken` through all I/O calls