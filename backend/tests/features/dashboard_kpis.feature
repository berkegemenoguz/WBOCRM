Feature: Dashboard KPIs
  As a CRM user
  I want to see real-time KPIs on the dashboard
  So that I have an instant overview of the team's activity

  Background:
    Given I am authenticated as a sales user

  Scenario: Dashboard returns all KPI fields
    When I request the dashboard
    Then the response status should be 200
    And the dashboard should contain "activeLeads"
    And the dashboard should contain "openTickets"
    And the dashboard should contain "top5"
    And the dashboard should contain "monthlyRevenue"

  Scenario: Dashboard top5 contains leads sorted by score
    When I request the dashboard
    Then the response status should be 200
    And the dashboard top5 should be an array
