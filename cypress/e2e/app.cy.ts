describe('challenges app', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/chat', {
      statusCode: 200,
      body: {
        message: {
          content: 'Mock tutor response for tests.',
        },
      },
    }).as('ollamaChat')
  })

  it('renders challenge list', () => {
    cy.visit('/challenges')
    cy.get('[data-testid="challenge-list"]')
      .children()
      .should('have.length.greaterThan', 10)
  })

  it('filters by type', () => {
    cy.visit('/challenges')
    cy.get('[data-testid="filter-type"]').select('quiz')
    cy.url().should('include', 'type=quiz')
    cy.contains('Idempotent HTTP methods').should('exist')
    cy.contains('Implement a closure counter').should('not.exist')
  })

  it('quiz interaction shows feedback', () => {
    cy.visit('/challenges/quiz-http-methods')
    cy.contains('Idempotent HTTP').should('be.visible')
    cy.get('input[type="radio"]').eq(1).check()
    cy.get('[data-testid="quiz-check"]').click()
    cy.contains('Correct').should('be.visible')
  })

  it('AI tutor panel shows mocked response', () => {
    cy.visit('/challenges/js-closure-counter')
    cy.get('[data-testid="ai-tutor-panel"]')
      .scrollIntoView()
      .should('be.visible')
    cy.contains('button', 'Give me a hint').click()
    cy.wait('@ollamaChat')
    cy.get('[data-testid="ai-tutor-response"]').should(
      'contain',
      'Mock tutor',
    )
  })

  it('coding workspace: collapse problem, run code shows test output', () => {
    cy.viewport(1600, 900)
    cy.visit('/challenges/js-closure-counter')
    cy.contains('h1', /Implement a closure counter/i).should('be.visible')
    cy.get('[data-testid="toggle-problem-panel"]').click()
    cy.contains('h1', /Implement a closure counter/i).should('not.exist')
    cy.get('[data-testid="ai-tutor-panel"]').should('exist')
    cy.get('[data-testid="toggle-problem-panel"]').click()
    cy.contains('h1', /Implement a closure counter/i).should('be.visible')
    cy.get('[data-testid="run-tests"]').click()
    cy.get('[data-testid="test-results"]').should('exist')
  })
})
