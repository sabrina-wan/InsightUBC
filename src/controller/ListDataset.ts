import {readdirSync, readFileSync} from "fs";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
export default class ListDataset {
	public constructor() {
		console.log("if I have to");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let datasets: InsightDataset[] = [];
		let insightDatasets: InsightDataset[] = [];
		try{
			readdirSync("data/").forEach((file) => {
				let datasetId: string = file.split("_")[0];
				let datasetKind: InsightDatasetKind = file.split("_")[1] === "courses" ? InsightDatasetKind.Courses
					: InsightDatasetKind.Rooms;
				let datasetStrings = readFileSync(`data/${file}`).toString("utf-8");
				let numOfSections = ListDataset.checkNumOfSections(datasetStrings);
				let dataset: InsightDataset = {
					id: datasetId,
					kind: datasetKind,
					numRows: numOfSections,
				};
				datasets.push(dataset);
			});
		} catch (e) {
			console.log("will not fail");
		}
		return Promise.resolve(datasets);
	}

	private static checkNumOfSections(dataset: string): number {
		return JSON.parse(dataset)["results"].length;
	}
}
