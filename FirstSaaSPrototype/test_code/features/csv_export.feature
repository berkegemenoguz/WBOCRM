Feature: CSV Export
  As a sales manager
  I want to export leads as a CSV file
  So that I can analyse data in Excel or share it offline

  Background:
    Given I am authenticated as a sales user

  Scenario: Successfully export leads as CSV
    When I request the leads CSV export
    Then the response status should be 200
    And the response content-type should be "text/csv"
    And the CSV should contain the header "lead_id,contact_name,email"
