import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import QueryValidator, {datasetKeysMapCourses} from "../QueryValidator";

const coursesMField = ["avg", "pass", "fail", "audit", "year"];
const roomsMField = ["lat", "lon", "seats"];

export default class MComparatorNode implements Node {
	public kind: string;
	public value: any;
	public field: any;
	public number: any;

	constructor(kind: string, value: any) {
		this.kind = kind;
		this.value = value;
	}

	public validate(): void {
		if (this.value === null) {
			throw new InsightError("invalid MCOMPARISON");
		}
		if (typeof this.value !== "object") {
			throw new InsightError("invalid MCOMPARISON");
		}

		const objKeys: string[] = Object.keys(this.value);
		if (objKeys.length !== 1) {
			throw new InsightError("invalid MCOMPARISON");
		}

		this.checkMKey(objKeys[0]);
		this.checkMValue(this.value[objKeys[0]]);
	}

	private checkMKey(mKey: any) {
		if (mKey === null) {
			throw new InsightError("invalid MCOMPARISON");
		}
		if (typeof mKey !== "string") {
			throw new InsightError("invalid MCOMPARISON");
		}

		QueryValidator.checkQueryKey(mKey);

		let isValidQuerykey: boolean = false;
		if (QueryValidator.kind === "courses") {
			isValidQuerykey =  coursesMField.includes(mKey.split("_")[1]);
		} else if (QueryValidator.kind === "rooms") {
			isValidQuerykey =  roomsMField.includes(mKey.split("_")[1]);
		}
		if (!isValidQuerykey) {
			throw new InsightError("invalid MCOMPARISON");
		}
		this.field = datasetKeysMapCourses[mKey];
	}

	private checkMValue(mValue: any) {
		if (mValue === null) {
			throw new InsightError("invalid MCOMPARISON");
		}
		if (typeof mValue !== "number") {
			throw new InsightError("invalid MCOMPARISON");
		}
		this.value = mValue;
	}

	public interpret(filter: any, dataset: any[]): any[] {
		const mkey: string = Object.keys(filter)[0];
		const mfield: string = mkey.split("_")[1];
		const number = filter[mkey];

		let result: any[] = dataset;
		let column: string = mkey;
		if (QueryValidator.kind === "courses") {
			column = datasetKeysMapCourses[mfield];
		}

		if (this.kind === "LT") {
			result = result.filter((section) => section[column] < number);
		} else if (this.kind === "EQ") {
			result = result.filter((section) => section[column] === number);
		} else if (this.kind === "GT") {
			result = result.filter((section) => section[column] > number);
		}
		return result;
	}

}
