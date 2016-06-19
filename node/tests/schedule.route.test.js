/*
 * Copyright (c) 2015 Engineering Design Team (EDT), Inc.
 * All rights reserved.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * This file is subject to the terms and conditions of the EULA defined at
 * www.edt.com/terms-of-use
 *
 * Author: <Cameron Kidd>
 * Email: <cameron@edt.com>
 */

/**
 * Use Mocha JS framework (https://mochajs.org/),
 * to test node server routes/REST endpoints.
 * Start server: node server.js
 * Run test: mocha -R spec <path to test>
 *   e.g. mocha -R spec tests/schedule.route.test.js
 */
'use strict';
process.env.NODE_ENV = 'development';
var utils = require('./utils');
var config = require('../app/config');
var baseUri = 'https://localhost:' + config.port + '/usnap';
var expect = require('chai').expect;  // chai is a javascript assertion library.
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var mongoose = require('mongoose');
var snapshotModel = require('../app/models/snapshot');
var configModel = require('../app/models/config');
var Snapshot = mongoose.model('Snapshot');
var Config = mongoose.model('Config');
var fs = require('fs');
var cert = fs.readFileSync('cert/cacert.pem');
var request = require('superagent');
var env = require('../app/env/' + process.env.NODE_ENV);


chai.use(chaiHttp);

describe('Test base uri', function(done) {
  it('should respond to GET', function(done) {
    request
      .get(baseUri)
      .ca(cert)
      .end(function (err, response) {
        expect(response.body.message).to.equal('hello world!');
        done();

      });
  });
});

/**
 * Schedule a snapshot but don't specify a config.
 * Tests the schedule route, saves a schedule into
 * the test database, then verifies the schedule
 * was saved as expected.
 */
describe('Test scheduling a snapshot without a config', function(done) {
  it('PUT a schedule with no config', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10
      })
      .end(function(err, response) {
        response.should.have.status(201);
        response.should.be.json;
        /* query the data base to make sure the
           snapshot was saved.
         */
        Snapshot.findById(response.body.id).exec(function(err, snapshot) {
          if (err) {
            console.log(err);
          }
          expect(snapshot.duration).to.equal(2);
          expect(snapshot.input_width).to.equal(10);
          expect(snapshot.rf_input_num).to.equal(0);
          expect(snapshot.input_center_freq).to.equal(155520000);
          done();
          });
      });
  });
});

/**
 * Tests the schedule route while passing in a config name.  Since the database
 * starts out empty passing in a config name initiates the creation of
 * a config in the database.  This test will first create the config,
 * save it to the database, save the snapshot to the database, then verify
 * that both were stored correctly.  Finally, it will use the
 * newly stored config by scheduling another snapshot.
 */
describe('Test scheduling a snapshot with a config', function(done) {
  it('PUTS a schedule, uses a created config', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000,
        'config_name': 'testCfg'
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        Config.findOne({'config_name': 'testCfg'}, function(err, config)
        {
          expect(config.rf_input_num).to.equal(1);
          expect(config.input_width).to.equal(12000);
          expect(config.input_center_freq).to.equal(155520000);

          request
            .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
            .ca(cert)
            .send({
              'snap_name': 'testSnapTwo',
              'duration': 11,
              'start_time': date,
              'config_name': 'testCfg'
            })
            .end(function (error, response) {
              response.should.have.status(201);
              response.should.be.json;
              expect(response.body.snap_name).to.equal('testSnapTwo');

              Snapshot.findOne({snap_name: 'testSnapTwo'}, function(err, snap) {
                expect(snap.rf_input_num).to.equal(1);
                expect(snap.input_width).to.equal(12000);
                expect(snap.input_center_freq).to.equal(155520000);
                expect(snap.duration).to.equal(11);
                done();
              });

            });
        });

      });
  });
});

/**
 * Test scheduling a snapshot then deleting it.
 * 1. Schedule a snapshot
 * 2. Verify that it is in the datbase
 * 3. Delete snapshot schedule by using it's name
 * 4. Verify it no longer exists in the database.
 */
