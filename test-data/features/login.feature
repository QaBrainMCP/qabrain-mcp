Feature: OrangeHRM Dashboard Learning

  Background:
    Given I open OrangeHRM
    When I enter username "Admin"
    And I enter password "admin123"
    And I click Login
    Then I should see Dashboard

  Scenario: Learn Dashboard Components
    Then I should learn the Dashboard page
    And I should discover the left navigation menu
    And I should discover the Quick Launch section
    And I should discover the My Actions widget
    And I should discover the Buzz Latest Posts widget

  Scenario: Learn Admin Module
    Given I am on Dashboard
    When I click Admin
    Then I should see System Users

  Scenario: Learn PIM Module
    Given I am on Dashboard
    When I click PIM
    Then I should see Employee Information
