var bunyan = require('bunyan'),
    log = bunyan.createLogger({
      name: 'cambridge_car_parks',
      streams: [{
        type: 'file',
        path: './car_parks.log'
      }, {
        stream: process.stdout
      }]
    });

var request = require('request-promise'),
    cheerio = require('cheerio');

var Agenda = require('agenda'),
    agenda = new Agenda({db: { address: 'localhost:27017/car-park-agenda'}});

var API_URL = "https://www.cambridge.gov.uk/sites/all/modules/jdi/modules/jdi_parking_ajax/car_park_status.php?p=complete";
var COUNT_REGEX = /(\d+) spaces \((.*)\)/;

var retrieveData = function(job, done) {
  request(API_URL).then( function(body) {
    var $ = cheerio.load(body);

    $('h2').each( function() {
      var lot_name = $(this).text();
      var lot_info = $(this).next('p').text()

      var matches = COUNT_REGEX.exec(lot_info);
      var spaces_available = matches[1];
      var extra_info = matches[2];

      log.info({
        "name": lot_name,
        "spaces_available": spaces_available,
        "extra_info": extra_info
      });

      done();
    });
  });
};

log.info('Starting up');

agenda.define('retrieve parking space data', retrieveData);
agenda.every('5 minutes', 'retrieve parking space data');
agenda.start();
