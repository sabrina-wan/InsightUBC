import {ResultTooLargeError} from "./IInsightFacade";
import OptionNode from "./node/OptionNode";
import WhereNode from "./node/WhereNode";
import TransformationNode from "./node/TransformationNode";

export default class QueryProcessor {
	private datasetSelected: any[]

	constructor(datasetSelected: any[]) {
		this.datasetSelected = datasetSelected;
	}

	public performQuery(query: any): any[] {
		// filter rows according to "where"
		let subnodeWhere = new WhereNode(query["WHERE"]);
		let filterRows: any[] = subnodeWhere.interpret(query["WHERE"], this.datasetSelected);

		// apply transformation
		let afterTransformation: any[] = filterRows;
		if (typeof query["TRANSFORMATIONS"] === "object") {
			let subnodeTransforamtions = new TransformationNode(query["TRANSFORMATIONS"]);
			afterTransformation = subnodeTransforamtions.interpret(filterRows);
		}
		if (afterTransformation.length > 5000) {
			// console.log(filterRows.length);
			throw new ResultTooLargeError("over 5000 results");
		}
		// console.log(query);
		// console.log(query["OPTIONS"]);
		let subnode = new OptionNode(query["OPTIONS"]);
		return subnode.interpret(query["OPTIONS"], afterTransformation);
	}
}
