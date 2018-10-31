'use strict';

// setup environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// config logger
const config            = require('./config');
const log4js 			= require('log4js');

//log the messages to a file, and the console ones as well.
log4js.configure(config.logger);

const logger = log4js.getLogger('main');
logger.setLevel('INFO');


const colors = require( "colors");

const server            = require("./server");
const express           = require('express');
const bodyParser        = require('body-parser');
const jttservice        = require('./jt808');



const app = express();
const jtt = jttservice();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



app.use('/', express.static(__dirname + '/../out'));

app.use((req, res, next)=> {
	req.jtt = jtt;
	next();
});

require('./routes')(app);
require('./jtt/simple')(jtt);

const svr = server.createServer(jtt, (err)=> {
	logger.error(err);
});

// Start server
svr.listen(config.port, ()=> {
	logger.info('Server listening on %d, in %s mode', config.port, app.get('env'));
});

