import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import QueryValidator from "../QueryValidator";
import WhereNode from "./WhereNode";
import QueryProcessor from "../QueryProcessor";

export default class LogicNode implements Node {
	public kind: string;
	public value: any;

	constructor(kind: string, value: any) {
		this.kind = kind;
		this.value = value;
	}

	public validate(): void {
		if (this.value === null) {
			throw new InsightError("invalid LOGIC");
		}
		if (!Array.isArray(this.value)) {
			throw new InsightError("invalid LOGIC");
		}

		if (this.value.length === 0) {
			throw new InsightError("invalid LOGIC");
		}

		for (let filter of this.value) {
			let subnode = new WhereNode(filter);
			subnode.validate();
		}
	}

	public interpret(filters: any[], dataset: any[]): any[] {
		if (this.kind === "AND") {
			let result: any[] = dataset;
			for (let filter of filters) {
				// let curr: any[] = QueryProcessor.handleWhere(filter, dataset);
				let subnode = new WhereNode(filter);
				let curr = subnode.interpret(filter, dataset);
				result = result.filter((section) => curr.includes(section));
			}
			return result;
		} else {
			let result: any[] = [];
			for (let filter of filters) {
				// let curr: any[] = QueryProcessor.handleWhere(filter, dataset);
				let subnode = new WhereNode(filter);
				let curr = subnode.interpret(filter, dataset);
				for (let section of curr) {
					if (!result.includes(section)) {
						result.push(section);
					}
				}
			}
			return result;
		}
	}
}
