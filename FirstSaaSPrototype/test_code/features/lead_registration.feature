Feature: Lead Registration
  As a sales representative
  I want to register new leads in the system
  So that I can track potential customers

  Background:
    Given I am authenticated as a sales user

  Scenario: Successfully register a new lead
    When I submit a new lead with email "bdd_lead@test.wbocrm" and name "BDD Lead"
    Then the response status should be 201
    And the response should contain a lead_id

  Scenario: Reject duplicate email registration
    Given a lead with email "bdd_dup@test.wbocrm" already exists
    When I submit a new lead with email "bdd_dup@test.wbocrm" and name "Dup Lead"
    Then the response status should be 400
    And the response error should be "DUPLICATE_EMAIL"