describe('Test deleting a scheduled snapshot using its name', function(done) {
  it('PUTs a schedule in the database then deletes it', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version +'/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;

        Snapshot.findById(response.body.id).exec(function(err, snapshot) {
          if (err) {
            console.log(err);
          }
          expect(snapshot.duration).to.equal(11);
          expect(snapshot.input_width).to.equal(12000);
          expect(snapshot.rf_input_num).to.equal(1);
          expect(snapshot.input_center_freq).to.equal(155520000);
          expect(snapshot.snap_name).to.equal('testSnap');

          request
            .delete('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/name/' + snapshot.snap_name)
            .ca(cert)
            .end(function (error, response) {
              response.should.have.status(200);
              response.should.be.json;
              expect(response.body.snap_name).to.equal('testSnap');
              expect(response.body.duration).to.equal(11);
              expect(response.body.rf_input_num).to.equal(1);
              expect(response.body.input_center_freq).to.equal(155520000);
              expect(response.body.input_width).to.equal(12000);

              Snapshot.findById(response.body.id).exec(function(err, snapshot) {
                expect(snapshot).to.be.null;
                done();
              });
            });
        });
      });
  });
});

/**
 * Test scheduling a snapshot then deleting it.
 * 1. Schedule a snapshot
 * 2. Verify that it is in the datbase
 * 3. Delete snapshot schedule by using it's id
 * 4. Verify it no longer exists in the database.
 */
describe('Test deleting a scheduled snapshot using its name', function(done) {
  it('PUTs a schedule in the database then deletes it', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;

        Snapshot.findById(response.body.id).exec(function(err, snapshot) {
          if (err) {
            console.log(err);
          }
          expect(snapshot.duration).to.equal(11);
          expect(snapshot.input_width).to.equal(12000);
          expect(snapshot.rf_input_num).to.equal(1);
          expect(snapshot.input_center_freq).to.equal(155520000);
          expect(snapshot.snap_name).to.equal('testSnap');

          request
            .delete('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/' + snapshot._id)
            .ca(cert)
            .end(function (error, response) {
              response.should.have.status(200);
              response.should.be.json;
              expect(response.body.snap_name).to.equal('testSnap');
              expect(response.body.duration).to.equal(11);
              expect(response.body.rf_input_num).to.equal(1);
              expect(response.body.input_center_freq).to.equal(155520000);
              expect(response.body.input_width).to.equal(12000);

              Snapshot.findById(response.body.id).exec(function(err, snapshot) {
                expect(snapshot).to.be.null;
                done();
              });
            });
        });
      });
  });
});

/**
 * Test scheduling a snapshot then deleting it.
 * 1. Schedule a snapshot
 * 2. Verify that it is in the datbase
 * 3. Try to delete snapshot, but send bad id.
 * 4. Verify 404 status return.
 */
describe('Test deleting a scheduled snapshot with bad id', function(done) {
  it('PUTs a schedule in the database then tries to delete it but fails', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;

        Snapshot.findById(response.body.id).exec(function(err, snapshot) {
          if (err) {
            console.log(err);
          }
          expect(snapshot.duration).to.equal(11);
          expect(snapshot.input_width).to.equal(12000);
          expect(snapshot.rf_input_num).to.equal(1);
          expect(snapshot.input_center_freq).to.equal(155520000);
          expect(snapshot.snap_name).to.equal('testSnap');

          request
            .delete('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/' + (snapshot._id + 1))
            .ca(cert)
            .end(function (error, response) {
              response.should.have.status(404);
              done();
            });
        });
      });
  });
});

/**
 * Test scheduling a snapshot then deleting it.
 * 1. Schedule a snapshot
 * 2. Verify that it is in the datbase
 * 3. Try to delete snapshot, but send bad name.
 * 4. Verify 404 status return.
 */
describe('Test deleting a scheduled snapshot with bad name', function(done) {
  it('PUTs a schedule in the database then tries to delete it but fails', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;

        Snapshot.findById(response.body.id).exec(function(err, snapshot) {
          if (err) {
            console.log(err);
          }
          expect(snapshot.duration).to.equal(11);
          expect(snapshot.input_width).to.equal(12000);
          expect(snapshot.rf_input_num).to.equal(1);
          expect(snapshot.input_center_freq).to.equal(155520000);
          expect(snapshot.snap_name).to.equal('testSnap');

          request
            .delete('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/name/badSnap')
            .ca(cert)
            .end(function (error, response) {
              response.should.have.status(404);
              done();
            });
        });
      });
  });
});

/**
 * Test scheduling multiple snapshots then do a delete all.
 * 1. Schedule two snapshots
 * 2. Verify that they are in the datbase
 * 3. Send command to delete entire schedule
 * 4. Verify the database is empty
 */
