import { frontUrl } from "./createRecomendatios.cy.js";

describe ("top recommendation button", () => {

    it ("should navigate to /top if clicked", () => {
        cy.visit(`${frontUrl}`);
        cy.contains("Top").click();
        cy.url().should("equal", `${frontUrl}/top`);
    });

    it("should display songs in descending score order", () => {
        cy.intercept("POST", "/recommendations/*/upvote").as("upvoteRec")

        cy.visit(`${frontUrl}`);

        const voteTestNumber = 5
        for (let i = 0; i < voteTestNumber; i++) {
            cy.get('#up').first().click()
            cy.wait('@upvoteRec')
        }

        cy.visit(`${frontUrl}/top`);

        cy.get("article:first-of-type").should("contain", voteTestNumber);
    });
})