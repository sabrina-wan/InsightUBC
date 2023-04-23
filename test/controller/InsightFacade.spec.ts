import {InsightDataset, InsightDatasetKind,
	InsightError, ResultTooLargeError, NotFoundError} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import * as fs from "fs-extra";

import {testFolder} from "@ubccpsc310/folder-test";
import {removeSync} from "fs-extra";

chai.use(chaiAsPromised);

describe("InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		"courses": "./test/resources/archives/courses.zip",
		"courses2@ubc": "./test/resources/archives/courses.zip",
		"rooms": "./test/resources/archives/rooms.zip"
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		this.timeout(100000);
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		fs.removeSync(persistDir);
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			this.timeout(10000000);
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset("courses", datasetContents.get("courses") ?? "",
					InsightDatasetKind.Courses),
				insightFacade.addDataset("courses2@ubc", datasetContents.get("courses") ?? "",
					InsightDatasetKind.Courses),
				insightFacade.addDataset("rooms", datasetContents.get("rooms") ?? "",
					InsightDatasetKind.Rooms)
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDir);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		testFolder<any, any[], PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult(expected: any[], actual: any, input: any) {
					// set order key
					const orderKey = input.OPTIONS.ORDER;
					expect(actual).to.be.an.instanceof(Array);
					expect(actual).to.have.length(expected.length);
					expect(actual).to.have.deep.members(expected);
					if (orderKey !== undefined) {
						// check the order of the actual array
						if (orderKey.dir === undefined) {
							for (let i = 1; i < actual.length; i = i + 1) {
								expect(actual[i - 1][orderKey] <= actual[i][orderKey]).to.be.equals(true);
							}
						} else {
							const orderKeys = orderKey.keys;
							if (orderKey.dir === "UP") {
								for (let i = 1; i < actual.length; i = i + 1) {
									for (let key of orderKeys) {
										if (actual[i - 1][key] !== actual[i][key]) {
											expect(actual[i - 1][key] <=
												actual[i][key]).to.be.equals(true);
											break;
										}
									}
								}
							} else {
								for (let i = 1; i < actual.length; i = i + 1) {
									for (let key of orderKeys) {
										if (actual[i - 1][key] !== actual[i][key]) {
											expect(actual[i - 1][key] >=
												actual[i][key]).to.be.equals(true);
											break;
										}
									}
								}
							}
						}
					}
					expect(true).to.be.equals(true);
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError(expected, actual) {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});

let facade: InsightFacade;

