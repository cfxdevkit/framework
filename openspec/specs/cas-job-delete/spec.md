## ADDED Requirements

### Requirement: Job owner can hard-delete their own job
The system SHALL expose a `DELETE /jobs/:id` endpoint that permanently removes a job record from the database. The job owner (or an admin) SHALL be authorized to call it.

#### Scenario: Successful delete by owner
- **WHEN** an authenticated user sends `DELETE /jobs/:id` for a job they own
- **THEN** the backend SHALL delete the job row and respond with `200` and the deleted job DTO

#### Scenario: Delete by non-owner returns 404
- **WHEN** an authenticated user sends `DELETE /jobs/:id` for a job they do not own
- **THEN** the backend SHALL respond with `404 { error: "job not found" }`

#### Scenario: Delete non-existent job returns 404
- **WHEN** an authenticated user sends `DELETE /jobs/:id` for an id that does not exist
- **THEN** the backend SHALL respond with `404 { error: "job not found" }`

#### Scenario: Admin can delete any job
- **WHEN** an admin sends `DELETE /jobs/:id` for any job regardless of owner
- **THEN** the backend SHALL delete the job and respond with `200`

### Requirement: CasApiClient exposes deleteJob method
The `CasApiClient` SHALL expose a `deleteJob(id: string)` method that sends `DELETE /jobs/:id` and returns `CasJobResponse`.

#### Scenario: deleteJob call
- **WHEN** `client.deleteJob(id)` is called with a valid job id
- **THEN** it SHALL send `DELETE /jobs/{id}` with the auth token and return the deleted job DTO
