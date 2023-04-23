import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import QueryValidator, {datasetKeysMapCourses, datasetKeysMapRooms} from "../QueryValidator";

const coursesSField = ["dept", "id", "instructor", "title", "uuid"];
const roomsSField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];

export default class SComparatorNode implements Node {
	public kind: string;
	public value: any;

	constructor(kind: string, value: any) {
		this.kind = kind;
		this.value = value;
	}

	public validate(): void {
		if (this.value === null) {
			throw new InsightError("invalid SCOMPARISON");
		}
		if (typeof this.value !== "object") {
			throw new InsightError("invalid SCOMPARISON");
		}
		const objKeys: string[] = Object.keys(this.value);
		if (objKeys.length !== 1) {
			throw new InsightError("invalid SCOMPARISON");
		}

		this.checkSKey(objKeys[0]);
		this.checkSValue(this.value[objKeys[0]]);
	}

	private checkSKey(sKey: any) {
		if (sKey === null) {
			throw new InsightError("invalid SCOMPARISON");
		}
		if (typeof sKey !== "string") {
			throw new InsightError("invalid SCOMPARISON");
		}

		let kind: string = QueryValidator.checkQueryKey(sKey);
		let isValidQuerykey: boolean = false;
		if (kind === "courses") {
			isValidQuerykey =  coursesSField.includes(sKey.split("_")[1]);
		} else if (kind === "rooms") {

			isValidQuerykey =  roomsSField.includes(sKey.split("_")[1]);
		}
		if (!isValidQuerykey) {
			throw new InsightError("invalid SCOMPARISON");
		}
	}

	private checkSValue(sValue: any) {
		if (sValue === null) {
			throw new InsightError("invalid SCOMPARISON");
		}
		if (typeof sValue !== "string") {
			throw new InsightError("invalid SCOMPARISON");
		}

		if (sValue.length > 2) {
			const inputstring = sValue.substring(1, sValue.length - 1);
			if (inputstring.includes("*")) {
				throw new InsightError("invalid SCOMPARISON");
			}
		}
	}

	public interpret(filter: any, dataset: any[]): any[] {
		const skey: string = Object.keys(filter)[0];
		const sfield: string = skey.split("_")[1];
		const rawstring: string = filter[skey];

		if (rawstring === "*" || rawstring === "**") {
			return dataset;
		}

		let inputstring: string = rawstring;

		if (rawstring.startsWith("*")) {
			inputstring = inputstring.slice(1);
		}
		if (rawstring.endsWith("*")) {
			inputstring = inputstring.slice(0, -1);
		}

		let result: any[] = dataset;
		let column: string = datasetKeysMapCourses[sfield];

		if (typeof column === "string") {
			if (rawstring.startsWith("*") && rawstring.endsWith("*")) {
				result = result.filter((section) => section[column].includes(inputstring));
			} else if (rawstring.startsWith("*")) {
				result = result.filter((section) => section[column].endsWith(inputstring));
			} else if (rawstring.endsWith("*")) {
				result = result.filter((section) => section[column].startsWith(inputstring));
			} else {
				result = result.filter((section) => section[column] === inputstring);
			}
		} else {
			if (rawstring.startsWith("*") && rawstring.endsWith("*")) {
				result = result.filter((section) => section[skey].includes(inputstring));
			} else if (rawstring.startsWith("*")) {
				result = result.filter((section) => section[skey].endsWith(inputstring));
			} else if (rawstring.endsWith("*")) {
				result = result.filter((section) => section[skey].startsWith(inputstring));
			} else {
				result = result.filter((section) => section[skey] === inputstring);
			}
		}
		return result;
	}
}
