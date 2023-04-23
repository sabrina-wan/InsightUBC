export function getCourseMapQryStr() {
	return `
    {
        "WHERE": {},
        "OPTIONS": {
            "COLUMNS": [
                "courses_dept",
                "courses_id"
            ]
        },
        "TRANSFORMATIONS": {
            "GROUP": [
                "courses_dept",
                "courses_id"
            ],
            "APPLY": [
                {
                    "overallAvg": {
                        "AVG": "courses_avg"
                    }
                }
            ]
        }
    }`;
}

export function getGradesQryStr(dept: string, id: string) {
	return `
    {
        "WHERE": {
            "AND": [
                {
                    "IS": {
                        "courses_dept": "${dept}"
                    }
                },
                {
                    "IS": {
                        "courses_id": "${id}"
                    }
                }
            ]
        },
        "OPTIONS": {
            "COLUMNS": [
                "courses_title",
                "overallAvg",
                "overallMax",
                "overallMin"
            ]
        },
        "TRANSFORMATIONS": {
            "GROUP": [
                "courses_title"
            ],
            "APPLY": [
                {
                    "overallMax": {
                        "MAX": "courses_avg"
                    }
                },
                {
                    "overallMin": {
                        "MIN": "courses_avg"
                    }
                },
                {
                    "overallAvg": {
                        "AVG": "courses_avg"
                    }
                }
            ]
        }
    }`;
}

export function getInstructorsQryStr(dept: string, id: string) {
	return `
    {
        "WHERE": {
        "AND": [
            {
                "IS": {
                    "courses_dept": "${dept}"
                }
            },
            {
                "IS": {
                    "courses_id": "${id}"
                }
            },
            {
                "NOT": {
                    "IS": {
                        "courses_instructor": ""
                    }
                }
            }
        ]
        },
        "OPTIONS": {
            "COLUMNS": [
                "courses_instructor",
                "courses_year"
            ],
            "ORDER": {
                "dir": "DOWN",
                "keys": ["courses_year"]
            }
        }
    }`;
}
