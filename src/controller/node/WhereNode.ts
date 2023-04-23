import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import MComparatorNode from "./MComparatorNode";
import SComparatorNode from "./SComparatorNode";
import LogicNode from "./LogicNode";
import NotNode from "./NotNode";
import QueryProcessor from "../QueryProcessor";

const logic = ["AND", "OR"];
const mComparator = ["LT", "GT", "EQ"];

export default class WhereNode implements Node {
	public kind: string = "WHERE";
	public value: any;

	constructor(value: any) {
		this.value = value;
	}

	public validate(): void {
		if (this.value === null) {
			throw new InsightError("invalid WHERE");
		}
		if (typeof this.value !== "object") {
			throw new InsightError("invalid WHERE");
		}
		const objKeys: string[] = Object.keys(this.value);
		if (!(objKeys.length === 0 || objKeys.length === 1)) {
			throw new InsightError("invalid WHERE");
		}
		if (objKeys.length === 1) {
			const filterKey = objKeys[0];
			const filterValue = this.value[filterKey];
			let subnode: Node;
			if (mComparator.includes(filterKey)) {
				subnode = new MComparatorNode(filterKey as string, filterValue);
			} else if (filterKey === "IS") {
				subnode = new SComparatorNode(filterKey as string, filterValue);
			} else if (logic.includes(filterKey)) {
				subnode = new LogicNode(filterKey as string, filterValue);
			} else if (filterKey === "NOT") {
				subnode = new NotNode(filterKey as string, filterValue);
			} else {
				throw new InsightError("invalid WHERE");
			}
			subnode.validate();
		}
	}

	public interpret(body: any, dataset: any[]): any[] {
		const objKeys: string[] = Object.keys(body);
		if (objKeys.length === 0) {
			return dataset;
		}

		const filterKey: string = objKeys[0];
		const filterValue = body[filterKey];
		let subnode: Node;
		if (mComparator.includes(filterKey)){
			subnode = new MComparatorNode(filterKey as string, filterValue);
			return subnode.interpret(filterValue,dataset);
		}
		if (filterKey === "IS") {
			subnode = new SComparatorNode(filterKey as string, filterValue);
			return subnode.interpret(filterValue, dataset);
		}
		if (filterKey === "NOT") {
			subnode = new NotNode(filterKey as string, filterValue);
			return subnode.interpret(filterValue, dataset);
		}
		if (logic.includes(filterKey)) {
			subnode = new LogicNode(filterKey as string, filterValue);
			return subnode.interpret(filterValue, dataset);
		}
		return dataset;
	}


}
