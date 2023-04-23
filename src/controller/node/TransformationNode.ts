import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import GroupNode from "./GroupNode";
import ApplyNode from "./ApplyNode";


export default class TransformationNode implements Node {
	public kind: string = "TRANSFORMATION";
	public value: any;
	public possibleColumn: string[] = [];

	constructor(value: any) {
		this.value = value;
	}

	public validate(): void {
		if (typeof (this.value) !== "object") {
			throw new InsightError("invalid TRANSFORMATION");
		}
		let keysInTransformation = Object.keys(this.value);
		if (keysInTransformation.length !== 2) {
			throw new InsightError("invalid TRANSFORMATION");
		} else if (!keysInTransformation.includes("GROUP") || !keysInTransformation.includes("APPLY")) {
			throw new InsightError("invalid TRANSFORMATION");
		}

		// validate group section
		let groupValue = this.value["GROUP"];
		let subnodeGroup = new GroupNode(groupValue);
		subnodeGroup.validate();
		this.possibleColumn = this.possibleColumn.concat(subnodeGroup.columns);


		// validate apply section
		let applyValue = this.value["APPLY"];
		let subnodeApply = new ApplyNode(applyValue);
		subnodeApply.validate();
		this.possibleColumn = this.possibleColumn.concat(subnodeApply.applyKeys);
	}

	public interpret(dataset: any[]): any[] {
		let subnodeGroup = new GroupNode(this.value["GROUP"]);
		let afterGroup = subnodeGroup.interpret(dataset);
		let subnodeApply = new ApplyNode(this.value["APPLY"]);
		let afterApply = subnodeApply.interpret(afterGroup);
		return afterApply;
	}
}
