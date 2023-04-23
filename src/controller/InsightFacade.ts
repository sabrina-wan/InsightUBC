import * as fs from "fs-extra";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import QueryProcessor from "./QueryProcessor";
import QueryValidator from "./QueryValidator";
import AddDataset from "./AddDataset";
import RemoveDataset from "./RemoveDataset";
import ListDataset from "./ListDataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// constructor() {
	// 	console.trace("InsightFacadeImpl::init()");
	// }

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// return Promise.reject("Not implemented.");
		let add = new AddDataset(id, content, kind);
		return add.add();
	}

	public removeDataset(id: string): Promise<string> {
		let remove = new RemoveDataset(id);
		return remove.remove();
	}

	public performQuery(query: any): Promise<any[]> {
		return new Promise<any[]>(function (resolve, reject) {
			try {
				// read data folder and get added dataset ids
				let datasetsAdded: string[] = [];
				fs.readdirSync("./data/").forEach((filename) => datasetsAdded.push(filename));

				// validate input query and get dataset id
				let validateQuery: QueryValidator = new QueryValidator(datasetsAdded);
				let datasetId: string = validateQuery.checkQuery(query);
				let datasetKind: string = QueryValidator.kind;

				// read and get data with the given dataset id
				const text = fs.readFileSync("./data/" + datasetId + "_" + datasetKind).toString();
				const datasetSelected: any[] = JSON.parse(text)["results"];

				// process query on the dataset and produce result
				let processQuery: QueryProcessor = new QueryProcessor(datasetSelected);
				let result: any[] = processQuery.performQuery(query);
				// let result: any[] = QueryProcessor.performQuery(query);
				// console.log(result);
				resolve(result);
			} catch(err) {
				reject(err);
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let list = new ListDataset();
		return list.listDatasets();
	}
}
