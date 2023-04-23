import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import QueryValidator from "../QueryValidator";

export default class OrderNode implements Node {
	public kind: string = "ORDER";
	public value: any;
	private columns: string[];

	constructor(value: any, columns: string[]) {
		this.value = value;
		this.columns = columns;
	}

	public validate(): void {
		if (this.value === null) {
			throw new InsightError("invalid ORDER");
		}
		if (typeof this.value !== "string" && typeof this.value !== "object") {
			throw new InsightError("invalid ORDER");
		}
		if (typeof this.value === "string") {
			this.checkOrderWhenString();
		} else {
			this.checkOrderWhenObject();
		}
	}

	private checkOrderWhenString() {
		if (!this.columns.includes(this.value)) {
			throw new InsightError("invalid ORDER");
		}
	}

	private checkOrderWhenObject() {
		if (Object.keys(this.value).length !== 2) {
			throw new InsightError("invalid ORDER");
		}
		if (!Object.keys(this.value).includes("dir") || !Object.keys(this.value).includes("keys")) {
			throw new InsightError("invalid ORDER");
		}
		let dir = this.value["dir"];
		if (dir !== "UP" && dir !== "DOWN") {
			throw new InsightError("invalid ORDER");
		}
		let keys = this.value["keys"];
		if (!Array.isArray(keys)) {
			throw new InsightError("invalid ORDER");
		}
		if (keys.length === 0) {
			throw new InsightError("invalid ORDER");
		}
		for (let key of keys) {
			if (!this.columns.includes(key)) {
				throw new InsightError("invalid ORDER");
			}
		}
	}

	public interpret(order: any, dataset: any[]): any[] {
		if (typeof order === "string") {
			// same as up
			return dataset.sort((a, b) => a[order] < b[order] ? -1 : 1);
		} else {
			let dir = order["dir"];
			let keys = order["keys"];

			dataset.sort((a, b) => this.sortFun(a, b, keys, dir));

			return dataset;
		}
	}

	private sortFun(dataset1: any, dataset2: any, keys: any[], dir: string): number {
		for (let key of keys) {
			if (dataset1[key] < dataset2[key]) {
				if (dir === "UP") {
					return -1;
				} else {
					return 1;
				}
			} else if (dataset1[key] > dataset2[key]) {
				if (dir === "UP") {
					return 1;
				} else {
					return -1;
				}
			}
		}
		return 0;
	}


}
