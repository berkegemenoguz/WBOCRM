Feature: Lead Priority Scoring
  As a sales representative
  I want leads to be scored automatically
  So that I can prioritize high-value prospects

  Background:
    Given I am authenticated as a sales user

  Scenario: Lead with high engagement metrics receives high score
    When I create a lead with metrics calls 20 meetings 5 budget "high" companySize "enterprise" emailOpens 20
    Then the response status should be 201
    And the lead priority_score should be greater than 70

  Scenario: Lead with no engagement receives low score
    When I create a lead with metrics calls 0 meetings 0 budget "low" companySize "small" emailOpens 0
    Then the response status should be 201
    And the lead priority_score should be less than 30

  Scenario: Leads list is sorted by priority score descending
    When I retrieve all leads
    Then the response status should be 200
    And leads should be ordered by priority_score descending
