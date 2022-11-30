// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let db_filename = path.join(__dirname, 'db', 'stpaul_crime_copy.sqlite3');

let app = express();
let port = 8000;

app.use(express.json());

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

function parseQueryString(q_string) {
    let key_values = q_string.substring(1).split('&');
    let i;
    let query_obj = {};
    for (i = 0; i < key_values.length; i++) {
        let key_val = key_values[i].split('=');
        query_obj[key_val[0]] = key_val[1];
    }
    return query_obj;
}

// GET request handler for crime codes
app.get('/codes', (req, res) => {
    let query = 'SELECT Codes.code, Codes.incident_type FROM Codes';
    console.log(req.query); // query object (key-value pairs after the ? in the url)

    let params = [];
    let clause = 'WHERE';

    
    if (req.query.hasOwnProperty('code')) {
        query = query + ' ' + clause + ' Codes.code = ?';
        params.push(parseFloat(req.query.code));

        clause = 'AND';
        

         //I think this would work for comma separated values 
        if (req.query.hasOwnProperty(',')) {
            let codes = req.query.split(',');
            for (let i=0; i < codes.length; i++) {
                query = query + ' ' + clause + ' Codes.code = ' + codes[i];
                params.push(parseFloat(req.query.code));
            }
        }
        
      
    }

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
        let split_name = req.query.name.split(',');
        query = query + ' ' + clause + ' Neighborhoods.neighborhood_name IN (?';
        params.push(split_name[0]);
        if(split_name.length > 0) {
            for(let j = 1; j < split_name.length; j++) {
                query = query + ' , ?';
                params.push(split_name[1]);
            }
        }
        query = query + ')';
        clause = 'AND';
    }


    db.all(query, params, (err, rows) => {
       // console.log(err);
       // console.log(rows);
        res.status(200).type('json').send(rows);
    });

});

// GET request handler for crime incidents
app.get('api/incidents', (req, res) => {
    
    let query = 'SELECT Incidents.case_number AS case_number, Incidents.date_time, Incidents.code, \
                Incidents.incident, Incidents.police_grid, Incidents.neighborhood_number,\
                Incidents.block FROM Incidents';

    console.log(req.query); // query object (key-value pairs after the ? in the url)

    let params = [];
    let clause = 'WHERE';
    /* if (req.query.hasOwnProperty('start_date')) {
        query = query + ' ' + clause + ' Incidents.date_time = ?';
        params.push(req.query.mfr.toUpperCase());
        clause = 'AND';
    }*/

    db.all(query, params, (err, rows) => {
        console.log(err);
        let data = [];
        let dateTime = [];

        for (i=0; i < rows.length; i++) {
            dateTime = rows[i].date_time.split("T");
            data[i] = {"case_number": rows[i].case_number, "date": dateTime[0],
            "time": dateTime[1], "code": rows[i].code, "incident": rows[i].incident, 
            "police_grid": rows[i].police_grid, "neighborhood_number": rows[i].neighborhood_number,
            "block": rows[i].block};
        }

        console.log(data);

        res.status(200).type('json').send(rows);
    });

    if (req.query.hasOwnProperty('code')) {
        query = query + ' ' + clause + ' Incidents.code = ?';
        params.push(parseFloat(req.query.code));
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('grid')) {
        query = query + ' ' + clause + ' Incidents.police_grid = ?';
        params.push(parseFloat(req.query.grid));
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('neighborhood')) {
        query = query + ' ' + clause + ' Incidents.neighborhood_number = ?';
        params.push(parseFloat(req.query.neighborhood));
        clause = 'AND';
    }

    if (req.query.hasOwnProperty('start_date')) {
        query = query + ' ' + clause + ' Incidents.date_time = ?';
        params.push(parseFloat(req.query.code));
        clause = 'AND';
    }

    /* res.status(200).type('json').send(databaseSelect(query, params)); // <-- you will need to change this*/
});

// PUT request handler for new crime incident
app.put('/api/new-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    if (req.params.hasOwnProperty('case_number') && req.params.hasOwnProperty('date') &&
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
    }

    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});

// DELETE request handler for new crime incident
app.delete('api/remove-incident/:case_number', (req, res) => {
    console.log(req.body); // uploaded data
    
    databaseRun('DELETE FROM Incidents WHERE case_number = ', req.params.case_number);

    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});


// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
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
}

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

