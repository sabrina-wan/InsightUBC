import {InsightError} from "./IInsightFacade";
import WhereNode from "./node/WhereNode";
import OptionNode from "./node/OptionNode";
import TransformationNode from "./node/TransformationNode";

export interface DsKeysColMap {
    [key: string]: string
}
export const datasetKeysMapCourses: DsKeysColMap = {
	dept: "Subject",
	id: "Course",
	avg: "Avg",
	instructor: "Professor",
	title: "Title",
	pass: "Pass",
	fail: "Fail",
	audit: "Audit",
	uuid: "id",
	year: "Year",
};

export const datasetKeysMapRooms: DsKeysColMap = {
	fullname: "fullname",
	shortname: "shortname",
	number: "number",
	name: "name",
	address: "address",
	type: "type",
	furniture: "furniture",
	href: "href",
	lat: "lat",
	lon: "lon",
	seats: "seats",
};


export default class QueryValidator {
	private static queryId: string = "";
	private static datasetAdded: string[] = [];
	private static datasetNames: string[] = [];
	private static datasetKinds: string[] = [];
	public static kind: string = "";

	constructor(datasetAdded: string[]) {
		QueryValidator.queryId = "";
		QueryValidator.datasetAdded = [];
		QueryValidator.datasetNames = [];
		QueryValidator.datasetKinds = [];
		QueryValidator.kind = "";
		QueryValidator.datasetAdded = datasetAdded;
		for (let filename of datasetAdded) {
			let id = filename.split("_");
			QueryValidator.datasetNames.push(id[0]);
			QueryValidator.datasetKinds.push(id[1]);
		}
	}

	// Query node
	public checkQuery(query: any): string {
		if (query === null) {
			throw new InsightError("invalid query");
		}
		if (typeof query !== "object") {
			throw new InsightError("invalid query");
		}
		const objKeys: string[] = Object.keys(query);
		if (objKeys.length !== 2 && objKeys.length !== 3) {
			throw new InsightError("invalid query");
		}
		if (!objKeys.includes("WHERE") || !objKeys.includes("OPTIONS")) {
			throw new InsightError("invalid query");
		}
		if (objKeys.length === 2) {
			// No transformation case
			let subnodeWhere = new WhereNode(query["WHERE"]);
			subnodeWhere.validate();
			// console.log(query["OPTIONS"]);
			let subnodeOptions = new OptionNode(query["OPTIONS"], []);
			subnodeOptions.validate();
			return QueryValidator.queryId;
		} else {
			// With transformation case
			// Check if transformation present
			if (!objKeys.includes("TRANSFORMATIONS")) {
				throw new InsightError("invalid query");
			}
			// Validate where clause
			let subnodeWhere = new WhereNode(query["WHERE"]);
			subnodeWhere.validate();

			// Validate Transformation Clause, and get possible columns
			let subnodeTransformation = new TransformationNode(query["TRANSFORMATIONS"]);
			let possibleColumns: string[];
			subnodeTransformation.validate();
			possibleColumns = subnodeTransformation.possibleColumn;
			// Validate option node
			let subnodeOption = new OptionNode(query["OPTIONS"], possibleColumns);
			subnodeOption.validate();
			return QueryValidator.queryId;
		}

	}

	public static checkQueryKey(key: any): string {
		if (key === null) {
			throw new InsightError("invalid query key");
		}
		if (typeof key !== "string") {
			throw new InsightError("invalid query key");
		}

		const components: string[] = key.split("_");
		if (components.length !== 2) {
			throw new InsightError("invalid query key");
		}

		const idstring: string = components[0];
		if (idstring === "" || idstring === " " || idstring.includes("_")) {
			throw new InsightError("invalid query key");
		}

		if (QueryValidator.queryId === "") {
			QueryValidator.queryId = idstring;
			let index: number = QueryValidator.datasetNames.indexOf(idstring);
			if (index === -1) {
				throw new InsightError("invalid query key");
			}
			QueryValidator.kind = QueryValidator.datasetKinds[index];
		} else {
			if (idstring !== QueryValidator.queryId) {
				throw new InsightError("invalid query key");
			}
		}
		const queryField: string = components[1];
		if (QueryValidator.kind === "courses") {
			// console.log("in courses branch, query field is " + queryField);
			if (!Object.keys(datasetKeysMapCourses).includes(queryField)) {
				throw new InsightError("invalid query key");
			}
		} else {
			if (!Object.keys(datasetKeysMapRooms).includes(queryField)) {
				throw new InsightError("invalid query key");
			}
		}
		return QueryValidator.kind;
	}
}
