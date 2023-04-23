import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";

const parse5 = require("parse5");
const http = require("http");

export default class RoomParser {
    private readonly id: string;
	private content: string;
	public constructor(id: string, content: string) {
		this.id = id;
		this.content = content;
	}

	public parseBuilding(data: JSZip): Promise<any[]> {
		let file: any = data.file("rooms/index.htm");
		return file.async("text").then((text: string) => {
			let document: any;
			try {
				document = parse5.parse(text);
			} catch(e: any) {
				return Promise.reject(new InsightError());
			}
			let tables: any[] = [];
			this.getHtmlElement(document, "table", "views-table cols-5 table", tables);
			if (tables.length === 0) {
				return Promise.reject(new InsightError());
			}
			const buildings: any[] = this.getBuildingInfo(tables[0]);
			return Promise.resolve([...buildings, data]);
		}).catch(() => Promise.reject(new InsightError()));
	}

	public parseRoom(building: any, data: JSZip): Promise<any> {
		if (building.info === undefined || building.info === "") {
			building.rooms = [];
			return Promise.resolve(building);
		}
		let file: any = data.file(building.info.replace(".", "rooms"));
		return file.async("text")
			.then((text: string) => {
				let document: any;
				try {
					document = parse5.parse(text);
				} catch(e: any) {
					return Promise.reject(new InsightError());
				}
				building.rooms = this.getRoomInfo(document);
				return Promise.resolve(building);
			}).catch(() => Promise.reject(new InsightError()));
	}

	public getHtmlElement(node: any, tag: string, attr: string, res: any[]): void {
		if (node === undefined) {
			return;
		}

		if (node.tagName === tag) {
			if (attr === "") {
				res.push(node);
			} else {
				for (let at of node.attrs) {
					if (at.name === "class" && at.value === attr) {
						res.push(node);
					}
				}
			}
		}
		if (node.childNodes !== undefined) {
			for (let childNode of node.childNodes) {
				this.getHtmlElement(childNode, tag, attr, res);
			}
		}
	}

	public getBuildingInfo(htmlTable: any): any[] {
		let buildings: any[] = [];
		let tbody: any[] = [];
		this.getHtmlElement(htmlTable, "tbody", "", tbody);
		let trs: any[] = [];
		this.getHtmlElement(tbody[0], "tr", "", trs);
		for (let tr of trs) {
			let building: any = {};
			// let tdImage: any[] = [];
			// this.getHtmlElement(tr, "td", "views-field views-field-field-building-image", tdImage);
			// if (tdImage.length > 0) {
			// 	building.image = tdImage[0].childNodes[1].childNodes[0].attrs[0].value.trim();
			// }

			let tdCode: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-field-building-code", tdCode);
			if (tdCode.length > 0) {
				building.code = tdCode[0].childNodes[0].value.trim();
			}

			let tdTitle: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-title", tdTitle);
			if (tdTitle.length > 0) {
				building.title = tdTitle[0].childNodes[1].childNodes[0].value.trim();
			}

			let tdAddr: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-field-building-address", tdAddr);
			if (tdAddr.length > 0) {
				building.address = tdAddr[0].childNodes[0].value.trim();
			}

			let tdNothing: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-nothing", tdNothing);
			if (tdNothing.length > 0) {
				building.info = tdNothing[0].childNodes[1].attrs[0].value.trim();
			}

			buildings.push(building);
		}
		return buildings;
	}

	public getRoomInfo(htmlTable: any): any[] {
		let rooms: any[] = [];
		let tbody: any[] = [];
		this.getHtmlElement(htmlTable, "tbody", "", tbody);
		let trs: any[] = [];
		this.getHtmlElement(tbody[0], "tr", "", trs);
		for (let tr of trs) {
			let room: any = {};
			let tdNumber: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-field-room-number", tdNumber);
			if (tdNumber.length > 0) {
				room.number = tdNumber[0].childNodes[1].childNodes[0].value.trim();
			}

			let tdCapacity: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-field-room-capacity", tdCapacity);
			if (tdCapacity.length > 0) {
				room.capacity = tdCapacity[0].childNodes[0].value.trim();
			}

			let tdFurniture: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-field-room-furniture", tdFurniture);
			if (tdFurniture.length > 0) {
				room.furniture = tdFurniture[0].childNodes[0].value.trim();
			}

			let tdType: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-field-room-type", tdType);
			if (tdType.length > 0) {
				room.type = tdType[0].childNodes[0].value.trim();
			}

			let tdNothing: any[] = [];
			this.getHtmlElement(tr, "td", "views-field views-field-nothing", tdNothing);
			if (tdNothing.length > 0) {
				room.info = tdNothing[0].childNodes[1].attrs[0].value.trim();
			}

			rooms.push(room);
		}
		return rooms;
	}


	public getGeolocation(building: any): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			const encoded = encodeURI(building.address);
			http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team074/" + encoded, (res: any) => {
				let rawData = "";
				res.on("data", (chunk: string) => {
					rawData += chunk;
				});
				res.on("end", () => {
					try {
						const parsedData = JSON.parse(rawData);
						building.latitude = parsedData.lat;
						building.longtitue = parsedData.lon;
						resolve(building);
					} catch (e: any) {
						console.error(e.message);
						building.latitude = undefined;
						building.longtitue = undefined;
						resolve(building);
					}
				});
			}).on("error", (e: any) => {
				console.error(`Got error: ${e.message}`);
				building.latitude = undefined;
				building.longtitue = undefined;
				resolve(building);
			});
		});
	}

	public mapColumns(id: string, building: any): any[] {
		let res: any[] = [];
		for (let room of building.rooms) {
			let roomObj: any = {};
			roomObj[id + "_fullname"] = building.title;
			roomObj[id + "_shortname"] = building.code;
			roomObj[id + "_number"] = room.number;
			roomObj[id + "_name"] = building.code + "_" + room.number;
			roomObj[id + "_address"] = building.address;
			roomObj[id + "_lat"] = building.latitude;
			roomObj[id + "_lon"] = building.longtitue;
			roomObj[id + "_seats"] = +room.capacity;
			roomObj[id + "_type"] = room.type;
			roomObj[id + "_furniture"] = room.furniture;
			roomObj[id + "_href"] = room.info;
			res.push(roomObj);
		}
		return res;
	}
}
