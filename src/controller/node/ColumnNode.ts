import {Node} from "./Node";
import {InsightError} from "../IInsightFacade";
import QueryValidator, {datasetKeysMapCourses, DsKeysColMap} from "../QueryValidator";

export default class ColumnNode implements Node {
	public kind: string = "COLUMN";
	public value: any;
	private possibleColumns: string[] = [];

	constructor(value: any, possibleColumns: string[]) {
		this.value = value;
		this.possibleColumns = possibleColumns;
	}

	public validate(): void {
		if (this.value === null) {
			throw new InsightError("invalid COLUMNS");
		}
		if (!Array.isArray(this.value)) {
			throw new InsightError("invalid COLUMNS");
		}
		if (this.value.length === 0) {
			throw new InsightError("invalid COLUMNS");
		}
		if (this.possibleColumns.length === 0) {
			for (let key of this.value) {
				QueryValidator.checkQueryKey(key);
			}
		} else {
			for (let key of this.value) {
				if (!this.possibleColumns.includes(key)) {
					throw new InsightError("invalid COLUMNS");
				}
			}
		}
	}

	public interpret(keys: any, dataset: any[]): any[] {
		// result is list of return objects
		if (dataset.length === 0) {
			return [];
		}
		if (typeof dataset[0][0] === "object") {
			return this.interpretIfDatasetIsArrayOfArray(dataset);
		} else {
			return this.interpretIfDatasetIsArray(dataset);
		}
	}

	private interpretIfDatasetIsArrayOfArray(dataset: any[][]): any[] {
		// console.log(dataset.length);
		let result: any[] = [];
		// section is each course section in the dataset, we create a new return obj for each section
		for (let rowsWithSameGroupByCombo of dataset) {
			// curr is the return object we are creating, # of columns = # of keys
			let curr: any = {};
			for (let rawKey of this.value) {
				let processedColumns: string[] = [];
				if (!processedColumns.includes(rawKey)) {
					let key = rawKey;
					if (typeof datasetKeysMapCourses[rawKey.split("_")[1]] === "string") {
						key = datasetKeysMapCourses[rawKey.split("_")[1]];
					}
					if (key === "id") {
						curr[rawKey] = rowsWithSameGroupByCombo[0][key].toString();
					} else if (key === "Year") {
						curr[rawKey] = Number(rowsWithSameGroupByCombo[0][key]);
					} else {
						curr[rawKey] = rowsWithSameGroupByCombo[0][key];
					}
					processedColumns.push(rawKey);
				}
			}
			result.push(curr);
		}
		return result;
			// 	if (!processedColumns.includes(rawKey)) {
			// 		if (QueryValidator.kind === "courses") {
			// 			if (rawKey === "courses_uuid") {
			// 				curr[rawKey] =
			// 					rowsWithSameGroupByCombo[0][datasetKeysMapCourses[rawKey.split("_")[1]]].toString();
			// 			} else if (rawKey === "courses_year") {
			// 				curr[rawKey] =
			// 					Number(rowsWithSameGroupByCombo[0][datasetKeysMapCourses[rawKey.split("_")[1]]]);
			// 			} else {
			// 				console.log(rawKey);
			// 				console.log(Object.keys(rowsWithSameGroupByCombo[0]));
			// 				curr[rawKey] = rowsWithSameGroupByCombo[0][datasetKeysMapCourses[rawKey.split("_")[1]]];
			// 			}
			// 		} else {
			// 			curr[rawKey] = rowsWithSameGroupByCombo[0][rawKey];
			// 		}
			// 		processedColumns.push(curr);
			// 	}
			// }
			// result.push(curr);
	}


	private interpretIfDatasetIsArray(dataset: any[]) {
		let result: any[] = [];
		let processedColumns: string[] = [];
		// section is each course section in the dataset, we create a new return obj for each section
		for (let section of dataset) {
			// curr is the return object we are creating, # of columns = # of keys
			let curr: any = {};
			for (let rawKey of this.value) {
				if (!processedColumns.includes(rawKey)) {
					if (QueryValidator.kind === "courses") {
						curr[rawKey] = section[datasetKeysMapCourses[rawKey.split("_")[1]]];
					} else {
						curr[rawKey] = section[rawKey];
					}
					processedColumns.push(curr);
				}
			}
			result.push(curr);
		}
		return result;
	}
}
