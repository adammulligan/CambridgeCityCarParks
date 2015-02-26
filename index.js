var bunyan = require('bunyan'),
    log = bunyan.createLogger({
      name: 'cambridge_car_parks',
      streams: [{
        stream: process.stdout
      }]
    });

var request = require('request-promise'),
    cheerio = require('cheerio');

var Agenda = require('agenda'),
    agenda = new Agenda({db: { address: 'localhost:27017/cambridge_car_parks-agenda'}});

var MongoClient = require('mongodb').MongoClient;

var API_URL = "https://www.cambridge.gov.uk/sites/all/modules/jdi/modules/jdi_parking_ajax/car_park_status.php?p=complete";
var COUNT_REGEX = /(\d+) spaces \((.*)\)/;
var MONGO_URL = 'mongodb://localhost:27017/cambridge_car_parks';

var retrieveData = function(db, callback) {
  request(API_URL).then( function(body) {
    var $ = cheerio.load(body);

    $('h2').each( function() {
      var lot_name = $(this).text();
      var lot_info = $(this).next('p').text()

      if (lot_info === undefined) { return; }

      var matches = COUNT_REGEX.exec(lot_info);
      var spaces_available = matches[1];
      var extra_info = matches[2];

      var car_park_status = {
        "name": lot_name,
        "spaces_available": spaces_available,
        "extra_info": extra_info
      };

      log.info(car_park_status);

      var collection = db.collection(lot_name.toLowerCase().replace(/\s/g, "_"));
      collection.insert(car_park_status, callback);
    });
  });
}

log.info('Connecting to Mongo');

MongoClient.connect(MONGO_URL, function(err, db) {
  log.info('Connected to mongo, starting up...');

  agenda.define('retrieve parking space data', function(job, callback) { retrieveData(db, callback); });
  agenda.every('10 seconds', 'retrieve parking space data');
  agenda.start();
});
