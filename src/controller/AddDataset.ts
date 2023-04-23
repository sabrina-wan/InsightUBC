import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as fs from "fs-extra";
import JSZip, {JSZipObject, loadAsync} from "jszip";
import RoomParser from "./RoomParser";

export default class AddDataset {
	private readonly id: string;
	private content: string;
	private kind: InsightDatasetKind;
	private roomParser: RoomParser;

	public constructor(id: string, content: string, kind: InsightDatasetKind) {
		this.id = id;
		this.content = content;
		this.kind = kind;
		this.roomParser = new RoomParser(id, content);
	}

	public add(): Promise<any> {
		// reject if id is invalid
		if (!this.checkID()) {
			return Promise.reject(new InsightError());
		}
		if (this.kind === InsightDatasetKind.Courses) {
			return this.addCourses();
		}
		return this.addRooms();
	}

	private addCourses() {
		return loadAsync(this.content, {createFolders: true, base64: true})
			// if root is not called courses, reject
			// else, return a array of string (courses object)
			.then((data: JSZip) => {
				let courses: any = data.folder("courses");
				let promises: Array<Promise<string>> = [];
				courses.forEach((relative_path: string, file: JSZipObject) => {
					promises.push(file.async("text"));
				});
				if (promises.length === 0) {
					return Promise.reject(new InsightError());
				}
				return Promise.all(promises);
			})

			// add all strings together to make dataset object
			// if any string represents an invalid JSON object, skip it
			.then((courses_strings) => {
				let coursesSoFar: any[] = [];
				courses_strings.forEach((course) => {
					try{
						coursesSoFar = AddDataset.addCourse(course, coursesSoFar);
					} catch (e) {
						console.log("will not fail");
					}
				});
				return coursesSoFar;
			})

			// If the result object doesnt contain any sections, reject
			// else make a JSON object with it being value of "result"
			.then((courses) => {
				if (!JSON.stringify(courses).includes("Section")) {
					return Promise.reject(new InsightError());
				}
				this.writeToDisk(courses);
				return Promise.resolve(this.listDatasets());
			})
			.catch(() => Promise.reject(new InsightError()));
	}

	private addRooms(): Promise<any> {
		return loadAsync(this.content, {createFolders: true, base64: true})
            // read index.htm at root and parse html table into building objects
			.then((data: JSZip) => {
				return this.roomParser.parseBuilding(data);
			})
            // for each building, read <building-code> files in /rooms and parse html table into building object
			.then((passDown: any[]) => {
				let buildings: any[] = passDown.slice(0, -1);
				let data: JSZip = passDown[passDown.length - 1];
				let promises: Array<Promise<any>> = [];
				buildings.map((building: any) => {
					promises.push(this.roomParser.parseRoom(building, data));
				});
				if (promises.length === 0) {
					return Promise.reject(new InsightError());
				}
				return Promise.all(promises);
			})
            // for each building, send get request to web service for geolocation and parse into building object
			.then((buildings: any[]) => {
				let promises: Array<Promise<any>> = [];
				buildings.map((building: any) => {
					promises.push(this.roomParser.getGeolocation(building));
				});
				return Promise.all(promises);
			})
            // for each building, map object key into valid query keys and convert into room objects
			.then((buildings: any[]) => {
				let rooms: any[] = [];
				for (let building of buildings) {
					if (building.rooms.length !== 0) {
						rooms.push(...this.roomParser.mapColumns(this.id, building));
					}
				}
				if (rooms.length === 0) {
					return Promise.reject(new InsightError());
				}
				return rooms;
			})
			.then((rooms: any[]) => {
				this.writeToDisk(rooms);
				return Promise.resolve(this.listDatasets());
			})
			.catch(() => Promise.reject(new InsightError()));
	}

	private checkID(): boolean {

		return !(this.id.includes("_") || this.id.trim().length === 0 || this.listDatasets().includes(this.id));
	}

	private static addCourse(course: string, courses_so_far: any[]): any[] {
		let newCourse = JSON.parse(course)["result"];
		for (let c of newCourse) {
			c["id"] = c["id"].toString();
			c["Year"] = c["Section"] === "overall" ? 1900 : Number(c["Year"]);
		}
		return courses_so_far.concat(newCourse);
	}

	// write current dataset to /data and update index.json
	private writeToDisk(content: any[]): void {
		if (!fs.existsSync("data/")) {
			fs.mkdirSync("data/");
		}
		let dsType: string = this.kind === InsightDatasetKind.Courses ? "courses" : "rooms";
		fs.writeJSONSync(`data/${this.id}_${dsType}`, {results: content});
	}

	// returns all added lists
	private listDatasets(): string[] {
		let datasets: string[] = [];
		try{
			fs.readdirSync("data/").forEach((filename) => {
				datasets.push(filename.split("_")[0]);
			});
		} catch (e) {
			console.log("will not fail");
		}
		return datasets;
	}
}