describe("testing insight insightFacade", function() {

	describe("fails relating to invalid courses dataset", function () {
		beforeEach(function () {
			removeSync("data");
			facade = new InsightFacade();
		});

		it("should reject if not a valid zip file", () => {
			let notZip = fs.readFileSync("test/resources/archives/notzip.tar.gz").toString("base64");
			const result = facade.addDataset("1234", notZip, InsightDatasetKind.Courses);
			return expect(result).to.be.rejectedWith(InsightError);
		});
		//
		it("should reject if root is not called courses", function () {
			let rootNotCourses = fs.readFileSync("test/resources/archives/root_not_courses.zip").toString("base64");
			const result = facade.addDataset("1234", rootNotCourses, InsightDatasetKind.Courses);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should skip over if JSON brackets of one course is missing", function () {
			let brokenCourses = fs.readFileSync("test/resources/archives/broken_courses.zip").toString("base64");
			return facade.addDataset("1234", brokenCourses, InsightDatasetKind.Courses)
				.then((add) => {
					expect(add).to.deep.equal(["1234"]);
				})
				.then(() => facade.listDatasets())
				.then((datasets) => {
					expect(datasets).to.deep.equal([{
						id: "1234",
						kind: InsightDatasetKind.Courses,
						numRows: 2,
					}]);
				});
		});

		it("should reject if all files are invalid", function () {
			let allCoursesBroken = fs.readFileSync("test/resources/archives/all_courses_broken.zip").toString("base64");
			let result = facade.addDataset("1234", allCoursesBroken, InsightDatasetKind.Courses);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should reject if courses have no content", function () {
			let coursesEmpty = fs.readFileSync("test/resources/archives/courses_empty.zip").toString("base64");
			let result = facade.addDataset("1234", coursesEmpty, InsightDatasetKind.Courses);
			return expect(result).to.be.rejectedWith(InsightError);
		});
	});

	describe("fails relating to invalid rooms dataset", function () {
		beforeEach(function () {
			removeSync("data");
			facade = new InsightFacade();
		});

		it("should reject if not a valid zip file", () => {
			let notZip = fs.readFileSync("test/resources/archives/notzip.tar.gz").toString("base64");
			const result = facade.addDataset("1234", notZip, InsightDatasetKind.Rooms);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should reject if root folder is not called rooms", function () {
			let rootNotRooms = fs.readFileSync("test/resources/archives/root_not_rooms.zip").toString("base64");
			const result = facade.addDataset("1234", rootNotRooms, InsightDatasetKind.Rooms);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should reject if index is not in HTML format", function () {
			let indexNotHtml = fs.readFileSync("test/resources/archives/index_not_html.zip").toString("base64");
			const result = facade.addDataset("1234", indexNotHtml, InsightDatasetKind.Rooms);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		// it("should reject if index has invalid HTML format", function () {
		// 	let indexInvalidHtml = fs.readFileSync("test/resources/archives/index_invalid_html.zip").toString("base64");
		// 	const result = facade.addDataset("1234", indexInvalidHtml, InsightDatasetKind.Rooms);
		// 	return expect(result).to.be.rejectedWith(InsightError);
		// });

		it("should reject if there is no index.htm in the root", function () {
			let noIndex = fs.readFileSync("test/resources/archives/no_index.zip").toString("base64");
			const result = facade.addDataset("1234", noIndex, InsightDatasetKind.Rooms);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should reject if index.htm is in subfolder", function () {
			let indexInSub = fs.readFileSync("test/resources/archives/index_not_in_root.zip").toString("base64");
			const result = facade.addDataset("1234", indexInSub, InsightDatasetKind.Rooms);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should reject if the dataset does not has valid room", function () {
			let noValidRoom = fs.readFileSync("test/resources/archives/no_valid_room.zip").toString("base64");
			const result = facade.addDataset("1234", noValidRoom, InsightDatasetKind.Rooms);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should reject if the dataset does not has valid building table", function () {
			let noTableSpec = fs.readFileSync("test/resources/archives/no_table_spec.zip").toString("base64");
			const result = facade.addDataset("1234", noTableSpec, InsightDatasetKind.Rooms);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should reject if the dataset does not has valid building", function () {
			let noBuilding = fs.readFileSync("test/resources/archives/no_building.zip").toString("base64");
			const result = facade.addDataset("1234", noBuilding, InsightDatasetKind.Rooms);
			return expect(result).to.be.rejectedWith(InsightError);
		});

		it("should skip if empty string found in valid <td> for room link", function () {
			let emptyRoomHref = fs.readFileSync("test/resources/archives/empty_room_href.zip").toString("base64");
			const result = facade.addDataset("rooms", emptyRoomHref, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.deep.equal(["rooms"]);
		});


	});

	describe("testing addDataset", function () {
		let text: string;
		beforeEach(function () {
			removeSync("data");
			facade = new InsightFacade();
			text = fs.readFileSync("test/resources/archives/courses.zip").toString("base64");
		});

		it("add a valid courses dataset", function () {
			const add = facade.addDataset("2", text, InsightDatasetKind.Courses);
			return expect(add).to.eventually.deep.equal(["2"]);
		});

		it("add a valid rooms dataset", function () {
			const text2 = fs.readFileSync("test/resources/archives/rooms.zip").toString("base64");
			const add = facade.addDataset("rooms", text2, InsightDatasetKind.Rooms);
			return expect(add).to.eventually.deep.equal(["rooms"]);
		});

		it("add two valid datasets", function () {
			const text2 = fs.readFileSync("test/resources/archives/rooms.zip").toString("base64");
			return facade.addDataset("1234", text, InsightDatasetKind.Courses)
				.then((add1) => expect(add1).to.deep.equal(["1234"]))
				.then((_) => facade.addDataset("abcd", text2, InsightDatasetKind.Rooms))
				.then((add2) => expect(add2).to.deep.equal(["1234", "abcd"]));
		});

		it("name includes underscore with no existing dataset throw insight error", function () {
			return facade.addDataset("1__", text, InsightDatasetKind.Courses)
				.catch((e) => {
					expect(e).to.be.an.instanceOf(InsightError);
				});
		});

		it("name includes underscore with existing dataset throw insight error", function () {
			return facade.addDataset("2", text, InsightDatasetKind.Courses)
				.then((add1) => {
					expect(add1).to.be.deep.equal(["2"]);
					return facade.addDataset("_____", text, InsightDatasetKind.Courses);
				})
				.catch((e) => expect(e).to.be.an.instanceOf(InsightError));
		});

		it("name includes only spaces with no existing dataset throw insight error", function () {
			return facade.addDataset("  ", text, InsightDatasetKind.Courses)
				.catch((e) => {
					expect(e).to.be.an.instanceOf(InsightError);
				});
		});

		it("name includes only spaces with existing dataset throw insight error", function () {
			return facade.addDataset("2", text, InsightDatasetKind.Courses)
				.then((add1) => {
					expect(add1).to.be.deep.equal(["2"]);
					return facade.addDataset("   ", text, InsightDatasetKind.Courses);
				})
				.catch((e) => expect(e).to.be.an.instanceOf(InsightError));
		});

		it("name includes only \\r with no existing dataset throw insight error", function () {
			return facade.addDataset("\r\r", text, InsightDatasetKind.Courses)
				.catch((e) => {
					expect(e).to.be.an.instanceOf(InsightError);
				});
		});

		it("name includes only \\r with existing dataset throw insight error", function () {
			return facade.addDataset("2", text, InsightDatasetKind.Courses)
				.then((add1) => {
					expect(add1).to.be.deep.equal(["2"]);
					return facade.addDataset("\r\r\r\r", text, InsightDatasetKind.Courses);
				})
				.catch((e) => expect(e).to.be.an.instanceOf(InsightError));
		});

		it("name includes only \\t with no existing dataset throw insight error", function () {
			return facade.addDataset("\t\t\t\t", text, InsightDatasetKind.Courses)
				.catch((e) => {
					expect(e).to.be.an.instanceOf(InsightError);
				});
		});

		it("name includes only \\t with existing dataset throw insight error", function () {
			return facade.addDataset("2", text, InsightDatasetKind.Courses)
				.then((add1) => {
					expect(add1).to.be.deep.equal(["2"]);
					return facade.addDataset("\t\t", text, InsightDatasetKind.Courses);
				})
				.catch((e) => expect(e).to.be.an.instanceOf(InsightError));
		});

		it("name includes only \\n with no existing dataset throw insight error", function () {
			return facade.addDataset("\n\n\n\n\n", text, InsightDatasetKind.Courses)
				.catch((e) => {
					expect(e).to.be.an.instanceOf(InsightError);
				});
		});

		it("name includes only \\n with existing dataset throw insight error", function () {
			return facade.addDataset("2", text, InsightDatasetKind.Courses)
				.then((add1) => {
					expect(add1).to.be.deep.equal(["2"]);
					return facade.addDataset("\n\n\n\n\n", text, InsightDatasetKind.Courses);
				})
				.catch((e) => expect(e).to.be.an.instanceOf(InsightError));
		});

		it("duplicated named datasets should not be added, throw insight error", function () {
			return facade.addDataset("2", text, InsightDatasetKind.Courses)
				.then((add1) => {
					expect(add1).to.be.deep.equal(["2"]);
					return facade.addDataset("2", text, InsightDatasetKind.Courses);
				})
				.catch((e) => expect(e).to.be.an.instanceOf(InsightError));
		});
	});

	describe("testing removeDataset", function () {
		let text: string;
		beforeEach(function () {
			removeSync("data");
			facade = new InsightFacade();
			text = fs.readFileSync("test/resources/archives/courses.zip").toString("base64");
		});

		it("successfully remove an added courses dataset", function () {
			return facade.addDataset("2", text, InsightDatasetKind.Courses)
				.then((add) => {
					expect(add).to.be.deep.equal(["2"]);
					return facade.removeDataset("2");
				})
				.then((remove) => {
					expect(remove).to.be.equal("2");
				})
				.then(() => facade.listDatasets())
				.then((result) => {
					expect(result).to.be.instanceOf(Array);
					expect(result).to.have.length(0);
					expect(result).to.be.deep.equal([]);
				});
		});

		it("successfully remove an added rooms dataset", function () {
			const text2 = fs.readFileSync("test/resources/archives/rooms.zip").toString("base64");
			return facade.addDataset("2", text2, InsightDatasetKind.Rooms)
				.then((add) => {
					expect(add).to.be.deep.equal(["2"]);
					return facade.removeDataset("2");
				})
				.then((remove) => {
					expect(remove).to.be.equal("2");
				})
				.then(() => facade.listDatasets())
				.then((result) => {
					expect(result).to.be.instanceOf(Array);
					expect(result).to.have.length(0);
					expect(result).to.be.deep.equal([]);
				});
		});

		it("remove a dataset twice, second time should fail", function () {
			return facade.addDataset("2", text, InsightDatasetKind.Courses)
				.then((add) => {
					expect(add).to.be.deep.equal(["2"]);
					return facade.removeDataset("2");
				})
				.then((remove) => {
					expect(remove).to.be.equal("2");
					return facade.removeDataset("2");
				})
				.catch((e) => expect(e).to.be.instanceOf(NotFoundError));
		});

		it("remove non-existing dataset", function () {
			return facade.removeDataset("123qwe")
				.catch((e) => expect(e).to.be.instanceOf(NotFoundError));
		});

		it("remove an dataset with name with underscore", function () {
			return facade.removeDataset("a_b_c")
				.catch((e) => expect(e).to.be.instanceOf(InsightError));
		});

		it("remove an dataset with name with only spaces", function () {
			return facade.removeDataset("    ")
				.catch((e) => expect(e).to.be.instanceOf(InsightError));
		});

		it("remove an dataset with name with only \\t", function () {
			return facade.removeDataset("\t\t\t")
				.catch((e) => expect(e).to.be.instanceOf(InsightError));
		});

		it("remove an dataset with name with only \\n", function () {
			return facade.removeDataset("\n\n")
				.catch((e) => expect(e).to.be.instanceOf(InsightError));
		});

		it("remove an dataset with name with only \\r", function () {
			return facade.removeDataset("\r")
				.catch((e) => expect(e).to.be.instanceOf(InsightError));
		});
	});

	describe("testing listDatasets", function () {
		let text: string;
		beforeEach(function () {
			removeSync("data");
			facade = new InsightFacade();
			text = fs.readFileSync("test/resources/archives/courses.zip").toString("base64");
		});

		const dummy1: InsightDataset = {
			id: "courses",
			kind: InsightDatasetKind.Courses,
			numRows: 64612,
		};

		const dummy2: InsightDataset = {
			id: "rooms",
			kind: InsightDatasetKind.Rooms,
			numRows: 364,
		};

		it("list when there are no datasets", function () {
			return facade.listDatasets()
				.then((result) => {
					expect(result).to.be.instanceOf(Array);
					expect(result).to.have.length(0);
					expect(result).to.be.deep.equal([]);
				});
		});

		it("list when one dataset is added two rows", function () {
			return facade.addDataset("courses", text, InsightDatasetKind.Courses)
				.then((add) => expect(add).to.be.deep.equal(["courses"]))
				.then((_) => facade.listDatasets())
				.then((datasets) => {
					expect(datasets).to.be.instanceOf(Array);
					expect(datasets).to.have.length(1);
					expect(datasets).to.deep.include(dummy1);
				});
		});

		it("list when two datasets are added", function () {
			const text2 = fs.readFileSync("test/resources/archives/rooms.zip").toString("base64");
			return facade.addDataset("courses", text, InsightDatasetKind.Courses)
				.then((add) => expect(add).to.be.deep.equal(["courses"]))
				.then((_) => facade.addDataset("rooms", text2, InsightDatasetKind.Rooms))
				.then((add) => expect(add).to.be.deep.equal(["courses", "rooms"]))
				.then((_) => facade.listDatasets())
				.then((datasets) => {
					expect(datasets).to.be.instanceOf(Array);
					expect(datasets).to.have.length(2);
					expect(datasets).to.be.deep.include(dummy1);
					expect(datasets).to.be.deep.include(dummy2);
				});
		});
	});
});
