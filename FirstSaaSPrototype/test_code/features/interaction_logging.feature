Feature: Interaction Logging
  As a sales representative
  I want to add notes to a lead's interaction history
  So that communication with the prospect is documented

  Background:
    Given I am authenticated as a sales user

  Scenario: Successfully add an interaction note to a lead
    Given a lead exists in the system
    When I add an interaction note "Initial phone call - very interested" to the lead
    Then the response status should be 201
    And the response should contain the note text "Initial phone call - very interested"

  Scenario: Retrieve interaction logs for a lead
    Given a lead exists in the system
    And I add an interaction note "Follow-up email sent" to the lead
    When I retrieve the interaction logs for the lead
    Then the response status should be 200
    And the logs should contain at least 1 entry
