import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import ColumnNode from "./ColumnNode";
import OrderNode from "./OrderNode";

export default class OptionNode implements Node {
	public kind: string = "OPTIONS";
	public value: any;
	private possibleColumns: string[] = [];

	constructor(value: any, possibleColumns: string[] = []){
		this.value = value;
		// console.log(this.value);
		this.possibleColumns = possibleColumns;
	}

	public validate(): void {
		if (this.value === null) {
			throw new InsightError("invalid OPTION");
		}
		if (typeof this.value !== "object") {
			console.log(typeof this.value);
			throw new InsightError("invalid OPTION");
		}
		const objKeys: string[] = Object.keys(this.value);
		if (!(objKeys.length === 1 || objKeys.length === 2)) {
			throw new InsightError("invalid OPTION");
		}
		if (!objKeys.includes("COLUMNS")) {
			throw new InsightError("invalid OPTION");
		}
		let subnodeColumn = new ColumnNode(this.value["COLUMNS"], this.possibleColumns);
		subnodeColumn.validate();
		if (objKeys.length === 2) {
			if (!objKeys.includes("ORDER")) {
				throw new InsightError("invalid OPTION");
			}
			let subnodeOrder = new OrderNode(this.value["ORDER"], this.value["COLUMNS"]);
			subnodeOrder.validate();
		}
	}

	public interpret(options: any, dataset: any[]): any[] {
		const objKeys: string[] = Object.keys(options);

		let keys: string[] = options["COLUMNS"];
		// let filterColumns: any[] = this.selectColumns(keys, dataset);
		let subnodeColumn = new ColumnNode(keys, this.possibleColumns);
		const filterColumns: any[] = subnodeColumn.interpret(keys, dataset);

		if (objKeys.length === 2) {
			const orderBy: any = options["ORDER"];
			let subnodeOrder = new OrderNode(orderBy, []);
			return subnodeOrder.interpret(orderBy, filterColumns);
		}
		return filterColumns;
	}


}
