export const apiUrl = "http://localhost:5000"
export const frontUrl = "http://localhost:3000"

describe ("Create Recomedation", () => {
    beforeEach(() => {
        cy.request("POST", `${apiUrl}/e2e/reset`, {});
    });

    it ("recommendation input validation", () => {
        const recommendations = [
            {name: "Mari Fernandez - Intuição" , link: "https://www.youtube.com/watch?v=rfkXgby-xn0"},
            {name: "Gabriel Diniz - Paraquedas", link: "https://www.youtube.com/watch?v=6rZuOPAB5nw"}
        ]

        cy.visit(`${frontUrl}`);
        cy.get('input[placeholder="Name"]').type(recommendations[0].name);
        cy.get('input[placeholder="https://youtu.be/..."]').type(recommendations[0].link);

        cy.intercept("POST", `${apiUrl}/recommendations`).as("createRecomendation")

        cy.get("button").click();
        cy.wait("@createRecomendation");

        cy.contains(recommendations[0].name);

        // Postar Segunda Musica

        cy.visit(`${frontUrl}`);
        cy.get('input[placeholder="Name"]').type(recommendations[1].name);
        cy.get('input[placeholder="https://youtu.be/..."]').type(recommendations[1].link);

        cy.intercept("POST", `${apiUrl}/recommendations`).as("createRecomendation")

        cy.get("button").click();
        cy.wait("@createRecomendation");

        cy.contains(recommendations[1].name);
    })
})
