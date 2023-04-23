import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import QueryValidator, {datasetKeysMapCourses} from "../QueryValidator";

export default class GroupNode implements Node {
	public kind: string = "GROUP";
	public value: any;
	public columns: string[] = [];

	constructor(value: any) {
		this.value = value;
	}

	public validate(): void {
		if(!Array.isArray(this.value)) {
			throw new InsightError("invalid GROUP");
		}
		if (this.value.length === 0) {
			throw new InsightError("invalid GROUP");
		}
		for (let column of this.value) {
			QueryValidator.checkQueryKey(column);
			this.columns.push(column);
		}
	}

	public interpret(dataset: any[]): any[][] {
		let columnsToGroupBy = this.value;
		// transform courses query groupby's to corresponding keys in dataset
		if (QueryValidator.kind === "courses") {
			for (let i = 0; i < columnsToGroupBy.length; i++) {
				columnsToGroupBy[i] = datasetKeysMapCourses[columnsToGroupBy[i].split("_")[1]];
			}
		}

		let result: any[][] = [];
		let groupByCombos: any[][] = [];
		for (let row of dataset) {
			let currentgroupByCombo: any[] = [];
			// constructing current group by combo
			for (let groupByKey of columnsToGroupBy) {
				let fieldValueOfCurrentRow: any =  row[groupByKey];
				currentgroupByCombo.push(fieldValueOfCurrentRow);
			}

			// check if it appeared before
			if (!(this.checkIfArrayOfArrayContainArray(groupByCombos, currentgroupByCombo))) {
				groupByCombos.push(currentgroupByCombo);
				let newCombo = [];
				newCombo.push(row);
				result.push(newCombo);
			} else {
				let GroupByComboIndex = this.checkIndexOfArrayInArrayOfArray(groupByCombos, currentgroupByCombo);
				result[GroupByComboIndex].push(row);
			}
		}
		return result;
	}

	private checkIfArrayOfArrayContainArray(aoa: any[][], a: any[]): boolean {
		for (let array of aoa) {
			if (a.length === array.length && a.every((val, index) => val === array[index])) {
				return true;
			}
		}
		return false;
	}

	private checkIndexOfArrayInArrayOfArray(aoa: any[][], a: any[]): number {
		for (let i = 0; i < aoa.length; i++) {
			if (a.length === aoa[i].length && a.every((val, index) => val === aoa[i][index])) {
				return i;
			}
		}
		return -1;
	}


}
