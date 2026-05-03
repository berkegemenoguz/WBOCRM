Feature: Support Ticket Creation
  As a support agent
  I want to create support tickets linked to leads
  So that I can track customer issues

  Background:
    Given I am authenticated as a support user

  Scenario: Successfully create a support ticket
    Given a lead exists in the system
    When I create a ticket with description "BDD test ticket" and priority "Low"
    Then the response status should be 201
    And the response should contain a ticket_id

  Scenario: Update a ticket status
    Given an existing support ticket
    When I update the ticket status to "In Progress"
    Then the response status should be 200
    And the ticket status should be "In Progress"
