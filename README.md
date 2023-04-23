# InsightUBC
A web application that allows users to browse UBC course sessions and classrooms which their custom filters.

## Configuring your environment

To start using this project, you need to get your computer configured so you can build and execute the code.
To do this, follow these steps; the specifics of each step (especially the first two) will vary based on which operating system your computer has:

1. [Install git](https://git-scm.com/downloads) (v2.X). After installing you should be able to execute `git --version` on the command line.

1. [Install Node LTS](https://nodejs.org/en/download/) (v14.17.X), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (v1.22+). You should be able to execute `yarn --version` afterwards.

1. Clone this repository by running `git clone https://github.com/sabrina-wan/InsightUBC`

1. Execute the following commands to run the project. `yarn install`, `yarn build`, `yarn test` (if you want to see unit test result) and `yarn run start`. Launch the application from `index.html`. Enter username and password to access the main function. For now, there's no way to sign up, use `username = w` and `password = 1` to proceed.

## Brief description of the project
This web application allow users to upload/remove two types of dataset - course sessions (in JSON format) and classrooms (in html format). Upon uploading the datasets, they are checked for validity and stored to disk for non-volatile storage. 

After uploading a dataset, you should be able to see it on "List all datasets" page. It will also tell you what type of dataset it is and how many entries/rows there are.

To query the datasets, go to "Query a dataset" page. Query grammars will be based on the EBNF described below.

```
QUERY ::= '{' BODY ', ' OPTIONS '}'
BODY ::= 'WHERE:{' FILTER? '}'
// Note: a BODY with no FILTER (i.e. WHERE:{}) matches all entries.
OPTIONS ::= 'OPTIONS:{' COLUMNS (', ORDER:' key )?'}'
FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION

LOGICCOMPARISON ::= LOGIC ':[{' FILTER ('}, {' FILTER )* '}]'
MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards.
NEGATION ::= 'NOT :{' FILTER '}'

LOGIC ::= 'AND' | 'OR'
MCOMPARATOR ::= 'LT' | 'GT' | 'EQ'

COLUMNS ::= 'COLUMNS:[' key (',' key)* ']'

key ::= mkey | skey
mkey ::= idstring '_' mfield
skey ::= idstring '_' sfield
mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year'
sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid'
idstring ::= [^_]+ // One or more of any character, except underscore.
inputstring ::= [^*]* // Zero or more of any character, except asterisk.
```
- ``WHERE`` defines which sections should be included in the results.
- ``COLUMNS`` defines which keys should be included in each result.
- ``ORDER`` defines what order the results should be in.

You can also control how the results are returned.

```
SORT ::= 'ORDER: ' ('{ dir:'  DIRECTION ', keys: [ ' ANYKEY (',' ANYKEY)* ']}') | ANYKEY
DIRECTION ::= 'UP' | 'DOWN' 
ANYKEY ::= key | applykey
GROUP ::= 'GROUP: [' (key ',')* key ']'                                                         
APPLY ::= 'APPLY: [' (APPLYRULE (', ' APPLYRULE )* )? ']' 
APPLYRULE ::= '{' applykey ': {' APPLYTOKEN ':' key '}}'
APPLYTOKEN ::= 'MAX' | 'MIN' | 'AVG' | 'COUNT' | 'SUM'
key ::= mkey | skey
mkey ::= idstring '_' mfield
skey ::= idstring '_' sfield
```

- The applykey in an APPLYRULE should be unique (no two APPLYRULEs should share an applykey with the same name).
- If a GROUP is present, all COLUMNS keys must correspond to one of the GROUP keys or to applykeys defined in the APPLY block.
- All SORT  keys must also be in the COLUMNS.
- MAX/MIN/AVG/SUM should only be requested for numeric keys. COUNT can be requested for all keys.
- A valid query will not contain keys from more than one dataset kind (i.e. only sections_xx keys or only rooms_xx keys, never a combination).

A sample query will look as follows:

```
{   
 "WHERE": {       
     "AND": [{           
        "IS": {               
            "rooms_furniture": "*Tables*"           
         }       
     }, {           
         "GT": {               
           "rooms_seats": 300           
          }       
    }]   
  },   
  "OPTIONS": {       
      "COLUMNS": [           
          "rooms_shortname",           
          "maxSeats"       
      ],       
  "ORDER": {           
     "dir": "DOWN",           
     "keys": ["maxSeats"]       
  }   
  },   
  "TRANSFORMATIONS": {       
      "GROUP": ["rooms_shortname"],       
      "APPLY": [{           
          "maxSeats": {               
              "MAX": "rooms_seats"           
           }       
      }]   
  }
}
```

## Room for improvement
- Use SQL as backend to minimize complication with parsing and querying.
- Add capacity to support multiple accounts, sign up and maintain different dataset for different users.
- This project still has lots of room to grow in terms of security. For now, users will have to launch the frontend from code base, which exposes the backend directly. A more secure application will allow users to access their dataset from an outside interface (e.g. a web application hosted in the cloud).