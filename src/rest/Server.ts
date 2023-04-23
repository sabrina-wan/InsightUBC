import express, {Application, json, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import {InsightDatasetKind, InsightError, NotFoundError, ResultTooLargeError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";
import {getCourseMapQryStr, getGradesQryStr, getInstructorsQryStr} from "./QueryHelpers";
import path = require("path");

interface IApprovedAccount {
	[key: string]: string
}

const approvedAccounts: IApprovedAccount = {
	w: "1"
};

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static insightFacade: InsightFacade = new InsightFacade();

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());

		this.express.set("view engine", "ejs");
		this.express.set("views", path.join(__dirname, "../../frontend/public/views"));
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);
		// CUSTOM USER STORY 1
		this.express.get("/accounts", (req, res) => {
			const inputAcc: string = req.query.account as string;
			const inputPass: string = req.query.password as string;
			const accPass = approvedAccounts[inputAcc];
			if (typeof accPass !== "undefined" && accPass === inputPass) {
				res.status(200).send();
			} else {
				res.status(400).send();
			}
		});
		// PUT /dataset/:id/:kind
		this.express.put("/dataset/:id/:kind", Server.HandleAddDataset);
		// GET /datasets
		this.express.get("/datasets", Server.HandleListDatasets);
		// DELETE /dataset/:id
		this.express.delete("/dataset/:id", Server.HandleRemoveDataset);
		this.express.get("/options", Server.options);
		this.express.get("/stats", Server.stats);
		this.express.post("/query", Server.query);
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			console.log(req.params.msg);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			console.log(msg);
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static async HandleAddDataset(req: Request, res: Response) {
		const id: string = req.params.id as string;
		const content: string = req.body.toString("base64");
		let kind: InsightDatasetKind;
		if (req.params.kind as string === "rooms") {
			kind = InsightDatasetKind.Rooms;
		} else {
			kind = InsightDatasetKind.Courses;
		}
		const facade = new InsightFacade();
		let result;
		try {
			result = await facade.addDataset(id, content, kind);
			res.status(200).json({result: result});
		} catch (e) {
			result = "error";
			res.status(400).json({error: result});
		}
	}

	private static async HandleListDatasets(req: Request, res: Response) {
		console.log("using list helper");
		const facade = new InsightFacade();
		const result = await facade.listDatasets();
		res.status(200).json({result: result});
	}

	private static async HandleRemoveDataset(req: Request,res: Response) {
		const facade = new InsightFacade();
		const id = req.params.id as string;
		let result;
		try {
			result = await facade.removeDataset(id);
			res.status(200).json({result: result});
		} catch (e) {
			result = "error";
			if (e instanceof InsightError) {
				res.status(400).json({error: result});
			} else if (e instanceof NotFoundError) {
				res.status(404).json({error: result});
			}
		}
	}

	private static query(req: Request, res: Response) {
		try {
			Server.insightFacade.performQuery(req.body)
				.then((results) => {
					console.log(results);
					res.status(200).json({result: results});
				}).catch((err) => {
					if (err instanceof InsightError || err instanceof ResultTooLargeError) {
						res.status(400).json({error: err.message});
					} else {
						res.status(400).json({error: JSON.stringify(err)});
					}
				});
		} catch(err) {
			res.status(400).json({error: err});
		}
	}

	private static stats(req: Request, res: Response) {
		try {
			let dept: string = req.query.dept as string;
			let id: string = req.query.id as string;
			if (typeof dept !== "undefined" && dept !== null && typeof id !== "undefined" && id !== null) {
				let gradesQry = getGradesQryStr(dept, id);
				let instructorsQry = getInstructorsQryStr(dept, id);
				Server.insightFacade.performQuery(JSON.parse(gradesQry)).then((grades) => {
					return grades[0];
				}).then((grades) => {
					Server.insightFacade.performQuery(JSON.parse(instructorsQry)).then((instructors) => {
						res.status(200).json({stats: grades, profs: instructors});
					});
				});
			} else {
				res.status(400).json({error: "query parameter is empty"});
			}
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static options(req: Request, res: Response) {
		Server.insightFacade.listDatasets().then((dataset) => {
			if (dataset.length === 0) {
				res.status(200).json({map: "no dataset to query"});
			} else {
				try {
					let query = getCourseMapQryStr();
					Server.insightFacade.performQuery(JSON.parse(query)).then((courses) => {
						let options: any = {};
						for (let row of courses) {
							if (!Object.keys(options).includes(row.courses_dept)) {
								options[row.courses_dept] = [row.courses_id];
							} else {
								options[row.courses_dept].push(row.courses_id);
							}
						}
						res.status(200).json({map: options});
					}).catch((err) => {
						res.status(400).json({error: JSON.stringify(err)});
					});
				} catch (err) {
					res.status(400).json({error: err});
				}
			}
		});
	}
}
