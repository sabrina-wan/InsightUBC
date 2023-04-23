import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import QueryValidator, {datasetKeysMapCourses} from "../QueryValidator";
import Decimal from "decimal.js";

const coursesMField = ["avg", "pass", "fail", "audit", "year"];
const roomsMField = ["lat", "lon", "seats"];
const coursesSField = ["dept", "id", "instructor", "title", "uuid"];
const roomsSField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
const mToken = ["MAX", "MIN", "AVG", "COUNT", "SUM"];

export default class ApplyNode implements Node {
	public kind: string = "APPLY";
	public value: any;
	public applyKeys: string[] = [];

	public constructor(value: any) {
		this.value = value;
	}

	public validate(): void {
		if (!Array.isArray(this.value)) {
			throw new InsightError("invalid APPLY");
		}
		for (const applyRule of this.value) {
			if (typeof applyRule !== "object") {
				throw new InsightError("invalid APPLY");
			}
			if (Object.keys(applyRule).length !== 1) {
				throw new InsightError("invalid APPLY");
			}
			let applyKey = Object.keys(applyRule)[0];
			this.checkApplyKey(applyKey);
			this.checkRule(applyRule[applyKey]);
			this.applyKeys.push(applyKey);
		}
	}

	private checkApplyKey(applyKey: string) {
		if (typeof applyKey !== "string" || applyKey === "" || applyKey.includes("_")) {
			throw new InsightError("invalid APPLY");
		}
		if (this.applyKeys.includes(applyKey)) {
			throw new InsightError("invalid APPLY");
		}
	}

	private checkRule(rule: any): void {
		if (typeof rule !== "object") {
			throw new InsightError("invalid APPLY");
		}
		if (Object.keys(rule).length !== 1) {
			throw new InsightError("invalid APPLY");
		}
		let applyToken = Object.keys(rule)[0];
		let applyFieldWithDataset = rule[applyToken];
		let datasetKind: string = QueryValidator.checkQueryKey(applyFieldWithDataset);
		let applyField = applyFieldWithDataset.split("_")[1];
		if (datasetKind === "courses") {
			if (coursesSField.includes(applyField)) {
				if (applyToken !== "COUNT") {
					throw new InsightError("invalid APPLY");
				}
			} else {
				if (!mToken.includes(applyToken)) {
					throw new InsightError("invalid APPLY");
				}
			}
		} else {
			if (roomsSField.includes(applyField)) {
				if (applyToken !== "COUNT") {
					throw new InsightError("invalid APPLY");
				}
			} else {
				if (!mToken.includes(applyToken)) {
					throw new InsightError("invalid APPLY");
				}
			}
		}
	}

	public interpret(dataset: any[][]): any[] {
		for (let applyRule of this.value) {
			let ruleName: string = Object.keys(applyRule)[0];
			let rule = applyRule[ruleName];
			let ruleType: string = Object.keys(rule)[0];
			let ruleField = rule[ruleType];
			if (QueryValidator.kind === "courses") {
				ruleField = datasetKeysMapCourses[ruleField.split("_")[1]];
			}
			for (let rowsWithSameGroupByCombo of dataset) {
				let newValue: number;
				if (ruleType === "MIN") {
					newValue = this.minRule(rowsWithSameGroupByCombo, ruleField);
				} else if (ruleType === "MAX") {
					newValue = this.maxRule(rowsWithSameGroupByCombo, ruleField);
				} else if (ruleType === "AVG") {
					newValue = this.avgRule(rowsWithSameGroupByCombo, ruleField);
				} else if (ruleType === "COUNT") {
					newValue = this.countRule(rowsWithSameGroupByCombo, ruleField);
				} else {
					newValue = this.sumRule(rowsWithSameGroupByCombo, ruleField);
				}
				rowsWithSameGroupByCombo[0][ruleName] = newValue;
			}
		}
		return dataset;
	}

	private minRule(dataset: any[], key: string): number {
		let min = Number.MAX_SAFE_INTEGER;
		for (let row of dataset) {
			if (row[key] < min) {
				min = row[key];
			}
		}
		return min;
	}

	private maxRule(dataset: any[], key: string): number {
		let max = Number.MIN_SAFE_INTEGER;
		for (let row of dataset) {
			if (row[key] > max) {
				max = row[key];
			}
		}
		return max;
	}

	private sumRule(dataset: any[], key: string): number {
		let sum = new Decimal(0);
		for (let row of dataset) {
			let decimal = new Decimal(row[key]);
			sum = sum.add(decimal);
		}
		let res = Number(sum.toFixed(2));
		return res;
	}

	private avgRule(dataset: any[], key: string): number {
		let total = new Decimal(0);
		let numRows = 0;
		for (let row of dataset) {
			let decimal = new Decimal(row[key]);
			total = total.add(decimal);
			numRows++;
		}
		let avg = total.toNumber() / numRows;
		let res = Number(avg.toFixed(2));
		return res;
	}

	private countRule(dataset: any[], key: string): number {
		let seen: any[] = [];
		let count = 0;
		for (let row of dataset) {
			if (!seen.includes(row[key])) {
				seen.push(row[key]);
				count++;
			}
		}
		return count;
	}
}
