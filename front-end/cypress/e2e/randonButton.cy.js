import { frontUrl } from "./createRecomendatios.cy.js";

describe ("random recommendation button", () => {
    
    it ("should navigate to /random if clicked", () => {
        cy.visit(`${frontUrl}`);
        cy.contains("Random").click();
        cy.url().should("equal", `${frontUrl}/random`);
    });

    it("should display one recommendation", () => {
        cy.visit(`${frontUrl}/random`);
    
        cy.get("article").should(($article) => {
          expect($article).to.have.length(1);
        });
    });
})