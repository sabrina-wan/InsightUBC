import {readdirSync} from "fs";
import {InsightError,NotFoundError} from "./IInsightFacade";
import {removeSync} from "fs-extra";

export default class RemoveDataset {
	private readonly id: string;

	public constructor(id: string) {
		this.id = id;
	}

	public remove() {
		if(!this.checkID()) {
			return Promise.reject(new InsightError());
		}
		if(!this.listDatasets().includes(this.id)) {
			return Promise.reject(new NotFoundError());
		}
		try{
			let files: any[] = readdirSync("data/");
			for (let filename of files) {
				if (this.id === filename.split("_")[0]) {
					removeSync(`data/${filename}`);
					break;
				}
			}
		} catch (e) {
			console.log("will not fail");
		}
		return Promise.resolve(this.id);
	}

	private listDatasets(): string[] {
		let datasets: string[] = [];
		try{
			readdirSync("data/").forEach((filename) => {
				datasets.push(filename.split("_")[0]);
			});
		} catch (e) {
			console.log("will not fail");
		}
		return datasets;
	}

	private checkID(): boolean {
		return !(this.id.includes("_") || this.id.trim().length === 0 );
	}
}
