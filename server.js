// Built-in Node.js modules
let fs = require('fs');
let path = require('path');
//let cors = require('cors');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let db_filename = path.join(__dirname, 'db', 'stpaul_crime_copy.sqlite3');

let app = express();
let port = 8000;

app.use(express.json());
//app.use(cors());

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

// GET request handler for crime codes
app.get('/codes', (req, res) => {
    let query = 'SELECT Codes.code, Codes.incident_type FROM Codes';
    console.log(req.query); // query object (key-value pairs after the ? in the url)

    let params = [];
    let clause = 'WHERE';

    if(req.query.hasOwnProperty('code')){
        let codes_split = req.query.code.split(',');
        query = query + ' ' + clause + ' Codes.code IN (?';
        params.push(codes_split[0]);
        if(codes_split.length > 0) {
            for(let j = 1; j < codes_split.length; j++) {
                query = query + ' , ?';
                params.push(codes_split[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }
    /*
    if (req.query.hasOwnProperty('code')) {
        query = query + ' ' + clause + ' Codes.code = ?';
        params.push(parseFloat(req.query.code));

        clause = 'AND';
        

         //I think this would work for comma separated values 
        if (req.query.hasOwnProperty(',')) {
            let codes = req.query.code.split(',');
            query = query + clause + 
            for (let i=0; i < codes.length; i++) {
                query = query + ' ' + clause + ' Codes.code = ' + codes[i];
                params.push(parseFloat(req.query.code));
            }
        }
        
      */
    

    db.all(query, params, (err, rows) => {
        console.log(err);
        console.log(rows);
        res.status(200).type('json').send(rows);
     });
     
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
     let query = 'SELECT Neighborhoods.neighborhood_number as id, Neighborhoods.neighborhood_name as name FROM Neighborhoods';

    console.log(req.query); // query object (key-value pairs after the ? in the url)
    
    //console.log(req.query); // query object (key-value pairs after the ? in the url)

    let params = [];
    let clause = 'WHERE';

     if(req.query.hasOwnProperty('id')){
        let split_id = req.query.id.split(',');
        query = query + ' ' + clause + ' Neighborhoods.neighborhood_number IN (?';
        params.push(split_id[0]);
        if(split_id.length > 0) {
            for(let j = 1; j < split_id.length; j++) {
                query = query + ' , ?';
                params.push(split_id[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }
   
    if(req.query.hasOwnProperty('name')){
        let split_name = req.query.name.split(',');
        query = query + ' ' + clause + ' Neighborhoods.neighborhood_name IN (?';
        params.push(split_name[0]);
        if(split_name.length > 0) {
            for(let j = 1; j < split_name.length; j++) {
                query = query + ' , ?';
                params.push(split_name[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }


    db.all(query, params, (err, rows) => {
       // console.log(err);
       // console.log(rows);
        res.status(200).type('json').send(rows);
    });

});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    
    let query = 'SELECT Incidents.case_number AS case_number, Incidents.date_time, Incidents.code, \
                Incidents.incident, Incidents.police_grid, Incidents.neighborhood_number,\
                Incidents.block FROM Incidents';

   // console.log(req.query); // query object (key-value pairs after the ? in the url)

    let params = [];
    let clause = 'WHERE';

    if (req.query.hasOwnProperty('code')) {
        let split_code = req.query.code.split(',');
        query = query + ' ' + clause + ' Incidents.code IN (?';
        params.push(split_code[0]);
        if(split_code.length > 0) {
            for(let j = 1; j < split_code.length; j++) {
                query = query + ' , ?';
                params.push(split_code[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('grid')) {
        let split_grid = req.query.grid.split(',');
        query = query + ' ' + clause + ' Incidents.police_grid IN (?';
        params.push(split_grid[0]);
        if(split_grid.length > 0) {
            for(let j = 1; j < split_grid.length; j++) {
                query = query + ' , ?';
                params.push(split_grid[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('neighborhood')) {
        let split_neighborhood = req.query.neighborhood.split(',');
        query = query + ' ' + clause + ' Incidents.neighborhood_number IN (?';
        params.push(split_neighborhood[0]);
        if(split_neighborhood.length > 0) {
            for(let j = 1; j < split_neighborhood.length; j++) {
                query = query + ' , ?';
                params.push(split_neighborhood[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('start_date')) {
        date = '"' + req.query.start_date + '"';
        query = query + ' ' + clause + ' Incidents.date_time >= ' + date;
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('end_date')) {
        date = '"' + req.query.end_date + '"';
        query = query + ' ' + clause + ' Incidents.date_time <= ' + date;
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('limit')) {
        int_limit = parseInt(req.query.limit);
        query = query + ' LIMIT ' + int_limit;
        clause = 'AND';
    }

    db.all(query, params, (err, rows) => {
      //  console.log(err);
        let data = [];
        let dateTime = [];

        for (i=0; i < rows.length; i++) {
            dateTime = rows[i].date_time.split("T");
            data[i] = {"case_number": rows[i].case_number, "date": dateTime[0],
            "time": dateTime[1], "code": rows[i].code, "incident": rows[i].incident, 
            "police_grid": rows[i].police_grid, "neighborhood_number": rows[i].neighborhood_number,
            "block": rows[i].block};
        }

       // console.log(data);

        res.status(200).type('json').send(rows);
    });

    /* res.status(200).type('json').send(databaseSelect(query, params)); // <-- you will need to change this*/
});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    if ('IF NOT EXISTS (SELECT case_number FROM Incidents)') {
        let params = [];

        params.push(req.body.case_number);
        params.push(req.body.date + 'T' + req.body.time);
        params.push(req.body.code);
        params.push(req.body.incident);
        params.push(req.body.police_grid);
        params.push(req.body.neighborhood_number);
        params.push(req.body.block);

        dateTime = '' + req.body.date + ' ' + req.body.time;

        let insertquery = 'DECLARE @Date DATE = ' + req.body.date + ', @Time TIME = ' + req.body.time +'; \
            SELECT DateTime1=CAST(@Date AS DATETIME) + CAST(@Time AS DATETIME); \
            INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) \
            VALUES (' + req.body.case_number + ', ' + dateTime + ', ' + req.body.code + '\
            , ' + req.body.incident + ', ' + req.body.police_grid + ', ' + req.body.neighborhood_number + '\
            , ' + req.body.block + ')';
        databaseRun(insertquery, params);
        res.status(200).type('txt').send('Data inserted');
    }
    else {
        res.status(500).type('txt').send('Error: Case number already exist.');
    }

    /*
    if ('IF EXISTS (SELECT case_number FROM Incidents' == false) {
        res.status(500);
    }
    else {
        for (i = 0; i < rows.length; i++) {
                let query = 'INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) \
                VALUES (' + req.params.case_number + ', ' + req.params.date + 'T' + req.params.time + ', ' + req.params.code + '\
                , ' + req.params.incident + ', ' + req.params.police_grid + ', ' + req.params.neighborhood_number + '\
                , ' + req.params.block + ')';

                console.log()

                db.all(query, params, (err, rows) => {
                    console.log(err);
                    console.log(rows);
                    res.status(200).type('json').send(rows);
                });
        }
    }*/

    /*if (req.params.hasOwnProperty('case_number') && req.params.hasOwnProperty('date') &&
    req.params.hasOwnProperty('time') && req.params.hasOwnProperty('code') && 
    req.params.hasOwnProperty('incident') && req.params.hasOwnProperty('police_grid') &&
    req.params.hasOwnProperty('neighborhood_number') && req.params.hasOwnProperty('block')) {
        for (i = 0; i < rows.length; i++) {
            if (rows[i].case_number == req.params.case_number) {
                res.status(500);
            }
            else {
                let query = 'INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) \
                VALUES (' + req.params.case_number + ', ' + req.params.date + 'T' + req.params.time + ', ' + req.params.code + '\
                , ' + req.params.incident + ', ' + req.params.police_grid + ', ' + req.params.neighborhood_number + '\
                , ' + req.params.block + ')';

                console.log()

                db.all(query, params, (err, rows) => {
                    console.log(err);
                    console.log(rows);
                    res.status(200).type('json').send(rows);
                });
            }
        }
    }
    else {
        res.status(200).type('txt').send('Error: Cannot add new incident');
    }*/

    /*res.status(200).type('txt').send('OK'); // <-- you may need to change this*/
});

// DELETE request handler for new crime incident
app.delete('/remove-incident', (req, res) => {
    console.log(req.body); // uploaded data
    if ('IF EXISTS (SELECT case_number FROM Incidents)') {
        let deletequery = 'DELETE FROM Incidents WHERE case_number = ?';
        databaseRun(deletequery, parseInt(req.body.case_number));
        res.status(200).type('txt').send('Data deleted');
    }
    else {
        res.status(500).type('txt').send('Error: Case number does not exist.');
    }
});


// Create Promise for SQLite3 database SELECT query 
/*function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        })
    })
}*/

// Create Promise for SQLite3 database INSERT or DELETE query
function databaseRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}


// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});

