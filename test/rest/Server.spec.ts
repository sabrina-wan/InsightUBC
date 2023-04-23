import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect, use} from "chai";
import chaiHttp from "chai-http";
import Response = ChaiHttp.Response;
import * as fs from "fs-extra";
import { InsightDatasetKind } from "../../src/controller/IInsightFacade";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;
	let SERVER_URL = "http://localhost:4321";
	const chai = require("chai");

	use(chaiHttp);

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		server.start()
			.then(() => console.info("server listening"))
			.catch((err) => console.error(`server error: ${err.message}`));
		this.timeout(10000000);
	});

	after(function () {
		// TODO: stop server here once!
		server.stop()
			.then(() => console.info("server closed"))
			.catch((err) => console.error(`server error: ${err.message}`));
	});

	beforeEach(async function () {
		// might want to add some process logging here to keep track of what"s going on
		fs.removeSync("data");
		facade = new InsightFacade();
		const text = fs.readFileSync("test/resources/archives/courses.zip").toString("base64");
		const text2 = fs.readFileSync("test/resources/archives/rooms.zip").toString("base64");
		await facade.addDataset("courses", text, InsightDatasetKind.Courses)
			.then((_) => facade.addDataset("rooms", text2, InsightDatasetKind.Rooms));
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	// Sample on how to format PUT requests
	/*
	it("PUT test for courses dataset", function () {
		try {
			return chai.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
		}
	});
	*/

	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
	it("POST test for valid plain query", function () {
		try {
			let query = {
				WHERE:{
					AND:[
						{
							IS:{
								rooms_furniture:"*Tables*"
							}
						},
						{
							GT:{
								rooms_seats:300
							}
						}
					]
				},
				OPTIONS:{
					COLUMNS:[
						"rooms_shortname",
						"maxSeats"
					],
					ORDER:{
						dir:"DOWN",
						keys:[
							"maxSeats"
						]
					}
				},
				TRANSFORMATIONS:{
					GROUP:[
						"rooms_shortname"
					],
					APPLY:[
						{
							maxSeats:{
								MAX:"rooms_seats"
							}
						}
					]
				}
			};
			let expectedBody = {
				result:[
					{
						rooms_shortname:"OSBO",
						maxSeats:442
					},
					{
						rooms_shortname:"HEBB",
						maxSeats:375
					},
					{
						rooms_shortname:"LSC",
						maxSeats:350
					}
				]
			};
			return chai.request(SERVER_URL)
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json")
				.then(function (res: Response) {
					// some logging here please!
					console.info(`POST /query endpoint response: ${JSON.stringify(res.body)}`);
					expect(res.body).to.be.deep.equal(expectedBody);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (res: Response, err: Error) {
					// some logging here please!
					console.error(`POST /query endpoint error: ${err.message}`);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error(`POST /query endpoint error: ${err}`);
		}
	});

	it("POST test for invalid plain query", function () {
		try {
			return chai.request(SERVER_URL)
				.post("/query")
				.send({})
				.set("Content-Type", "application/json")
				.then(function (res: Response) {
					// some logging here please!
					console.info(`POST /query endpoint response: ${JSON.stringify(res.body)}`);
					expect(res.body).to.be.deep.equal({error:"invalid query"});
					expect(res.status).to.be.equal(400);
				})
				.catch(function (res: Response, err: Error) {
					// some logging here please!
					console.error(`POST /query endpoint error: ${err.message}`);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error(`POST /query endpoint error: ${err}`);
		}
	});

	// it("GET test for course statistics", function () {
	// 	try {
	// 		return chai.request(SERVER_URL)
	// 			.get("/stats")
	// 			.send()
	// 			.then(function (res: Response) {
	// 				// some logging here please!
	// 				console.info(`GET /stats endpoint response: ${JSON.stringify(res.body)}`);
	// 				expect(res.status).to.be.equal(200);
	// 			})
	// 			.catch(function (err: Error) {
	// 				// some logging here please!
	// 				console.error(`GET /stats endpoint error: ${err.message}`);
	// 				expect.fail();
	// 			});
	// 	} catch (err) {
	// 		// and some more logging here!
	// 		console.error(`GET /stats endpoint error: ${err}`);
	// 	}
	// });

	// it("GET test for course statistics with query parameter", function () {
	// 	try {
	// 		let expectedBody: any = {
	// 			stats: {
	// 				courses_title: "intr sftwr eng",
	// 				overallAvg: 78.25,
	// 				overallMax: 84.6,
	// 				overallMin: 72.27
	// 			},
	// 			profs: [
	// 				{ courses_instructor: "holmes, reid", courses_year: 2016 },
	// 				{ courses_instructor: "baniassad, elisa", courses_year: 2015 },
	// 				{ courses_instructor: "baniassad, elisa", courses_year: 2015 },
	// 				{
	// 					courses_instructor: "palyart-lamarche, marc",
	// 					courses_year: 2014
	// 				},
	// 				{ courses_instructor: "baniassad, elisa", courses_year: 2014 },
	// 				{ courses_instructor: "baniassad, elisa", courses_year: 2014 },
	// 				{ courses_instructor: "wohlstadter, eric", courses_year: 2013 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2013 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2012 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2012 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2012 },
	// 				{ courses_instructor: "ernst, neil", courses_year: 2011 },
	// 				{ courses_instructor: "ernst, neil", courses_year: 2011 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2010 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2010 },
	// 				{ courses_instructor: "fritz, thomas", courses_year: 2010 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2009 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2009 },
	// 				{ courses_instructor: "allen, meghan", courses_year: 2009 },
	// 				{ courses_instructor: "shepherd, david", courses_year: 2007 },
	// 				{ courses_instructor: "shepherd, david", courses_year: 2007 }
	// 			]
	// 		};
	// 		return chai.request(SERVER_URL)
	// 			.get("/stats?dept=cpsc&id=310")
	// 			.send()
	// 			.then(function (res: Response) {
	// 				// some logging here please!
	// 				console.info(`GET /stats?dept=&id= endpoint response: ${JSON.stringify(res.body)}`);
	// 				expect(res.body).to.be.deep.equal(expectedBody);
	// 				expect(res.status).to.be.equal(200);
	// 			})
	// 			.catch(function (err: Error) {
	// 				// some logging here please!
	// 				console.error(`GET /stats?dept=&id= endpoint error: ${err.message}`);
	// 				expect.fail();
	// 			});
	// 	} catch (err) {
	// 		// and some more logging here!
	// 		console.error(`GET /stats?dept=&id= endpoint error: ${err}`);
	// 	}
	// });
});
