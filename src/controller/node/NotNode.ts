import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import WhereNode from "./WhereNode";

export default class NotNode implements Node {
	public kind: string;
	public value: any;

	constructor(kind: string, value: string) {
		this.kind = kind;
		this.value = value;
	}

	public validate(): void {
		if (this.value === null) {
			throw new InsightError("invalid NEGATION");
		}
		if (typeof this.value !== "object") {
			throw new InsightError("invalid NEGATION");
		}
		const objKeys: string[] = Object.keys(this.value);
		if (objKeys.length !== 1) {
			throw new InsightError("invalid NEGATION");
		}
		let subnode = new WhereNode(this.value);
		subnode.validate();
	}

	public interpret(filter: any, dataset: any[]): any[] {
		let result: any[] = dataset;
		let subnode = new WhereNode(filter);
		let inner = subnode.interpret(filter, dataset);
		result = result.filter((section) => !inner.includes(section));
		return result;
	}

}
