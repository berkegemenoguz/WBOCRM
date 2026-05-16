Feature: Duplicate Email Rejection
  As a sales representative
  I want the system to reject duplicate lead emails
  So that the lead database remains clean and consistent

  Background:
    Given I am authenticated as a sales user

  Scenario: Reject registration with an already-existing email
    Given a lead with email "bdd_dup@test.wbocrm" already exists
    When I submit a new lead with email "bdd_dup@test.wbocrm" and name "Duplicate Lead"
    Then the response status should be 409
    And the response error should be "DUPLICATE_EMAIL"

  Scenario: Allow registration with a unique email
    When I submit a new lead with email "bdd_unique@test.wbocrm" and name "Unique Lead"
    Then the response status should be 201
    And the response should contain a lead_id
