Feature: Pipeline Stage Management
  As a sales representative
  I want to update a lead's pipeline stage
  So that the pipeline reflects the current deal status

  Background:
    Given I am authenticated as a sales user

  Scenario: Successfully update pipeline stage to Qualified
    Given a lead exists in the system
    When I update the lead pipeline stage to "Qualified"
    Then the response status should be 200
    And the lead pipeline_stage should be "Qualified"

  Scenario: Reject invalid pipeline stage
    Given a lead exists in the system
    When I update the lead pipeline stage to "InvalidStage"
    Then the response status should be 400
    And the response error should be "INVALID_STAGE"
