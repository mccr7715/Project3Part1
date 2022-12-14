// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
let cors = require('cors');

let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

let app = express();
let port = 8000;

app.use(express.json());
app.use(cors());

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

    db.all(query, params, (err, rows) => {
        res.status(200).type('json').send(rows);
     });
     
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    let query = 'SELECT Neighborhoods.neighborhood_number as id, Neighborhoods.neighborhood_name as name FROM Neighborhoods';
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
        res.status(200).type('json').send(rows);
    });

});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    
    let query = 'SELECT Incidents.case_number AS case_number, Incidents.date_time, Incidents.code, \
                Incidents.incident, Incidents.police_grid, Incidents.neighborhood_number,\
                Incidents.block FROM Incidents';
    let params = [];
    let clause = 'WHERE';

    if (req.query.hasOwnProperty('code')) {
        let split_code = req.query.code.split(',');
        query = query + ' ' + clause + ' Incidents.code IN (?';
        params.push(split_code[0]);
        if(split_code.length > 0) {
            for(let j = 0; j < split_code.length; j++) {
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

    query = query + ' ORDER BY date_time DESC';

    if (req.query.hasOwnProperty('limit')) {
        int_limit = parseInt(req.query.limit);
        query = query + ' LIMIT ' + int_limit;
        clause = 'AND';
    }

    if (!req.query.hasOwnProperty('limit')) {
        query = query + ' LIMIT 1000';
    }

    db.all(query, params, (err, rows) => {
        let data = [];
        let dateTime = [];
        for (i=0; i < rows.length; i++) {
            dateTime = rows[i].date_time.split("T");
            data[i] = {"case_number": rows[i].case_number, "date": dateTime[0],
            "time": dateTime[1], "code": rows[i].code, "incident": rows[i].incident, 
            "police_grid": rows[i].police_grid, "neighborhood_number": rows[i].neighborhood_number,
            "block": rows[i].block};
        }

        res.status(200).type('json').send(data);
    });

});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    let query = 'SELECT * FROM Incidents WHERE Incidents.case_number = ' + req.body.case_number;

    let params = [];
    db.all(query, (err, rows) => {
        if (rows.length > 0) {
            console.log("Error: Case number already exists. Please try again.")
            res.status(500).type('txt').send(err);
        }
        else {
            console.log("Adding new incident...");
            let new_incident_query = "INSERT INTO Incidents (case_number, date_time, code, incident, \
                police_grid, neighborhood_number, block) VALUES (" + req.body.case_number + ", '" + req.body.date + "\
                T" + req.body.time + "', " + req.body.code + ", '" + req.body.incident + "', " + req.body.police_grid + "\
                , " + req.body.neighborhood_number + ", '" + req.body.block + "')";

            db.run(new_incident_query, params, (err) => {
                if (err) { 
                    res.status(404).type('txt').send(err);
                }
                else {
                    console.log("Successfully added new incident.");
                }
            });
        }
    });

});

// DELETE request handler for new crime incident
app.delete('/remove-incident', (req, res) => {
    let query = 'SELECT * FROM Incidents WHERE Incidents.case_number = ' + req.body.case_number;

    db.all(query, (err, rows) => {
        if (rows.length > 0) {
            let deletequery = 'DELETE FROM Incidents WHERE case_number = ?';
            db.run(deletequery, parseInt(req.body.case_number), (err) => {
                if (err) { 
                    res.status(404).type('txt').send(err);
                }
                else {
                    res.status(200).type('txt').send('Data deleted');
                }
            });
        }
        else {
            res.status(500).type('txt').send('Error: Case number does not exist.');
        }
    });

});

// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});