describe('Test deleting a scheduled snapshot with bad name', function(done) {
  it('PUTs a schedule in the database then tries to delete it but fails', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;

        Snapshot.findById(response.body.id).exec(function (err, snapshot) {
          if (err) {
            console.log(err);
          }
          expect(snapshot.duration).to.equal(11);
          expect(snapshot.input_width).to.equal(12000);
          expect(snapshot.rf_input_num).to.equal(1);
          expect(snapshot.input_center_freq).to.equal(155520000);
          expect(snapshot.snap_name).to.equal('testSnap');

          request
            .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
            .ca(cert)
            .send({
              'snap_name': 'testSnap2',
              'duration': 11,
              'start_time': date,
              'rf_input_num': 1,
              'input_center_freq': 155520000,
              'input_width': 12000
            })
            .end(function (error, response) {
              response.should.have.status(201);
              response.should.be.json;

              Snapshot.findById(response.body.id).exec(function (err, snapshot) {
                if (err) {
                  console.log(err);
                }
                expect(snapshot.duration).to.equal(11);
                expect(snapshot.input_width).to.equal(12000);
                expect(snapshot.rf_input_num).to.equal(1);
                expect(snapshot.input_center_freq).to.equal(155520000);
                expect(snapshot.snap_name).to.equal('testSnap2');

                request
                  .delete('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
                  .ca(cert)
                  .end(function (error, response) {
                    response.should.have.status(204);

                    Snapshot.find({}, function( err, snapshots) {
                      expect(snapshots.length).to.equal(0);
                      done();
                    });
                  });
              });
            });
        });
      });
  });
});

/*
 *  Test getting the complete list of scheduled snapshots
 *  1. Schedule two snapshots
 *  2. GET the schedules
 *  3. Verify the response, should return array of JSON objs
 */
describe('Test the get schedule route', function (done) {
  it('Schedules 2 snapshots then does a GET', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        request
          .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
          .ca(cert)
          .send({
            'snap_name': 'testSnap2',
            'duration': 11,
            'start_time': date,
            'rf_input_num': 1,
            'input_center_freq': 155520000,
            'input_width': 12000
          })
          .end(function (error, response) {
            response.should.have.status(201);
            response.should.be.json;
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
              .ca(cert)
              .end(function (error, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.length).to.equal(2);
                expect(response.body[0].snap_name).to.equal('testSnap');
                expect(response.body[1].snap_name).to.equal('testSnap2');
                done();
              });
          });
      });
  });
});

describe('Test the get schedule route by name', function (done) {
  it('Schedules a snapshots then does a GET', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        request
          .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/name/testSnap')
          .ca(cert)
          .end(function (error, response) {
            response.should.have.status(200);
            response.should.be.json;
            expect(response.body.snap_name).to.equal('testSnap');
            done();
          });
      });
  });
});

describe('Test the get schedule route by id', function (done) {
  it('Schedules a snapshots then does a GET', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        request
          .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/' + response.body.id)
          .ca(cert)
          .end(function (error, response) {
            response.should.have.status(200);
            response.should.be.json;
            expect(response.body.snap_name).to.equal('testSnap');
            done();
          });
      });
  });
});

describe('Tests creating and updating a schedule by name', function (done) {
  it('PUTs a schedule then PUTs by name, GETs schedule to verify update', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        request
          .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/name/testSnap')
          .ca(cert)
          .send({
            'duration': 12
          })
          .end(function (error, response) {
            response.should.have.status(200);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/name/testSnap')
              .ca(cert)
              .end(function (error, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.snap_name).to.equal('testSnap');
                expect(response.body.duration).to.equal(12);
                done();
              });
          });
      });
  });
});

describe('Tests creating and updating a schedule by id', function (done) {
  it('PUTs a schedule then PUTs by name, GETs schedule to verify update', function (done) {
    var date = Date.now();
    var id;
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 11,
        'start_time': date,
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        id = response.body.id;
        request
          .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/' + id)
          .ca(cert)
          .send({
            'duration': 12
          })
          .end(function (error, response) {
            response.should.have.status(200);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/' + id)
              .ca(cert)
              .end(function (error, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.snap_name).to.equal('testSnap');
                expect(response.body.duration).to.equal(12);
                done();
              });
          });
      });
  });
});
