Feature: User Authentication
  As a CRM user
  I want to log in with my credentials
  So that I can access the system securely

  Scenario: Successful login with valid credentials
    When I log in with email "bdd_auth_sales@test.wbocrm" and password "BddAuth123!"
    Then the response status should be 200
    And the response should contain a token
    And the token payload should include role "sales"

  Scenario: Failed login with invalid password
    When I log in with email "bdd_auth_sales@test.wbocrm" and password "WrongPass999!"
    Then the response status should be 401

  Scenario: Rejected request without token
    When I request the leads list without a token
    Then the response status should be 401

  Scenario: Rejected request with insufficient role
    Given I am authenticated as a support user
    When I attempt to create a lead as a support user
    Then the response status should be 403
