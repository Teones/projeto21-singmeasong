import { faker } from "@faker-js/faker";
import supertest from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/database";

beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE recommendations`;
})

afterAll(async () => {
    await prisma.$disconnect();
})

const newRecommendation = {
    name: faker.music.songName(),
    youtubeLink: "https://www.youtube.com/watch?v=ExjmOdBCB_4"
}

describe("POST /recommendations", () => {
    it("check if a new recommendation has been added, 201", async () => {
        const response = await supertest(app)
            .post("/recommendations")
            .send(newRecommendation)

        const check = await prisma.recommendation.findFirst({
            where: {
                name: newRecommendation.name
            }
        })

        expect(response.status).toBe(201);
        expect(check).not.toBeNull();
        expect(check).not.toBeUndefined();
    })
    it("check if the recommendation conflicted, 409", async () => {
        await prisma.recommendation.create({
            data: newRecommendation
        })

        const response = await supertest(app)
            .post("/recommendations")
            .send(newRecommendation)

        expect(response.status).toBe(409);
    })
    it("checks if the entries are correct, 404", async () => {
        const response = await supertest(app)
            .post("/recommendations")
            .send({... newRecommendation, youtubeLink: faker.internet.url()})

        expect(response.status).toBe(422);
    })
})


describe("POST /recommendations/:id/(upvote || downvote)", () => {
    it("check if the recommendation was upvoted by id", async () => {
        await prisma.recommendation.create({
            data: newRecommendation
        })
        const check = await prisma.recommendation.findFirst({ where: {
            name: newRecommendation.name 
        }})

        const response = await supertest(app)
            .post(`/recommendations/${check.id}/upvote`)

        const check2 = await prisma.recommendation.findFirst({ where: {
            name: newRecommendation.name 
        }})

        expect(response.status).toBe(200);
        expect(check).not.toBeNull();
        expect(check).not.toBeUndefined();
        expect(check2.score).toBe(Number(check.score) + 1);
    })
    it("check if the recommendation was downvote by id", async () => {
        await prisma.recommendation.create({
            data: newRecommendation
        })
        const check = await prisma.recommendation.findFirst({ where: {
            name: newRecommendation.name 
        }})

        const response = await supertest(app)
            .post(`/recommendations/${check.id}/downvote`)

        const check2 = await prisma.recommendation.findFirst({ where: {
            name: newRecommendation.name 
        }})

        expect(response.status).toBe(200);
        expect(check).not.toBeNull();
        expect(check).not.toBeUndefined();
        expect(check2.score).toBe(Number(check.score) - 1);
    })
    it("check if the recommendation was deleted after reaching -6 votes", async () => {
        await prisma.recommendation.create({
            data: newRecommendation
        })
        const check = await prisma.recommendation.findFirst({ where: {
            name: newRecommendation.name 
        }})

        for(let i = 0; i < 6; i ++) {
            await supertest(app).post(`/recommendations/${check.id}/downvote`)
        }
            
        const check2 = await prisma.recommendation.findFirst({ where: {
            name: newRecommendation.name 
        }})

        expect(check).not.toBeNull();
        expect(check).not.toBeUndefined();
        expect(check2).toBeNull();
    })
})

describe("GET /recommendations", () => {
    it("check if it returns the last 10 recommendations", async () => {
        for(let i = 0; i < 15; i++) {
            await prisma.recommendation.create({
                data: {
                    name: faker.lorem.words(4),
                    youtubeLink: "https://www.youtube.com/watch?v=ExjmOdBCB_4"
                }
            })
        }

        const response = await supertest(app).get("/recommendations")

        expect(response.body.length).toBe(10);
        expect(response.body[0].name).not.toBeNull();
        expect(response.body[0].name).not.toBeUndefined();
    })
    it("check if it returns the last 7 recommendations", async () => {
        for(let i = 0; i < 7; i++) {
            await prisma.recommendation.create({
                data: {
                    name: faker.lorem.words(4),
                    youtubeLink: "https://www.youtube.com/watch?v=ExjmOdBCB_4"
                }
            })
        }

        const response = await supertest(app).get("/recommendations")

        expect(response.body.length).toBe(7);
        expect(response.body[0].name).not.toBeNull();
        expect(response.body[0].name).not.toBeUndefined();
    })
})

describe("GET /recommendations/:id", () => {
    it("check if it returns the recommendation by the id passed", async () => {
        const create = await prisma.recommendation.create({
            data: newRecommendation
        })

        const response = await supertest(app).get(`/recommendations/${create.id}`)

        expect(response.body.id).not.toBeNull()
        expect(response.body.id).not.toBeUndefined()
        expect(response.body.id).toBe(create.id)
    })
})

describe("GET /recommendations/random", () => {
    it("check if it returns a random recommendation", async () => {
        for(let i = 0; i < 7; i++) {
            await prisma.recommendation.create({
                data: {
                    name: faker.lorem.words(4),
                    youtubeLink: "https://www.youtube.com/watch?v=ExjmOdBCB_4"
                }
            })
        }

        const check1 = await supertest(app).get("/recommendations/random")
        const check2 = await supertest(app).get("/recommendations/random")
        const random = (check1.body === check2.body)? true: false
        

        expect(check1.body.id).not.toBeNull()
        expect(check1.body.id).not.toBeUndefined()
        expect(check2.body.id).not.toBeNull()
        expect(check2.body.id).not.toBeUndefined()
        expect(random).toBe(false)
    })
    it("check if it returns status 404 when there are no recommendations", async () => {
        const response = await supertest(app).get("/recommendations/random")

        expect(response.status).toBe(404)
    })
})

describe("GET /recommendations/top/:amount", () => {
    it("check if it returns songs with the highest number of upvotes", async () => {
        for(let i = 0; i < 4; i++) {
            await prisma.recommendation.create({
                data: {
                    name: faker.lorem.words(4),
                    youtubeLink: "https://www.youtube.com/watch?v=ExjmOdBCB_4"
                }
            })
        }

        const first = await prisma.recommendation.findFirst();
        const second = await prisma.recommendation.findFirst({
            where: {
                id: Number(first.id) + 1
            }
        });
        await supertest(app).post(`/recommendations/${first.id}/upvote`)
        await supertest(app).post(`/recommendations/${second.id}/upvote`)

        const response = await supertest(app).get("/recommendations/top/2")

        expect(response.body.length).toBe(2)
        expect(response.body[0].id).toBe(first.id)
        expect(response.body[1].id).toBe(second.id)
    })
})